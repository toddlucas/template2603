using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;

namespace Base2.Data.Mock.Database;

/// <summary>
/// Represents a connection to a Sqlite database that can generate
/// DbContext objects.
/// </summary>
public class SqliteDatabase : SqliteDatabaseConnection
{
    private readonly Func<DbContextOptions, DbContext> _createDbContext;

    public SqliteDatabase(
        Func<DbContextOptions, DbContext> createDbContext)
    {
        _createDbContext = createDbContext;

    }

    // A shared application service provider that configures Identity schema v3 so that
    // IdentityDbContext.OnModelCreating includes the passkeys entity with a proper key.
    private static readonly IServiceProvider _identityServiceProvider =
        new ServiceCollection()
            .Configure<IdentityOptions>(o => o.Stores.SchemaVersion = IdentitySchemaVersions.Version3)
            .BuildServiceProvider();

    private static DbContextOptionsBuilder ApplyIdentityServiceProvider(DbContextOptionsBuilder builder) =>
        builder.UseApplicationServiceProvider(_identityServiceProvider);

    public async ValueTask CreateDatabaseAsync(
        string connectionString = "DataSource=:memory:")
    {
        // The Sqlite in-memory database only exists while the connection is open.
        _connection = new SqliteConnection(connectionString);
        await _connection.OpenAsync();

        // Don't log the database creation.
        var options = ApplyIdentityServiceProvider(new DbContextOptionsBuilder())
            .UseSqlite(_connection)
            .Options;

        // Create the database.
        using var context = _createDbContext(options);

        context.Database.EnsureCreated();
    }

    public DbContext CreateDbContext()
    {
        if (_disposed)
            throw new ObjectDisposedException("Can't create a DbContext on a disposed connection");

        if (_connection == null)
            throw new InvalidOperationException("Must create the database before use.");

        var options = ApplyIdentityServiceProvider(new DbContextOptionsBuilder())
            .UseSqlite(_connection)
            .Options;

        return _createDbContext(options);
    }
}
