namespace Base2.Data.Mock.Database;

public class SqliteDatabaseSet : IDisposable, IAsyncDisposable
{
    private readonly Dictionary<string, DbContextInfo> _dbInfoMap;
    private readonly Dictionary<string, SqliteDatabase> _dbDatabases = new();

    private bool _disposed = false;

    public SqliteDatabaseSet(Dictionary<string, DbContextInfo> dbInfoMap) => _dbInfoMap = dbInfoMap;

    public record DbContextInfo(
        Type dbContextType,
        Func<DbContextOptions, DbContext> createDbContext)
    {
    }

    public string[] AllDatabaseNames => _dbInfoMap.Keys.ToArray();

    public async Task CreateAsync(params string[] dbs)
    {
        foreach (var name in dbs)
        {
            if (!_dbInfoMap.ContainsKey(name))
                throw new Exception($"Unrecognized database name '{name}' on create");

            var dbInfo = _dbInfoMap[name];

            var sqliteDb = new SqliteDatabase(dbInfo.createDbContext);
            await sqliteDb.CreateDatabaseAsync();
            _dbDatabases.Add(name, sqliteDb);
        }
    }

    public IEnumerable<(string name, Func<object> creator, Type type)> CreateContexts(bool required)
    {
        foreach (var db in _dbDatabases)
        {
            if (!_dbInfoMap.ContainsKey(db.Key))
                throw new Exception($"Unrecognized database name '{db.Key}' on register");

            var dbInfo = _dbInfoMap[db.Key];

            var dbContext = db.Value.CreateDbContext();

            // Perform a runtime cast or Autofac will see the DbContext type,
            // instead of the actual derived type.
            var context = Convert.ChangeType(dbContext, dbInfo.dbContextType);
            if (context == null)
                throw new Exception($"Failed to coerce DbContext to {dbInfo.dbContextType}");

            // builder.Register(ctx => context).As(dbInfo.dbContextAsType).InstancePer(config);
            yield return (db.Key, () => context, dbInfo.dbContextType);
        }

        // Set any non-registered databases to null to ensure that we don't
        // inadvertently call an actual underlying database.
        foreach (var info in _dbInfoMap)
        {
            if (_dbDatabases.ContainsKey(info.Key))
                continue;

            var dbInfo = _dbInfoMap[info.Key];

            // Register the DbContext as null or throw an exception.
            Func<object> creator = required
                ? () => throw new InvalidOperationException($"The {info.Key} database context wasn't registered.")
                : () => null!;

            // builder.Register(ctx => context).As(dbInfo.dbContextAsType).InstancePer(config);
            yield return (info.Key, creator, dbInfo.dbContextType);
        }
    }

    public T CreateContext<T>(string name) where T : DbContext
    {
        if (!_dbInfoMap.ContainsKey(name))
            throw new Exception($"Unrecognized database name '{name}' on create");

        if (!_dbDatabases.ContainsKey(name))
            throw new Exception($"Database name '{name}' was not available on create");

        var dbInfo = _dbInfoMap[name];
        var db = _dbDatabases[name];

        var dbContext = db.CreateDbContext();

        var context = Convert.ChangeType(dbContext, dbInfo.dbContextType);
        if (context == null)
            throw new Exception($"Failed to coerce DbContext to {dbInfo.dbContextType}");

        return (T)context;
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
        foreach (var db in _dbDatabases)
        {
            db.Value.Dispose();
        }

        _dbDatabases.Clear();
    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        // Dispose managed async resources.
        foreach (var db in _dbDatabases)
        {
            await db.Value.DisposeAsync();
        }

        _dbDatabases.Clear();
    }

    #endregion IDisposable
}
