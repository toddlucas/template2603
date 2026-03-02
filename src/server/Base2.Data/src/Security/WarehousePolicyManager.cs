using Base2.Data.Security;

namespace Base2;

/// <summary>
/// RLS policy manager for AppDbContext (data plane).
/// Manages policies for contacts, sequences, campaigns, and sales engagement entities.
/// </summary>
public sealed class WarehousePolicyManager : RlsPolicyManagerBase
{
    private static readonly WarehousePolicyManager _instance = new();

    /// <summary>
    /// Gets the singleton instance of the Warehouse policy manager.
    /// </summary>
    public static WarehousePolicyManager Instance => _instance;

    private WarehousePolicyManager() { }

    protected override string DatabaseName => "warehouse";
    protected override string AppUserName => "warehouse_user";

    protected override string[] TablesWithGroupAndTenant =>
    [
        // Add data plane tables with both group + tenant if needed
    ];

    protected override string[] TablesWithTenantOnly =>
    [
    ];

    protected override string[] TablesWithGroupOnly =>
    [
        // Add data plane group-only tables if needed
    ];
}
