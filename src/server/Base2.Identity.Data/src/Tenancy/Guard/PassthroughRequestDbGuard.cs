namespace Base2.Data.Identity;

/// <summary>
/// A passthrough implementation of IRequestDbGuard that performs no operations.
/// Used for database providers that don't support tenant context (like SQLite).
/// This ensures consistent API across all database providers while avoiding
/// unnecessary overhead for providers that don't need tenant isolation.
/// </summary>
public sealed class PassthroughRequestDbGuard : IRequestDbGuard
{
    /// <summary>
    /// No-op implementation. Does nothing for database providers that don't support tenant context.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token (ignored)</param>
    /// <returns>Completed task</returns>
    public Task EnsureReadAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    /// <summary>
    /// No-op implementation. Does nothing for database providers that don't support tenant context.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token (ignored)</param>
    /// <returns>Completed task</returns>
    public Task EnsureWriteAsync(CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    /// <summary>
    /// No-op implementation. Nothing to dispose for passthrough guard.
    /// </summary>
    /// <returns>Completed value task</returns>
    public ValueTask DisposeAsync()
    {
        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// No-op implementation. Nothing to dispose for passthrough guard.
    /// </summary>
    public void Dispose()
    {
        // Nothing to dispose
    }
}
