# In-Memory Database Mode Guide

## Overview

The in-memory database mode enables running the web application with SQLite in-memory databases instead of file-based databases. This is particularly useful for:

- **Fast integration tests** (10-100x faster than file-based or PostgreSQL)
- **WebApplicationFactory testing** with isolated database state
- **Development scenarios** where temporary data is acceptable
- **CI/CD pipelines** with minimal infrastructure requirements

## How It Works

When enabled, the application:
1. Creates SQLite in-memory databases (`:memory:`)
2. Keeps connections open for the application lifetime
3. Automatically initializes schemas using `EnsureCreated()`
4. Provides complete isolation per application instance

### Connection Lifecycle

**Critical**: SQLite in-memory databases only exist while the connection is open. The `InMemoryDatabaseManager` class ensures connections remain alive throughout the application lifetime.

## Configuration

### Enable In-Memory Mode

Set the `UseInMemoryDatabase` configuration flag to `true`:

**Option 1: Environment Variable**
```bash
export UseInMemoryDatabase=true
export AppDbProvider=Sqlite
export WarehouseDbProvider=Sqlite
```

**Option 2: appsettings.json**
```json
{
  "UseInMemoryDatabase": true,
  "AppDbProvider": "Sqlite",
  "WarehouseDbProvider": "Sqlite"
}
```

**Option 3: In Code (for tests)**
```csharp
Environment.SetEnvironmentVariable("UseInMemoryDatabase", "true");
Environment.SetEnvironmentVariable("AppDbProvider", "Sqlite");
Environment.SetEnvironmentVariable("WarehouseDbProvider", "Sqlite");
```

### Disable In-Memory Mode (Default)

Simply omit the setting or set it to `false`:

```json
{
  "UseInMemoryDatabase": false
}
```

## Usage Patterns

### Pattern 1: Integration Tests with WebApplicationFactory ✅

```csharp
[Collection(WebApplicationFactoryCollection.Name)]
public class EmailAccountControllerTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task CreateEmailAccount_ShouldSucceed()
    {
        // Arrange
        var client = _factory.CreateClient();
        await client.LoginAsync("test@example.com", "Password123!");

        // Act
        var response = await client.PostAsJsonAsync("/api/emailaccounts", new
        {
            Email = "sender@example.com",
            DisplayName = "Test Sender"
        });

        // Assert
        response.Should().BeSuccessful();
        
        // Each test gets an isolated database through WebApplicationFactory
    }
}
```

**Benefits:**
- 10-100x faster than file-based databases
- Complete isolation between test runs
- No cleanup needed
- No database files to manage

### Pattern 2: Development with In-Memory Database

Create an `appsettings.InMemory.json`:

```json
{
  "UseInMemoryDatabase": true,
  "AppDbProvider": "Sqlite",
  "WarehouseDbProvider": "Sqlite",
  "ConnectionStrings": {
    "SqliteAppDbContextConnection": "Data Source=base2.db",
    "SqliteWarehouseDbContextConnection": "Data Source=warehouse.db"
  }
}
```

Run with:
```bash
dotnet run --launch-profile InMemory
```

**Use cases:**
- Quick prototyping without database files
- Testing migrations
- Temporary development environments

### Pattern 3: Switching Between Modes

```csharp
public class FlexibleTestFixture
{
    private readonly bool _useInMemory;

    public FlexibleTestFixture(bool useInMemory = true)
    {
        _useInMemory = useInMemory;

        if (_useInMemory)
        {
            // Fast in-memory mode
            Environment.SetEnvironmentVariable("UseInMemoryDatabase", "true");
            Environment.SetEnvironmentVariable("AppDbProvider", "Sqlite");
            Environment.SetEnvironmentVariable("WarehouseDbProvider", "Sqlite");
        }
        else
        {
            // File-based or PostgreSQL mode
            Environment.SetEnvironmentVariable("UseInMemoryDatabase", "false");
            Environment.SetEnvironmentVariable("AppDbProvider", "Npgsql");
            Environment.SetEnvironmentVariable("WarehouseDbProvider", "Npgsql");
        }
    }
}

// Fast tests
public class FastTests : FlexibleTestFixture
{
    public FastTests() : base(useInMemory: true) { }
}

// Production-like tests
public class ProductionTests : FlexibleTestFixture
{
    public ProductionTests() : base(useInMemory: false) { }
}
```

## Architecture

### Components

```
┌─────────────────────────────────────────┐
│ InMemoryDatabaseManager (Singleton)     │
│ - Manages connection lifecycle          │
│ - Keeps connections open                │
│ - Per-context connection tracking       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ AddProviderDbContext<TContext>          │
│ - Detects in-memory mode                │
│ - Uses managed connection if enabled    │
│ - Falls back to file-based if disabled  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ AppDbContext / WarehouseDbContext       │
│ - Uses in-memory SQLite connection      │
│ - Schema created via EnsureCreated()    │
└─────────────────────────────────────────┘
```

### Connection Management

Each `DbContext` gets its own in-memory database:
- `AppDbContext` → One in-memory database
- `WarehouseDbContext` → Separate in-memory database

Connections are tracked by context name and reused across scopes within the same application instance.

### Schema Initialization

When in-memory mode is enabled, `Program.cs` automatically calls `EnsureCreated()` on startup:

```csharp
if (builder.Configuration.IsInMemoryDatabaseEnabled())
{
    using var scope = app.Services.CreateScope();
    var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var warehouseDb = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();
    
    appDb.Database.EnsureCreated();
    warehouseDb.Database.EnsureCreated();
}
```

**Note**: In-memory databases use `EnsureCreated()` rather than migrations because:
- Faster initialization
- No migration history tracking needed
- Schema is recreated fresh each run

## Limitations

### When NOT to Use In-Memory Mode

❌ **PostgreSQL-specific features**
- Row-Level Security (RLS) policies
- PostgreSQL-specific functions or data types
- Full-text search features

❌ **Production environments**
- Data is lost when application stops
- No persistence between restarts

❌ **Performance testing**
- In-memory SQLite has different performance characteristics than PostgreSQL
- Not representative of production behavior

❌ **Data migration testing**
- Migrations are skipped in favor of `EnsureCreated()`
- Use file-based or PostgreSQL for migration testing

### When to Use In-Memory Mode

✅ **Unit/Integration tests** - Fast, isolated database access  
✅ **WebApplicationFactory tests** - Quick end-to-end API testing  
✅ **CI/CD pipelines** - No database infrastructure needed  
✅ **Quick prototyping** - Rapid development without database setup  
✅ **Development** - Temporary environments

## Test Categorization

Use traits to distinguish test types:

```csharp
[Fact]
[Trait("Category", "Integration")]
[Trait("Database", "InMemory")]
public async Task FastTest_UsingInMemory() { }

[Fact]
[Trait("Category", "Integration")]
[Trait("Database", "Npgsql")]
public async Task ProductionTest_UsingPostgreSQL() { }
```

Run tests by database type:

```bash
# Run only in-memory tests (fast)
dotnet test --filter "Database=InMemory"

# Run only PostgreSQL tests
dotnet test --filter "Database=Npgsql"

# Skip PostgreSQL tests in CI
dotnet test --filter "Database!=Npgsql"
```

## Best Practices

### DO ✅

- Use in-memory mode for fast integration tests
- Enable in-memory mode in WebApplicationFactory fixtures
- Use in-memory mode for CI/CD pipelines
- Document which tests require PostgreSQL vs in-memory
- Keep in-memory tests fast and focused

### DON'T ❌

- Don't use in-memory mode for RLS testing (requires PostgreSQL)
- Don't rely on data persistence across application restarts
- Don't test PostgreSQL-specific features with in-memory mode
- Don't use in-memory mode for performance benchmarking
- Don't use in-memory mode in production

## Troubleshooting

### Database Not Persisting Between Requests

**Problem**: Data is lost between HTTP requests in tests.

**Solution**: This is expected behavior for in-memory databases. Each WebApplicationFactory instance maintains its own in-memory database that persists for the factory's lifetime.

```csharp
// ✅ Correct - Data persists within the same factory instance
var client = _factory.CreateClient();
await client.PostAsync(...); // Creates data
var response = await client.GetAsync(...); // Data still exists

// ❌ Incorrect - Each factory gets separate database
var factory1 = new WebApplicationFactory<Program>();
var factory2 = new WebApplicationFactory<Program>();
// factory1 and factory2 have separate in-memory databases
```

### "Object Disposed" Exception

**Problem**: `ObjectDisposedException` when accessing database.

**Solution**: The `InMemoryDatabaseManager` was disposed. This usually happens if:
1. The application is shutting down
2. The service provider was disposed

Ensure the fixture lifetime matches your test collection:

```csharp
[CollectionDefinition(Name)]
public class WebApplicationFactoryCollection 
    : ICollectionFixture<WebApplicationFactoryFixture>
{
    public const string Name = "WebApplicationFactory Collection";
}
```

### Schema Not Created

**Problem**: Tables don't exist when running queries.

**Solution**: Ensure `EnsureCreated()` is called in `Program.cs`:

```csharp
if (builder.Configuration.IsInMemoryDatabaseEnabled())
{
    using var scope = app.Services.CreateScope();
    var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    appDb.Database.EnsureCreated();
}
```

### Connection String Still Used in In-Memory Mode

**Problem**: Application tries to use file-based connection string even with in-memory enabled.

**Solution**: Check configuration precedence. Ensure `UseInMemoryDatabase=true` is set and `AppDbProvider=Sqlite`.

```csharp
// Debug configuration
var config = app.Services.GetRequiredService<IConfiguration>();
Console.WriteLine($"UseInMemoryDatabase: {config.IsInMemoryDatabaseEnabled()}");
Console.WriteLine($"Provider: {config.GetDatabaseProvider("AppDb", "Npgsql")}");
```

## Related Documentation

- [Database Testing Pattern](../../patterns/server/database-testing-pattern.md) - Testing with `Data.Mock`
- [Testing Patterns](../../patterns/server/testing-patterns.md) - General testing patterns
- [WebApplicationFactory Guide](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests) - Microsoft docs

---

**Last Updated**: 2025-12-20  
**Maintained By**: Engineering Team

