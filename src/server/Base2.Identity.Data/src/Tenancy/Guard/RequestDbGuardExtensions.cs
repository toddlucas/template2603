using Microsoft.EntityFrameworkCore;

using Base2.Data.Identity;

namespace Base2.Data.Identity;

/// <summary>
/// Extension methods for easy usage of the RequestDbGuard pattern.
/// </summary>
public static class RequestDbGuardExtensions
{
    /// <summary>
    /// Executes a read operation with automatic transaction management.
    /// Ensures a read-only transaction is active before executing the operation.
    /// </summary>
    /// <typeparam name="T">The return type</typeparam>
    /// <param name="guard">The request database guard</param>
    /// <param name="operation">The read operation to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The result of the operation</returns>
    public static async Task<T> ExecuteReadAsync<T>(
        this IRequestDbGuard guard,
        Func<Task<T>> operation,
        CancellationToken cancellationToken = default)
    {
        await guard.EnsureReadAsync(cancellationToken);
        return await operation();
    }

    /// <summary>
    /// Executes a write operation with automatic transaction management.
    /// Ensures a write-capable transaction is active before executing the operation.
    /// </summary>
    /// <typeparam name="T">The return type</typeparam>
    /// <param name="guard">The request database guard</param>
    /// <param name="operation">The write operation to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The result of the operation</returns>
    public static async Task<T> ExecuteWriteAsync<T>(
        this IRequestDbGuard guard,
        Func<Task<T>> operation,
        CancellationToken cancellationToken = default)
    {
        await guard.EnsureWriteAsync(cancellationToken);
        return await operation();
    }

    /// <summary>
    /// Executes a read operation with automatic transaction management.
    /// Ensures a read-only transaction is active before executing the operation.
    /// </summary>
    /// <param name="guard">The request database guard</param>
    /// <param name="operation">The read operation to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the async operation</returns>
    public static async Task ExecuteReadAsync(
        this IRequestDbGuard guard,
        Func<Task> operation,
        CancellationToken cancellationToken = default)
    {
        await guard.EnsureReadAsync(cancellationToken);
        await operation();
    }

    /// <summary>
    /// Executes a write operation with automatic transaction management.
    /// Ensures a write-capable transaction is active before executing the operation.
    /// </summary>
    /// <param name="guard">The request database guard</param>
    /// <param name="operation">The write operation to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the async operation</returns>
    public static async Task ExecuteWriteAsync(
        this IRequestDbGuard guard,
        Func<Task> operation,
        CancellationToken cancellationToken = default)
    {
        await guard.EnsureWriteAsync(cancellationToken);
        await operation();
    }

    /// <summary>
    /// Executes a query with automatic read transaction management.
    /// This is a convenience method for common query patterns.
    /// </summary>
    /// <typeparam name="T">The entity type (must be a class)</typeparam>
    /// <param name="guard">The request database guard</param>
    /// <param name="dbContext">The database context</param>
    /// <param name="query">The query to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The query result</returns>
    public static async Task<List<T>> QueryAsync<T>(
        this IRequestDbGuard guard,
        DbContext dbContext,
        Func<IQueryable<T>, IQueryable<T>> query,
        CancellationToken cancellationToken = default)
        where T : class
    {
        await guard.EnsureReadAsync(cancellationToken);
        return await query(dbContext.Set<T>()).ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Executes a single item query with automatic read transaction management.
    /// This is a convenience method for common single item query patterns.
    /// </summary>
    /// <typeparam name="T">The entity type (must be a class)</typeparam>
    /// <param name="guard">The request database guard</param>
    /// <param name="dbContext">The database context</param>
    /// <param name="query">The query to execute</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The query result or null if not found</returns>
    public static async Task<T?> QuerySingleAsync<T>(
        this IRequestDbGuard guard,
        DbContext dbContext,
        Func<IQueryable<T>, IQueryable<T>> query,
        CancellationToken cancellationToken = default)
        where T : class
    {
        await guard.EnsureReadAsync(cancellationToken);
        return await query(dbContext.Set<T>()).FirstOrDefaultAsync(cancellationToken);
    }
}
