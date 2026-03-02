namespace Base2.Data.Identity;

/// <summary>
/// Provides automatic transaction management for database operations within a request scope.
/// Handles lazy creation of read-only transactions and automatic promotion to write transactions when needed.
/// </summary>
public interface IRequestDbGuard : IAsyncDisposable
{
    /// <summary>
    /// Ensures a read-only transaction is active. If no transaction exists, creates a lightweight read-only transaction.
    /// If a write transaction already exists, this is a no-op.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the async operation</returns>
    Task EnsureReadAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Ensures a write-capable transaction is active. If a read-only transaction exists, it will be closed
    /// and a new write transaction will be created. If a write transaction already exists, this is a no-op.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Task representing the async operation</returns>
    Task EnsureWriteAsync(CancellationToken cancellationToken = default);
}
