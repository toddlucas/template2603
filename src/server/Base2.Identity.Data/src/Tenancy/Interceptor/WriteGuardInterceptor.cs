using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace Base2.Data.Identity;

/// <summary>
/// EF Core interceptor that automatically promotes read transactions to write transactions
/// when SaveChanges is called. This ensures that write operations always have the proper
/// transaction context without manual intervention.
///
/// This interceptor is generic and resolves the correct IRequestDbGuard based on the
/// TDbContext type name (e.g., "AppDbContext", "AppDbContext").
/// </summary>
/// <typeparam name="TDbContext">The DbContext type this interceptor is for</typeparam>
public sealed class WriteGuardInterceptor<TDbContext> : SaveChangesInterceptor
    where TDbContext : DbContext
{
    private readonly IServiceProvider _serviceProvider;
    private readonly string _dbContextKey;

    /// <summary>
    /// Initializes a new instance of the WriteGuardInterceptor class.
    /// </summary>
    /// <param name="serviceProvider">The service provider for resolving the guard</param>
    public WriteGuardInterceptor(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _dbContextKey = typeof(TDbContext).Name;  // e.g., "AppDbContext" or "AppDbContext"
    }

    /// <summary>
    /// Intercepts SaveChangesAsync calls to ensure a write transaction is active.
    /// Resolves the IRequestDbGuard for the specific DbContext type using keyed services.
    /// </summary>
    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var guard = _serviceProvider.GetKeyedService<IRequestDbGuard>(_dbContextKey);
        if (guard != null)
        {
            await guard.EnsureWriteAsync(cancellationToken);
        }
        return result;
    }

    /// <summary>
    /// Intercepts SaveChanges calls to ensure a write transaction is active.
    /// Resolves the IRequestDbGuard for the specific DbContext type using keyed services.
    /// </summary>
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        var guard = _serviceProvider.GetKeyedService<IRequestDbGuard>(_dbContextKey);
        if (guard != null)
        {
            guard.EnsureWriteAsync().GetAwaiter().GetResult();
        }
        return result;
    }
}
