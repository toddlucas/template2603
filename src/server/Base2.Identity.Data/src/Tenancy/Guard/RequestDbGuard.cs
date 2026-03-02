using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

using Base2.Identity;

namespace Base2.Data.Identity;

/// <summary>
/// Implements automatic transaction management for database operations within a request scope.
/// Provides lazy creation of read-only transactions and automatic promotion to write transactions when needed.
/// Works with one DbContext per request pattern and integrates with tenant context.
/// </summary>
/// <typeparam name="TDb">The DbContext type</typeparam>
public sealed class RequestDbGuard<TDb> : IRequestDbGuard where TDb : DbContext
{
    private readonly TDb _db;
    private readonly TenantContext<Guid> _tenantContext;
    private IDbContextTransaction? _transaction;
    private bool _isReadOnly; // tracks current transaction mode
    private bool _disposed;

    public RequestDbGuard(TDb db, TenantContext<Guid> tenantContext)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _tenantContext = tenantContext ?? throw new ArgumentNullException(nameof(tenantContext));
    }

    /// <summary>
    /// Ensures a read-only transaction is active. If no transaction exists, creates a lightweight read-only transaction.
    /// If a write transaction already exists, this is a no-op.
    /// </summary>
    public async Task EnsureReadAsync(CancellationToken cancellationToken = default)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(RequestDbGuard<TDb>));

        if (_transaction != null)
            return; // already in a transaction (read or write) -> OK for reads

        // Use EF Core's transaction system to trigger interceptors
        _transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        _isReadOnly = true;

        // Set tenant context for RLS
        await SetTenantContextAsync(cancellationToken);

        // Make the transaction read-only at the DB level for better performance
        await _db.Database.ExecuteSqlRawAsync("SET TRANSACTION READ ONLY", cancellationToken);
    }

    /// <summary>
    /// Ensures a write-capable transaction is active. If a read-only transaction exists, it will be closed
    /// and a new write transaction will be created. If a write transaction already exists, this is a no-op.
    /// </summary>
    public async Task EnsureWriteAsync(CancellationToken cancellationToken = default)
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(RequestDbGuard<TDb>));

        // Already write-capable? nothing to do
        if (_transaction != null && !_isReadOnly)
            return;

        // If we are in a read-only transaction, close it first
        if (_transaction != null && _isReadOnly)
        {
            // Reads don't need to persist; either Commit or Rollback is fine—Rollback is slightly cheaper
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }

        // Start a new write-capable transaction
        _transaction = await _db.Database.BeginTransactionAsync(cancellationToken);
        _isReadOnly = false;

        // Set tenant context for RLS
        await SetTenantContextAsync(cancellationToken);
        // (No READ ONLY here; writes allowed)
    }

    /// <summary>
    /// Disposes the guard and commits any active transaction.
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        if (_disposed || _transaction == null)
            return;

        _disposed = true;

        try
        {
            // If it was a read-only guard and still open, just commit (or rollback) to release quickly
            if (_isReadOnly)
                await _transaction.CommitAsync();
            else
                await _transaction.CommitAsync();
        }
        catch
        {
            try
            {
                await _transaction.RollbackAsync();
            }
            catch
            {
                // Swallow rollback exceptions during disposal
            }
            throw;
        }
        finally
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    /// <summary>
    /// Synchronous dispose for compatibility.
    /// </summary>
    public void Dispose()
    {
        if (_disposed || _transaction == null)
            return;

        _disposed = true;

        try
        {
            if (_isReadOnly)
                _transaction.Commit();
            else
                _transaction.Commit();
        }
        catch
        {
            try
            {
                _transaction.Rollback();
            }
            catch
            {
                // Swallow rollback exceptions during disposal
            }
            throw;
        }
        finally
        {
            _transaction.Dispose();
            _transaction = null;
        }
    }

    /// <summary>
    /// Sets the tenant context for the current transaction to enable Row Level Security.
    /// </summary>
    private async Task SetTenantContextAsync(CancellationToken cancellationToken)
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
        var connection = _db.Database.GetDbConnection();
        var cmd = connection.CreateCommand();
        cmd.Transaction = _transaction!.GetDbTransaction();

#if RESELLER
        await RlsConfig.SetTenantConfigAsync(cmd, groupId, tenantId, cancellationToken);
#else
        await RlsConfig.SetTenantConfigAsync(cmd, tenantId, cancellationToken);
#endif
    }
}
