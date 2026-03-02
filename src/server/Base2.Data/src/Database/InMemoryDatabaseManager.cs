using Microsoft.Data.Sqlite;

namespace Base2.Data.Database;

/// <summary>
/// Manages SQLite in-memory database connections to ensure they remain open
/// for the lifetime of the application.
/// </summary>
/// <remarks>
/// SQLite in-memory databases only exist while the connection is open.
/// This manager keeps connections alive and ensures proper disposal.
/// </remarks>
public class InMemoryDatabaseManager : IDisposable
{
    private readonly Dictionary<string, SqliteConnection> _connections = new();
    private readonly object _lock = new();
    private bool _disposed = false;

    /// <summary>
    /// Gets or creates a tracked in-memory connection for the specified context.
    /// </summary>
    /// <param name="contextName">The name of the DbContext (e.g., "AppDbContext").</param>
    /// <returns>An open SQLite connection.</returns>
    public SqliteConnection GetOrCreateConnection(string contextName)
    {
        lock (_lock)
        {
            if (_disposed)
                throw new ObjectDisposedException(nameof(InMemoryDatabaseManager));

            if (_connections.TryGetValue(contextName, out var existingConnection))
            {
                return existingConnection;
            }

            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();
            _connections[contextName] = connection;

            return connection;
        }
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        lock (_lock)
        {
            foreach (var connection in _connections.Values)
            {
                try
                {
                    connection.Close();
                    connection.Dispose();
                }
                catch
                {
                    // Suppress exceptions during disposal
                }
            }

            _connections.Clear();
            _disposed = true;
        }

        GC.SuppressFinalize(this);
    }
}
