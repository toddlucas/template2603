#if false
using System.Data;
using System.Data.Common;
using System.Text.RegularExpressions;
using System.Threading;

using Base2.Identity;

using Microsoft.EntityFrameworkCore.Diagnostics;

using Npgsql;

namespace Base2.Data.Identity;

/// <summary>
/// EF Core interceptor that sets the tenant ID for each database transaction.
/// This ensures that Row Level Security (RLS) policies can access the current tenant context.
/// </summary>
public sealed class TenantTransactionInterceptor : IDbTransactionInterceptor
{
    private readonly TenantContext<Guid> _tenantContext;

    public TenantTransactionInterceptor(TenantContext<Guid> tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public async Task TransactionStartedAsync(
        DbTransaction transaction,
        TransactionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await SetTenantAsync(transaction, cancellationToken);
    }

    public async Task TransactionUsedAsync(
        DbConnection connection,
        TransactionEventData eventData,
        CancellationToken cancellationToken = default)
    {
        if (connection?.State == ConnectionState.Open &&
            connection is NpgsqlConnection npgConn &&
            npgConn.FullState.HasFlag(ConnectionState.Open))
        {
            if (connection.BeginTransaction() == eventData.Transaction) { /* no-op */ }
            // When EF attaches to an existing ambient transaction, set the tenant too:
            await SetTenantAsync(eventData.Transaction!, cancellationToken);
        }
    }

    private async Task SetTenantAsync(DbTransaction transaction, CancellationToken cancellationToken)
    {
#if RESELLER
        var groupId = _tenantContext.CurrentGroupId;
        if (groupId == Guid.Empty)
            throw new InvalidOperationException("No group ID available for this request.");

#endif
        var tenantId = _tenantContext.CurrentId;
        if (tenantId == Guid.Empty)
            throw new InvalidOperationException("No tenant ID available for this request.");

        // Use set_config(..., is_local := true) → transaction-scoped (auto-reset).
        // Parameterized to avoid injection; works across all Npgsql versions.
        var cmd = transaction.Connection!.CreateCommand();
        cmd.Transaction = transaction;

#if RESELLER
        await RlsConfig.SetTenantConfigAsync(cmd, groupId, tenantId, cancellationToken);
#else
        await RlsConfig.SetTenantConfigAsync(cmd, tenantId, cancellationToken);
#endif
    }

    // Synchronous versions for completeness (though async is preferred)
    public void TransactionStarted(DbTransaction transaction, TransactionEndEventData eventData)
    {
        SetTenant(transaction);
    }

    public void TransactionUsed(DbConnection connection, TransactionEventData eventData)
    {
        if (connection?.State == ConnectionState.Open &&
            connection is NpgsqlConnection npgConn &&
            npgConn.FullState.HasFlag(ConnectionState.Open))
        {
            if (connection.BeginTransaction() == eventData.Transaction) { /* no-op */ }
            // When EF attaches to an existing ambient transaction, set the tenant too:
            SetTenant(eventData.Transaction!);
        }
    }

    private void SetTenant(DbTransaction transaction)
    {
#if RESELLER
        var groupId = _tenantContext.CurrentGroupId;
        if (groupId == Guid.Empty)
            throw new InvalidOperationException("No group ID available for this request.");

#endif
        var tenantId = _tenantContext.CurrentId;
        if (tenantId == Guid.Empty)
            throw new InvalidOperationException("No tenant ID available for this request.");

        // Use set_config(..., is_local := true) → transaction-scoped (auto-reset).
        // Parameterized to avoid injection; works across all Npgsql versions.
        var cmd = transaction.Connection!.CreateCommand();
        cmd.Transaction = transaction;

#if RESELLER
        RlsConfig.SetTenantConfig(cmd, groupId, tenantId);
#else
        RlsConfig.SetTenantConfig(cmd, tenantId);
#endif
    }
}
#endif
