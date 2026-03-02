namespace Base2.Data.Mock.Database;

public class DbContextContainer : IDisposable, IAsyncDisposable
{
    private SqliteDatabaseSet? _dbs;
    private bool _disposed = false;

    public DbContextContainer(SqliteDatabaseSet dbs) => _dbs = dbs;

    public SqliteDatabaseSet? DatabaseSet => _dbs;

    /// <summary>
    /// Create one or more Sqlite databases.
    /// </summary>
    /// <param name="dbNames">The list of database names to create.</param>
    public async Task CreateAsync(
        params string[] dbNames)
    {
        if (_dbs == null)
            throw new ObjectDisposedException("The databases have been disposed");

        // Create the specified in-memory Sqlite databases.
        await _dbs.CreateAsync(dbNames);
    }

    #region IDisposable

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore();
        Dispose(false); // Dispose unmanaged resources.
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                DisposeCore();
            }

            // Dispose unmanaged resources here.
            _disposed = true;
        }
    }

    protected virtual void DisposeCore()
    {
        // Dispose managed resources.
        if (_dbs != null)
        {
            _dbs.Dispose();
            _dbs = null;
        }
    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        // Dispose managed async resources.
        if (_dbs != null)
        {
            await _dbs.DisposeAsync();
            _dbs = null;
        }
    }

    #endregion IDisposable
}
