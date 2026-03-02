namespace Base2.Data.Identity;

/// <summary>
/// Provides ambient access to the current request's database guards.
/// This allows Metalama aspects to access guards without requiring dependency injection.
/// Supports multiple database contexts per request (e.g., AppDbContext and AppDbContext).
/// </summary>
public static class AmbientRequestGuard
{
    private static readonly AsyncLocal<Dictionary<string, IRequestDbGuard>?> _guards = new();

    /// <summary>
    /// Gets the guard for a specific database context by its type name.
    /// </summary>
    /// <param name="contextTypeName">The DbContext type name (e.g., nameof(AppDbContext))</param>
    /// <returns>The database guard for the specified context</returns>
    /// <exception cref="InvalidOperationException">Thrown when no guard is available for the specified context.</exception>
    public static IRequestDbGuard Get(string contextTypeName)
    {
        if (_guards.Value == null || !_guards.Value.TryGetValue(contextTypeName, out var guard))
            throw new InvalidOperationException($"No IRequestDbGuard available for '{contextTypeName}'. Ensure the database is registered and the middleware is properly configured.");
        return guard;
    }

    /// <summary>
    /// Sets multiple guards for the current request.
    /// This should be called by the request middleware at the start of each request.
    /// </summary>
    /// <param name="guards">Dictionary of guards keyed by DbContext type name</param>
    /// <returns>A disposable that will restore the previous guards when disposed</returns>
    public static IDisposable UseMultiple(Dictionary<string, IRequestDbGuard> guards)
    {
        var previous = _guards.Value;
        _guards.Value = guards;
        return new GuardScope(previous);
    }

    /// <summary>
    /// Checks if a guard is available for the specified database context.
    /// </summary>
    /// <param name="contextTypeName">The DbContext type name</param>
    /// <returns>True if a guard is available, false otherwise</returns>
    public static bool IsAvailable(string contextTypeName) =>
        _guards.Value?.ContainsKey(contextTypeName) ?? false;

    private sealed class GuardScope : IDisposable
    {
        private readonly Dictionary<string, IRequestDbGuard>? _previous;

        public GuardScope(Dictionary<string, IRequestDbGuard>? previous)
        {
            _previous = previous;
        }

        public void Dispose()
        {
            _guards.Value = _previous;
        }
    }
}
