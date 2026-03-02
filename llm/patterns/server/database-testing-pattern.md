# Database Testing Pattern

## Overview

This document describes the database testing infrastructure provided by `Base2.Data.Mock`. This library enables fast, isolated database testing with multiple DbContexts using SQLite in-memory databases that persist across test scopes.

## Problem Statement

Testing code that depends on EF Core DbContext presents several challenges:

- **Speed**: Real database connections are slow (PostgreSQL setup, network overhead)
- **Isolation**: Tests can interfere with each other via shared database state
- **CI/CD**: Setting up real databases in pipelines is complex and expensive
- **Multi-Context**: Our application uses multiple DbContexts (App, Warehouse) that need to work together
- **Scope Management**: Tests need fresh DbContext instances but shared database state

## Solution: Container-Scope Pattern

The `Base2.Data.Mock` library implements a **Container-Scope pattern** that provides:

1. **Fast in-memory databases** (SQLite) for unit/integration tests
2. **Isolated contexts** per test scope with shared underlying data
3. **Multi-context support** for App and Warehouse DbContexts
4. **DI integration** for realistic service testing
5. **Proper disposal** to prevent memory leaks

## Architecture

```
┌─────────────────────────────────────┐
│  TestDbContextContainer              │  Container (owns database lifecycle)
│  - Creates in-memory databases      │
│  - Manages connections              │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  SqliteDatabaseSet                  │  Database registry
│  - Tracks multiple databases        │
│  - Creates DbContext instances      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  TestDbContextScope                  │  Scope (per-test contexts)
│  - Provides App DbContext           │
│  - Provides Warehouse DbContext     │
│  - Fresh instances, shared data     │
└─────────────┬───────────────────────┘
              │
              ▼
    ┌─────────────────┬─────────────────┐
    ▼                 ▼                 ▼
AppDbContext  WarehouseDbContext    (Future)
```

## Key Components

### TestDbContextContainer

The main entry point for database testing. Manages the lifecycle of in-memory databases.

```csharp
// Create container (manages database lifecycle)
using var container = new TestDbContextContainer();

// Create databases (both App and Warehouse)
await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);

// Begin a scope for your test
using var scope = container.BeginScope();
var appDb = scope.App;
var warehouseDb = scope.Warehouse;

// Use contexts...
```

### TestDbContextScope

Provides access to DbContext instances within a test scope. Each scope gets **fresh DbContext instances** but they share the **same underlying SQLite connection**, so data persists.

```csharp
using var scope = container.BeginScope();

// Access either context
var appDb = scope.App;              // AppDbContext
var warehouseDb = scope.Warehouse;  // WarehouseDbContext

// Both contexts see the same data
appDb.Organizations.Add(new Organization { Name = "Test Org" });
await appDb.SaveChangesAsync();

var orgs = await warehouseDb.Organizations.ToListAsync(); // Can see the organization!
```

### SqliteDatabase

Internal component that manages SQLite connections. **Critical detail**: The connection stays **open** during the container's lifetime, which keeps the in-memory database alive.

### TestDbContextContainerExtensions

Provides integration with `IServiceProvider` for realistic service testing.

```csharp
// Register DbContexts with DI container
using var container = new TestDbContextContainer();
var services = await container.AddTestDbServicesAsync();

// Use services like in production code
using var scope = services.CreateScope();
var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
var organizationService = scope.ServiceProvider.GetRequiredService<OrganizationService>();
```

## Usage Patterns

### Pattern 1: Per-Test Isolation (Recommended ✅)

**Best for**: True test isolation - each test gets a fresh database.

This is the **recommended default** because it ensures complete isolation between tests.

```csharp
namespace Base2.Data.Test.Access;

public class OrganizationQueryTests
{
    [Fact]
    public async Task SingleOrDefaultAsync_WhenExists_ShouldReturnOrganization()
    {
        // Arrange - Fresh database for this test
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var org = new Organization { Name = "Test Org" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var query = new OrganizationQuery(db.Organizations, Mock.Of<ILogger>());

        // Act
        var result = await query.SingleOrDefaultAsync(org.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Org");
    }
    
    [Fact]
    public async Task ListAsync_ShouldReturnAllOrganizations()
    {
        // Arrange - Fresh database (no data from previous test!)
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        
        using var scope = container.BeginScope();
        var db = scope.App;
        
        db.Organizations.AddRange(
            new Organization { Name = "Org 1" },
            new Organization { Name = "Org 2" }
        );
        await db.SaveChangesAsync();

        var query = new OrganizationQuery(db.Organizations, Mock.Of<ILogger>());

        // Act
        var result = await query.ListAsync();

        // Assert
        result.Should().HaveCount(2);
    }
}
```

**Benefits**:
- ✅ **Complete isolation** - Tests cannot interfere with each other
- ✅ **No cleanup needed** - Database disposed automatically
- ✅ **No disposal class** - Simple test class structure
- ✅ **Parallel-safe** - Tests can run in parallel without issues

**Tradeoffs**:
- ⚠️ Slightly slower (creates database per test)
- ⚠️ More verbose (setup repeated in each test)

### Pattern 2: Shared Database per Test Class (Use with Caution ⚠️)

**Best for**: Performance optimization when tests are truly independent or intentionally sequential.

```csharp
namespace Base2.Data.Test.Access;

public class OrganizationQueryTests : IAsyncLifetime
{
    private TestDbContextContainer _container = null!;

    public async Task InitializeAsync()
    {
        _container = new TestDbContextContainer();
        await _container.CreateAsync(DatabaseNames.App);
    }

    [Fact]
    public async Task SingleOrDefaultAsync_WhenExists_ShouldReturnOrganization()
    {
        // Arrange - Shared database, but fresh scope
        using var scope = _container.BeginScope();
        var db = scope.App;
        
        var org = new Organization { Name = "Test Org" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var query = new OrganizationQuery(db.Organizations, Mock.Of<ILogger>());

        // Act
        var result = await query.SingleOrDefaultAsync(org.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Org");
    }
    
    [Fact]
    public async Task ListAsync_ShouldReturnAllOrganizations()
    {
        // WARNING: This database may contain data from previous tests!
        using var scope = _container.BeginScope();
        var db = scope.App;
        
        var query = new OrganizationQuery(db.Organizations, Mock.Of<ILogger>());

        // Act
        var result = await query.ListAsync();

        // Assert - Might fail if previous test ran first
        result.Should().HaveCount(0); // ❌ Could have data from previous test
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }
}
```

**Use Cases**:
- ✅ Tests that are **intentionally sequential** and build on each other
- ✅ Performance-critical test suites (saves ~50-100ms per test)
- ✅ Tests that **read-only** from pre-seeded data

**Risks**:
- ❌ **Tests can interfere** - Data persists between tests
- ❌ **Order-dependent** - Test order can cause failures
- ❌ **Not parallel-safe** - Cannot run tests in parallel
- ❌ **Harder to debug** - Failures might be caused by other tests

**If using this pattern, you MUST**:
1. Document that tests share state
2. Clean up data at end of each test, OR
3. Use unique IDs/names to avoid collisions, OR
4. Mark tests as `[Collection("NonParallel")]` to enforce order

### Pattern 4: DI Integration (Service Tests)

**Best for**: Testing services that depend on DbContext and other services.

**Recommended: Per-Test Container**

```csharp
namespace Base2.Services.Test.Access;

public class OrganizationServiceTests
{
    [Fact]
    public async Task CreateAsync_WithValidModel_ShouldPersistToDatabase()
    {
        // Arrange - Fresh database and DI container for this test
        using var container = new TestDbContextContainer();
        var services = await container.AddDbServicesAsync(s =>
        {
            s.AddScoped<OrganizationService>();
            s.AddSingleton<ILogger<OrganizationService>>(Mock.Of<ILogger<OrganizationService>>());
        });
        
        using var scope = services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<OrganizationService>();
        var model = new OrganizationModel { Name = "New Org" };

        // Act
        var result = await service.CreateAsync(model);

        // Assert - Verify in database
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.Organizations.FindAsync(result.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("New Org");
    }
    
    [Fact]
    public async Task UpdateAsync_WithValidModel_ShouldModifyExisting()
    {
        // Arrange - Fresh database (no data from previous test)
        using var container = new TestDbContextContainer();
        var services = await container.AddDbServicesAsync(s =>
        {
            s.AddScoped<OrganizationService>();
            s.AddSingleton<ILogger<OrganizationService>>(Mock.Of<ILogger<OrganizationService>>());
        });
        
        using var scope = services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<OrganizationService>();
        
        // Create initial record
        var created = await service.CreateAsync(new OrganizationModel { Name = "Original" });
        
        // Act - Update
        created.Name = "Updated";
        var result = await service.UpdateAsync(created);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Updated");
    }
}
```

**Alternative: Shared Container (if performance critical)**

```csharp
public class OrganizationServiceTests : IAsyncDisposable
{
    private readonly TestDbContextContainer _container;
    private readonly ServiceProvider _services;

    public OrganizationServiceTests()
    {
        _container = new TestDbContextContainer();
        
        _services = await _container.AddDbServicesAsync(services =>
        {
            services.AddScoped<OrganizationService>();
            services.AddSingleton<ILogger<OrganizationService>>(Mock.Of<ILogger<OrganizationService>>());
        });
    }

    [Fact]
    public async Task CreateAsync_WithValidModel_ShouldPersistToDatabase()
    {
        // WARNING: Database shared across all tests in this class
        using var scope = _services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<OrganizationService>();
        var model = new OrganizationModel { Name = "New Org" };

        var result = await service.CreateAsync(model);

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.Organizations.FindAsync(result.Id);
        saved.Should().NotBeNull();
    }

    public async ValueTask DisposeAsync()
    {
        await _services.DisposeAsync();
        await _container.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
```

### Pattern 3: Multi-Step Workflows (Within Single Test)

**Best for**: Testing workflows that span multiple operations or contexts within a single test.

This pattern uses shared state **within one test method** - which is safe because the container is isolated to that test.

```csharp
[Fact]
public async Task MultiStepWorkflow_ShouldMaintainDataAcrossScopes()
{
    // Container is isolated to THIS TEST ONLY
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);

    long orgId;

    // Step 1: Create organization
    {
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var org = new Organization { Name = "Test Org" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        
        orgId = org.Id;
    } // Scope disposed, but data persists in container

    // Step 2: Verify in new scope (data persists within container!)
    {
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var org = await db.Organizations.FindAsync(orgId);
        org.Should().NotBeNull();
        org!.Name.Should().Be("Test Org");
    }

    // Step 3: Access from Warehouse context (same data!)
    {
        using var scope = container.BeginScope();
        var warehouseDb = scope.Warehouse;
        
        var org = await warehouseDb.Organizations.FindAsync(orgId);
        org.Should().NotBeNull(); // Can access from either context
    }
} // Container disposed - no data leaks to other tests

[Fact]
public async Task AnotherTest_HasCompleteFreshDatabase()
{
    // Fresh container = fresh database (no data from previous test)
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    
    using var scope = container.BeginScope();
    var db = scope.App;
    
    var count = await db.Organizations.CountAsync();
    count.Should().Be(0); // ✅ Empty database
}
```

**Key Insight**: Multiple scopes within one test = multiple DbContext instances sharing one database. This is **safe** because the container is disposed at test end.

### Pattern 5: Time-Dependent Tests

Use `FakeTimeProvider` for testing time-dependent logic.

```csharp
[Fact]
public async Task CreateAsync_ShouldSetTimestampsFromTimeProvider()
{
    // Arrange
    var fakeTime = new FakeTimeProvider();
    fakeTime.SetUtcNow(new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero));

    using var container = new TestDbContextContainer();
    var services = await container.AddTestDbServicesAsync(fakeTime);

    using var scope = services.CreateScope();
    var timeProvider = scope.ServiceProvider.GetRequiredService<TimeProvider>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var org = new Organization 
    { 
        Name = "Test",
        CreatedAt = timeProvider.GetUtcNow().UtcDateTime,
        UpdatedAt = timeProvider.GetUtcNow().UtcDateTime
    };

    // Act
    db.Organizations.Add(org);
    await db.SaveChangesAsync();

    // Assert
    org.CreatedAt.Should().Be(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
}
```

## Test Data Management

### Seeding Test Data

Create helper methods for common test data setup:

```csharp
public class OrganizationTestData
{
    public static async Task<Organization> CreateOrganizationAsync(
        AppDbContext db, 
        string name = "Test Org",
        long tenantId = 1)
    {
        var org = new Organization 
        { 
            Name = name,
            TenantId = tenantId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        
        return org;
    }

    public static async Task<Organization[]> CreateMultipleOrganizationsAsync(
        AppDbContext db, 
        int count)
    {
        var orgs = Enumerable.Range(1, count)
            .Select(i => new Organization 
            { 
                Name = $"Org {i}",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToArray();

        db.Organizations.AddRange(orgs);
        await db.SaveChangesAsync();

        return orgs;
    }
}

// Usage
[Fact]
public async Task Test_WithSeededData()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    
    using var scope = container.BeginScope();
    var db = scope.App;
    
    var org = await OrganizationTestData.CreateOrganizationAsync(db, "My Org");
    
    // Test with the seeded organization...
}
```

### Using Builders for Complex Objects

Combine with test data builders for flexibility:

```csharp
public class OrganizationBuilder
{
    private string _name = "Test Organization";
    private long _tenantId = 1;
    private List<User> _users = new();

    public OrganizationBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public OrganizationBuilder WithTenantId(long tenantId)
    {
        _tenantId = tenantId;
        return this;
    }

    public Organization Build()
    {
        return new Organization
        {
            Name = _name,
            TenantId = _tenantId,
            Users = _users,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public async Task<Organization> BuildAndSaveAsync(AppDbContext db)
    {
        var org = Build();
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        return org;
    }
}

// Usage
[Fact]
public async Task Test_WithBuilder()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    
    using var scope = container.BeginScope();
    var db = scope.App;
    
    var org = await new OrganizationBuilder()
        .WithName("Acme Corp")
        .WithTenantId(42)
        .BuildAndSaveAsync(db);
    
    // Test with the organization...
}
```

## Advanced Scenarios

### Testing Multiple Contexts Interaction

```csharp
[Fact]
public async Task DataChanges_ShouldBeVisibleAcrossBothContexts()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);

    using var scope = container.BeginScope();
    var appDb = scope.App;
    var warehouseDb = scope.Warehouse;

    // Create via App context
    var org = new Organization { Name = "Shared Org", TenantId = 1 };
    appDb.Organizations.Add(org);
    await appDb.SaveChangesAsync();

    // Read via Warehouse context
    var foundOrg = await warehouseDb.Organizations.FindAsync(org.Id);
    foundOrg.Should().NotBeNull();
    foundOrg!.Name.Should().Be("Shared Org");

    // Update via Warehouse context
    foundOrg.Name = "Updated Org";
    await warehouseDb.SaveChangesAsync();

    // Verify via App context (need fresh context to see changes)
    using var newScope = container.BeginScope();
    var refreshedOrg = await newScope.App.Organizations.FindAsync(org.Id);
    refreshedOrg!.Name.Should().Be("Updated Org");
}
```

### Testing Transactions

```csharp
[Fact]
public async Task Transaction_WhenRolledBack_ShouldNotPersistChanges()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);

    using var scope = container.BeginScope();
    var db = scope.App;

    // Start transaction
    await using var transaction = await db.Database.BeginTransactionAsync();

    var org = new Organization { Name = "Temp Org" };
    db.Organizations.Add(org);
    await db.SaveChangesAsync();

    var orgId = org.Id;

    // Rollback
    await transaction.RollbackAsync();

    // Verify not persisted
    using var newScope = container.BeginScope();
    var notFound = await newScope.App.Organizations.FindAsync(orgId);
    notFound.Should().BeNull();
}
```

### Testing Concurrency

```csharp
[Fact]
public async Task ConcurrentUpdates_ShouldHandleOptimisticConcurrency()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);

    // Create initial record
    long orgId;
    {
        using var scope = container.BeginScope();
        var db = scope.App;
        var org = new Organization { Name = "Original" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        orgId = org.Id;
    }

    // Simulate concurrent updates
    using var scope1 = container.BeginScope();
    using var scope2 = container.BeginScope();

    var org1 = await scope1.App.Organizations.FindAsync(orgId);
    var org2 = await scope2.App.Organizations.FindAsync(orgId);

    org1!.Name = "Update 1";
    org2!.Name = "Update 2";

    await scope1.App.SaveChangesAsync(); // First save succeeds

    // Second save should detect concurrency conflict (if RowVersion configured)
    var action = async () => await scope2.App.SaveChangesAsync();
    await action.Should().ThrowAsync<DbUpdateConcurrencyException>();
}
```

## Benefits and Limitations

### Benefits ✅

1. **Fast Execution**: In-memory SQLite is 10-100x faster than PostgreSQL
2. **Isolation**: Each test gets fresh contexts, no test pollution
3. **No External Dependencies**: No need to setup/teardown real databases
4. **CI/CD Friendly**: Works anywhere .NET runs, no infrastructure needed
5. **Multi-Context Support**: Seamlessly test interactions between contexts
6. **DI Compatible**: Integrates with `IServiceProvider` for realistic tests
7. **Proper Disposal**: Implements both `IDisposable` and `IAsyncDisposable`

### Limitations ⚠️

1. **SQLite ≠ PostgreSQL**: Some features differ (arrays, JSON operators, full-text search)
2. **No RLS Testing**: Row-Level Security is PostgreSQL-specific
3. **No True Concurrency**: SQLite doesn't support same-level concurrency as PostgreSQL
4. **Limited Performance Testing**: In-memory database has different performance characteristics
5. **Schema Differences**: Some EF Core migrations may work differently on SQLite vs PostgreSQL

### When to Use Each Approach

| Test Type | Use Data.Mock | Use Real PostgreSQL |
|-----------|---------------|---------------------|
| Unit tests (queries, mappers) | ✅ Yes | ❌ No - too slow |
| Service layer tests | ✅ Yes | ❌ No - too slow |
| Integration tests (basic) | ✅ Yes | ⚠️ Optional |
| RLS policy tests | ❌ No | ✅ Yes - required |
| PostgreSQL-specific features | ❌ No | ✅ Yes - required |
| Performance/load tests | ❌ No | ✅ Yes - required |
| Pre-deployment smoke tests | ❌ No | ✅ Yes - required |

**Recommendation**: Use `Data.Mock` for **fast unit/integration tests** (80%), use real PostgreSQL for **RLS and production-specific tests** (20%).

## Test Categorization

Use traits to distinguish between test types:

```csharp
[Fact]
[Trait("Category", "Unit")]
[Trait("Database", "Sqlite")]
public async Task FastTest_UsingSqlite() { }

[Fact]
[Trait("Category", "Integration")]
[Trait("Database", "Npgsql")]
public async Task SlowerTest_UsingPostgreSQL() { }
```

Run tests by database type:

```bash
# Run only SQLite tests (fast)
dotnet test --filter "Database=Sqlite"

# Run only PostgreSQL tests
dotnet test --filter "Database=Npgsql"

# Skip PostgreSQL tests in CI
dotnet test --filter "Database!=Npgsql"
```

## Best Practices

### Test Isolation Patterns

**✅ RECOMMENDED: Per-Test Container (Pattern 1)**

```csharp
[Fact]
public async Task MyTest()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    // Test code...
}
```

**Why**: Complete isolation, no side effects, parallel-safe, simple cleanup.

**⚠️ USE WITH CAUTION: Shared Container (Pattern 2)**

```csharp
public class MyTests : IAsyncLifetime
{
    private TestDbContextContainer _container = null!;
    
    public async Task InitializeAsync()
    {
        _container = new TestDbContextContainer();
        await _container.CreateAsync(DatabaseNames.App);
    }
    
    // Tests share the same database ⚠️
}
```

**Why**: Faster, but risks test interference. Only use when:
- Tests are read-only
- Tests explicitly clean up after themselves
- Tests are intentionally sequential
- Performance is critical

**Decision Guide**:

| Scenario | Pattern | Reason |
|----------|---------|--------|
| Default case | Per-Test (1) | Safety first |
| Query tests (read-only) | Either | No mutation = safe |
| CRUD tests | Per-Test (1) | Mutations need isolation |
| Multi-step workflows | Per-Test (1) | Use multiple scopes within test |
| Performance-critical suite | Shared (2) | With careful data management |
| Parallel test execution | Per-Test (1) | Shared causes race conditions |

### DO ✅

- **Use Per-Test container by default** (Pattern 1)
- Create helper methods for common test data setup
- Use test data builders for complex objects
- Use multiple scopes within one test for workflows (Pattern 3)
- Use `FakeTimeProvider` for time-dependent logic
- Add traits to categorize tests by database type
- Document if using shared container pattern

### DON'T ❌

- Don't share containers across tests without good reason
- Don't rely on `Data.Mock` for PostgreSQL-specific features
- Don't test RLS policies with SQLite (use PostgreSQL)
- Don't assume SQLite behavior matches PostgreSQL exactly
- Don't use Pattern 2 (shared container) unless you understand the risks
- Don't rely on test execution order for data setup

## Related Documentation

- [Server Testing Strategy](../../overview/server/testing-strategy.md) - Overall testing approach
- [Server Testing Patterns](./testing-patterns.md) - General testing patterns
- [Testing Conventions](../../conventions/testing-conventions.md) - Naming and organization

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
