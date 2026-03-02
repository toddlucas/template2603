# RLS Migration Scripts

## Overview

This folder contains Python scripts and templates for automating Row-Level Security (RLS) migration generation.

## Files

### Python Scripts
- **`replace-migration-methods.py`** - Generic script that replaces Up() and Down() methods in EF Core migrations with content from template files.

### Template Files

#### App (AppDbContext)
- **`rls-app-up.txt`** - Template for enabling RLS on AppDbContext tables
- **`rls-app-down.txt`** - Template for disabling RLS on AppDbContext tables

#### Warehouse
- **`rls-warehouse-up.txt`** - Template for enabling RLS on WarehouseDbContext tables
- **`rls-warehouse-down.txt`** - Template for disabling RLS on WarehouseDbContext tables

## Usage

### For App (OLTP) Migrations

```cmd
.\Scripts\replace-migration-methods.py ^
    --up .\Scripts\rls-app-up.txt ^
    --down .\Scripts\rls-app-down.txt ^
    --no-backup ^
    --file-pattern "..\..\Base2.Data.Npgsql\src\Migrations\App\*_EnableRowLevelSecurity.cs"
```

This is automatically called by `reset-npgsql-app-database.cmd`.

### For Warehouse (Data Plane) Migrations

```cmd
.\Scripts\replace-migration-methods.py ^
    --up .\Scripts\rls-warehouse-up.txt ^
    --down .\Scripts\rls-warehouse-down.txt ^
    --no-backup ^
    --file-pattern "..\..\Base2.Data.Npgsql\src\Migrations\Warehouse\*_EnableRowLevelSecurity.cs"
```

This is automatically called by `reset-npgsql-warehouse-database.cmd`.

## How It Works

1. **Template Selection**: Each database context has its own templates that reference the appropriate policy manager:
   - App templates → `AppPolicyManager.Instance`
   - Warehouse templates → `WarehousePolicyManager.Instance`

2. **Method Replacement**: The Python script finds the Up() and Down() methods in migration files and replaces their bodies with content from the template files.

3. **Markers**: The script adds markers (`// >>> BEGIN MIGRATION UP (AUTO)`) to track what it has replaced, allowing idempotent updates.

## Script Options

```bash
python replace-migration-methods.py [options]

Options:
  file                Path to single .cs migration file
  --file-pattern      Pattern to find multiple migration files (e.g., '*_EnableRowLevelSecurity.cs')
  --up                Path to template file for Up() method
  --down              Path to template file for Down() method
  --up-text           Literal text for Up() method (ignored if --up is provided)
  --down-text         Literal text for Down() method (ignored if --down is provided)
  --no-backup         Skip creating .bak backup files
```

## Example Migration Output

After running the script, migrations will look like:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // >>> BEGIN MIGRATION UP (AUTO)
    if (ActiveProvider != "Npgsql.EntityFrameworkCore.PostgreSQL")
        return;

    AppPolicyManager.Instance.EnableRls(migrationBuilder);
    // <<< END MIGRATION UP (AUTO)
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    // >>> BEGIN MIGRATION DOWN (AUTO)
    if (ActiveProvider != "Npgsql.EntityFrameworkCore.PostgreSQL")
        return;

    AppPolicyManager.Instance.DisableRls(migrationBuilder);
    // <<< END MIGRATION DOWN (AUTO)
}
```

## Adding a New Database Context

If you add a third database context (e.g., AnalyticsDbContext):

1. Create policy manager: `AnalyticsPolicyManager.cs`
2. Create templates: `rls-analytics-up.txt` and `rls-analytics-down.txt`
3. Update templates to reference: `AnalyticsPolicyManager.Instance`
4. Create reset script: `reset-npgsql-analytics-database.cmd`
5. Reference new templates in the reset script

## Related Documentation

- [RLS Policy Manager Refactoring](../../../doc/plans/server/2025-12-06_rls-policy-manager-refactoring.md) - Design decisions
- [RLS Scripts Refactoring](../../../doc/plans/server/2025-12-06_rls-scripts-refactoring.md) - Script implementation details
- [Enabling RLS for Warehouse](../../../doc/guides/server/enabling-rls-for-warehouse.md) - Step-by-step setup

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team

