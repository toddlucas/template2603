using Base2.Data.Security;

namespace Base2.Data;

/// <summary>
/// RLS policy manager for AppDbContext (control plane).
/// Manages policies for users, tenants, organizations, and access control.
/// </summary>
public sealed class AppPolicyManager : RlsPolicyManagerBase
{
    private static readonly AppPolicyManager _instance = new();

    /// <summary>
    /// Gets the singleton instance of the App policy manager.
    /// </summary>
    public static AppPolicyManager Instance => _instance;

    private AppPolicyManager() { }

    protected override string DatabaseName => "product_name";
    protected override string AppUserName => "product_name_user";

    protected override string[] TablesWithGroupAndTenant =>
    [
        // Add control plane tables with both group + tenant if needed
    ];

    protected override string[] TablesWithTenantOnly =>
    [
        "person",
        "organization",
        "organization_member",
    ];

    protected override string[] TablesWithGroupOnly =>
    [
        //"checklist_template",
        //"task_template",
    ];
}

