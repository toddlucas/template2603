using Microsoft.Data.Sqlite;

namespace Base2.Data.Mock.Database;

/// <summary>
/// The common base class for the generic and non-generic SqliteDatabase classes.
/// </summary>
public class SqliteDatabaseConnection : IDisposable, IAsyncDisposable
{
#pragma warning disable SA1401 // Fields should be private
    protected SqliteConnection? _connection;
    protected bool _disposed = false;
#pragma warning restore SA1401 // Fields should be private

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
        if (_connection != null)
        {
            _connection.Close();
            _connection = null;
        }

    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        // Dispose managed async resources.
        if (_connection != null)
        {
            await _connection.CloseAsync();
            _connection = null;
        }

    }

    #endregion IDisposable
}
