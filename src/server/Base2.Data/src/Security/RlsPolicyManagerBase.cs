using Microsoft.EntityFrameworkCore.Migrations;

namespace Base2.Data.Security;

/// <summary>
/// Base class for RLS policy management providing common functionality.
/// Concrete implementations specify database name, user, and tables.
/// </summary>
public abstract class RlsPolicyManagerBase
{
    /// <summary>
    /// The database name for GRANT statements.
    /// </summary>
    protected abstract string DatabaseName { get; }

    /// <summary>
    /// The application user/role name for RLS.
    /// </summary>
    protected abstract string AppUserName { get; }

    /// <summary>
    /// Tables that have both group_id and tenant_id columns.
    /// These tables are scoped by both reseller (group) and customer (tenant).
    /// </summary>
    protected abstract string[] TablesWithGroupAndTenant { get; }

    /// <summary>
    /// Tables that have only tenant_id column.
    /// These tables are scoped only by customer (tenant).
    /// </summary>
    protected abstract string[] TablesWithTenantOnly { get; }

    /// <summary>
    /// Tables that have only group_id column.
    /// These tables are scoped only by reseller/partner (group).
    /// </summary>
    protected abstract string[] TablesWithGroupOnly { get; }

    /// <summary>
    /// Enables RLS and creates policies for all tables.
    /// Call this from your migration's Up() method.
    /// </summary>
    /// <param name="migrationBuilder">The migration builder instance</param>
    public void EnableRls(MigrationBuilder migrationBuilder)
    {
        // Create role if it doesn't exist (idempotent)
        // Previously: migrationBuilder.Sql($"CREATE ROLE {AppUserName} LOGIN");
        // NOTE: Set password via ops: ALTER ROLE my_app WITH PASSWORD '...';
        migrationBuilder.Sql($@"
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{AppUserName}') THEN
                    CREATE ROLE {AppUserName} LOGIN;
                END IF;
            END $$;");

        // Add them to groups
        //   GRANT app_rw TO my_app;

        // Optional: set the search_path for convenience
        //   ALTER ROLE my_app       IN DATABASE yourdb SET search_path = app, public;

        migrationBuilder.Sql($"GRANT CONNECT ON DATABASE {DatabaseName} TO {AppUserName};");
        migrationBuilder.Sql($"GRANT USAGE ON SCHEMA public TO {AppUserName};");

        // Admin user would be different:
        //   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_user;
        //   ALTER USER admin_user BYPASSRLS; -- Can see all data
        migrationBuilder.Sql($"GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {AppUserName};");

        // Create the policy functions first
        CreatePolicyFunctions(migrationBuilder);

        // Enable RLS and create policies for tables with both group_id and tenant_id
        foreach (var table in TablesWithGroupAndTenant)
        {
            migrationBuilder.Sql($"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"CREATE POLICY rls_policy ON {table} FOR ALL USING (rls_group_tenant_policy(group_id, tenant_id));");
        }

        // Enable RLS and create policies for tables with tenant_id only
        foreach (var table in TablesWithTenantOnly)
        {
            migrationBuilder.Sql($"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"CREATE POLICY rls_policy ON {table} FOR ALL USING (rls_tenant_policy(tenant_id));");
        }

        // Enable RLS and create policies for tables with group_id only
        foreach (var table in TablesWithGroupOnly)
        {
            migrationBuilder.Sql($"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql($"CREATE POLICY rls_policy ON {table} FOR ALL USING (rls_group_policy(group_id));");
        }
    }

    /// <summary>
    /// Disables RLS and removes all policies.
    /// Call this from your migration's Down() method.
    /// </summary>
    /// <param name="migrationBuilder">The migration builder instance</param>
    public void DisableRls(MigrationBuilder migrationBuilder)
    {
        // Drop all policies
        foreach (var table in TablesWithGroupAndTenant.Concat(TablesWithTenantOnly).Concat(TablesWithGroupOnly))
        {
            migrationBuilder.Sql($"DROP POLICY IF EXISTS rls_policy ON {table};");
        }

        // Disable RLS on all tables
        foreach (var table in TablesWithGroupAndTenant.Concat(TablesWithTenantOnly).Concat(TablesWithGroupOnly))
        {
            migrationBuilder.Sql($"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;");
        }

        // Drop the policy functions
        DropPolicyFunctions(migrationBuilder);
    }

    /// <summary>
    /// Creates the PostgreSQL functions used by RLS policies.
    /// </summary>
    protected virtual void CreatePolicyFunctions(MigrationBuilder migrationBuilder)
    {
        // Function for tables with both group_id and tenant_id
        migrationBuilder.Sql(@"
            CREATE OR REPLACE FUNCTION rls_group_tenant_policy(
                table_group_id uuid,
                table_tenant_id uuid
            ) RETURNS boolean AS $$
            DECLARE
                group_id_setting text;
                tenant_ids_setting text;
            BEGIN
                group_id_setting := current_setting('app.group_id', true);
                tenant_ids_setting := current_setting('app.tenant_ids', true);

                RETURN (
                    group_id_setting IS NOT NULL
                    AND group_id_setting != ''
                    AND table_group_id = uuid(group_id_setting)
                    AND (
                        tenant_ids_setting IS NULL
                        OR tenant_ids_setting = ''
                        OR table_tenant_id = ANY (string_to_array(tenant_ids_setting, ',')::uuid[])
                    )
                );
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;");

        // Function for tables with tenant_id only
        migrationBuilder.Sql(@"
            CREATE OR REPLACE FUNCTION rls_tenant_policy(
                table_tenant_id uuid
            ) RETURNS boolean AS $$
            DECLARE
                tenant_id_setting text;
            BEGIN
                tenant_id_setting := current_setting('app.tenant_id', true);

                RETURN (
                    tenant_id_setting IS NOT NULL
                    AND tenant_id_setting != ''
                    AND table_tenant_id = uuid(tenant_id_setting)
                );
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;");

        // Function for tables with group_id only
        migrationBuilder.Sql(@"
            CREATE OR REPLACE FUNCTION rls_group_policy(
                table_group_id uuid
            ) RETURNS boolean AS $$
            DECLARE
                group_id_setting text;
            BEGIN
                group_id_setting := current_setting('app.group_id', true);

                RETURN (
                    group_id_setting IS NOT NULL
                    AND group_id_setting != ''
                    AND table_group_id = uuid(group_id_setting)
                );
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;");
    }

    /// <summary>
    /// Drops the PostgreSQL functions used by RLS policies.
    /// </summary>
    protected virtual void DropPolicyFunctions(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS rls_group_tenant_policy(uuid, uuid);");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS rls_tenant_policy(uuid);");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS rls_group_policy(uuid);");
    }
}

