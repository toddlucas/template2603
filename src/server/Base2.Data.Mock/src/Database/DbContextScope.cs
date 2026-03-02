namespace Base2.Data.Mock.Database;

public class DbContextScope : IDisposable, IAsyncDisposable
{
    private readonly Dictionary<string, object> _contexts;

    private bool _disposed = false;

    public DbContextScope(SqliteDatabaseSet dbs)
    {
        _contexts = dbs.CreateContexts(required: false).ToDictionary(c => c.name, c => c.creator());
    }

    public object GetContext(string name) => _contexts[name] ?? throw new InvalidOperationException($"The {name} database isn't registered.");
    public object TryGetContext(string name) => _contexts[name];

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
        foreach (var db in _contexts)
        {
            if (db.Value is IDisposable d)
                d.Dispose();
        }

        _contexts.Clear();
    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        // Dispose managed async resources.
        foreach (var db in _contexts)
        {
            if (db.Value is IAsyncDisposable d)
                await d.DisposeAsync();
        }

        _contexts.Clear();
    }

    #endregion IDisposable
}
