# Testing Guide - Start Here

## Quick Decision Tree

```
What are you testing?
├─ Server code?
│  ├─ New to testing? → Read "Understanding Our Approach" (5 min)
│  ├─ Ready to write tests? → Jump to "Writing Tests" section
│  └─ Database code? → See "Database Testing" section
│
└─ Client code?
   └─ Client testing guide (TBD)
```

## Server Testing

### Understanding Our Approach (5 minutes)

**📖 [Server Testing Strategy](../overview/server/testing-strategy.md)**

**Key Principles:**
1. **Integration over mocking** - Use real dependencies when practical
2. **Fast feedback** - Unit tests in milliseconds, integration in seconds
3. **80/20/5 pyramid** - 80% unit/data tests, 15% integration, 5% E2E

**Testing Stack:**
- **xUnit** - Test framework
- **FluentAssertions** - Readable assertions
- **WebApplicationFactory** - Integration testing
- **Base2.Data.Mock** - Fast database tests

**Coverage Goals:**
- Business logic (services): 90%+
- Data access (queries): 85%+
- Controllers (web): 80%+
- Utilities: 95%+

### Writing Tests

**📖 [Server Testing Patterns](../patterns/server/testing-patterns.md)** - Complete reference

#### Test Organization

```
MyProject/
├── src/                          # Production code
│   └── OrganizationService.cs
└── test/                         # Tests alongside src
    ├── Properties/
    │   └── GlobalUsings.cs       # Global imports
    ├── Helpers/                  # Test utilities
    └── OrganizationServiceTests.cs
```

#### Unit Test Template

```csharp
namespace MyProject.Test;

public class OrganizationServiceTests
{
    [Fact]
    public async Task CreateAsync_WithValidModel_ShouldReturnCreated()
    {
        // Arrange - Setup test data and dependencies
        var mockDb = new Mock<WarehouseDbContext>();
        var service = new OrganizationService(mockDb.Object, Mock.Of<ILogger>());
        var model = new OrganizationModel { Name = "Test Org" };

        // Act - Perform the operation
        var result = await service.CreateAsync(model);

        // Assert - Verify the outcome
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Name.Should().Be("Test Org");
    }
}
```

#### Integration Test Template

```csharp
[Collection(WebApplicationFactoryCollection.Name)]
public class OrganizationControllerTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task Get_WithValidId_ShouldReturnOrganization()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client);

        // Act
        var response = await client.GetAsync("/api/access/organization/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var org = await response.Content.ReadFromJsonAsync<OrganizationDetailModel>();
        org.Should().NotBeNull();
    }
}
```

### Database Testing

**📖 [Database Testing Pattern](../patterns/server/database-testing-pattern.md)** - Complete guide

#### Why Use Data.Mock?

- ✅ **10-100x faster** than PostgreSQL
- ✅ **Isolated** - Fresh database per test
- ✅ **No infrastructure** - Works anywhere
- ✅ **Multi-context** - Test App + Warehouse together

#### Recommended Pattern: Per-Test Container

```csharp
public class OrganizationQueryTests
{
    [Fact]
    public async Task SingleOrDefaultAsync_WhenExists_ShouldReturnOrganization()
    {
        // Arrange - Fresh database for this test (recommended!)
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
        // Fresh database - no data from previous test!
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
        result.Should().HaveCount(2); // ✅ Guaranteed count
    }
}
```

**Why this pattern?**
- ✅ Complete test isolation
- ✅ No cleanup needed
- ✅ Parallel-safe
- ✅ Simple structure

#### Service Testing with DI

```csharp
public class OrganizationServiceTests
{
    [Fact]
    public async Task CreateAsync_WithValidModel_ShouldPersistToDatabase()
    {
        // Arrange - Fresh database and DI container
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

        // Assert
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.Organizations.FindAsync(result.Id);
        saved.Should().NotBeNull();
        saved!.Name.Should().Be("New Org");
    }
}
```

### When to Use Each Test Type

| Test Type | Use For | Tool |
|-----------|---------|------|
| **Unit tests** | Services, utilities, validators | Mock dependencies |
| **Data tests** | Queries, mappers, entity logic | Data.Mock (SQLite) |
| **Integration tests** | API endpoints, auth flows | WebApplicationFactory |
| **RLS tests** | Row-level security policies | Real PostgreSQL |
| **Performance tests** | Load testing, query optimization | Real PostgreSQL |

## Test Organization Checklist

When writing tests:
- [ ] Place in `{Project}/test/` directory
- [ ] Name: `{ClassName}Tests.cs`
- [ ] Use AAA pattern (Arrange-Act-Assert)
- [ ] Add `[Trait("Category", "Unit")]` for filtering
- [ ] Use FluentAssertions for assertions
- [ ] Use Per-Test container for database tests

## Running Tests

### Basic Commands

```bash
# Run all tests
dotnet test

# Run tests in specific project
dotnet test Base2.Web.Test

# Run single test class
dotnet test --filter "FullyQualifiedName~OrganizationServiceTests"

# Run single test method
dotnet test --filter "Name=CreateAsync_WithValidModel_ShouldReturnCreated"
```

### By Category

```bash
# Run only unit tests
dotnet test --filter "Category=Unit"

# Skip integration tests (faster)
dotnet test --filter "Category!=Integration"

# Skip PostgreSQL tests (for CI)
dotnet test --filter "Category!=Npgsql"

# Run fast tests only
dotnet test --filter "Category!=Slow"
```

### With Coverage

```bash
# Generate coverage report
dotnet test --collect:"XPlat Code Coverage"

# Generate HTML report
reportgenerator \
  -reports:./coverage/**/coverage.cobertura.xml \
  -targetdir:./coverage/report \
  -reporttypes:Html
```

## Common Test Patterns

### Testing CRUD Operations

```csharp
[Fact]
public async Task Create_WithValidModel_ShouldReturnCreated()
{
    // Test creation...
}

[Fact]
public async Task Read_WithValidId_ShouldReturnEntity()
{
    // Test reading...
}

[Fact]
public async Task Update_WithValidModel_ShouldModifyEntity()
{
    // Test updating...
}

[Fact]
public async Task Delete_WithValidId_ShouldRemoveEntity()
{
    // Test deletion...
}
```

### Testing Error Paths

```csharp
[Fact]
public async Task Create_WithNullModel_ShouldThrowArgumentNullException()
{
    var action = async () => await _service.CreateAsync(null!);
    await action.Should().ThrowAsync<ArgumentNullException>();
}

[Fact]
public async Task Get_WithInvalidId_ShouldReturnNotFound()
{
    var response = await _client.GetAsync("/api/org/999999");
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
}
```

### Testing Validation

```csharp
[Theory]
[InlineData("")]
[InlineData("   ")]
[InlineData(null)]
public async Task Create_WithInvalidName_ShouldReturnBadRequest(string? name)
{
    var model = new OrganizationModel { Name = name! };
    var response = await _client.PostAsJsonAsync("/api/org", model);
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
}
```

### Testing Mappers

```csharp
[Fact]
public void ToModel_ShouldMapAllProperties()
{
    var entity = new Organization
    {
        Id = 1,
        Name = "Test Org",
        CreatedAt = DateTime.UtcNow
    };

    var model = entity.ToModel();

    model.Id.Should().Be(entity.Id);
    model.Name.Should().Be(entity.Name);
    // Temporal fields should NOT be in Model
}

[Fact]
public void ToDetailModel_ShouldIncludeTemporalFields()
{
    var entity = new Organization
    {
        Id = 1,
        Name = "Test Org",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var detailModel = entity.ToDetailModel();

    detailModel.CreatedAt.Should().NotBe(default);
    detailModel.UpdatedAt.Should().NotBe(default);
}
```

## Best Practices

### DO ✅

- **Write tests first** or immediately after implementation
- **Test both success and error paths**
- **Use descriptive test names** that explain the scenario
- **Isolate tests** - No shared state between tests
- **Use FluentAssertions** for readable assertions
- **Use Per-Test container** for database tests (Pattern 1)
- **Mock external dependencies** (HTTP, file system)
- **Test edge cases** and boundary conditions

### DON'T ❌

- **Don't share database** between tests (avoid Pattern 2)
- **Don't use Task.Wait() or .Result** (causes deadlocks)
- **Don't test framework internals** (EF Core, ASP.NET Core)
- **Don't commit tests with hardcoded secrets**
- **Don't ignore failing tests**
- **Don't write tests that depend on execution order**

## When NOT to Use Data.Mock

Use real PostgreSQL for:
- ❌ RLS (Row-Level Security) tests
- ❌ PostgreSQL-specific features (arrays, JSON operators)
- ❌ Performance testing
- ❌ Pre-deployment smoke tests

## Debugging Tests

### In Visual Studio / Rider
1. Set breakpoints in test code
2. Right-click test → Debug
3. Step through code

### Command Line
```bash
# Verbose output
dotnet test --logger "console;verbosity=detailed"

# Filter to specific test
dotnet test --filter "Name=MyFailingTest" --logger "console;verbosity=detailed"
```

### Common Issues

**Problem**: Test fails with "database locked"  
**Solution**: Ensure you're disposing containers/scopes properly with `using`

**Problem**: Tests interfere with each other  
**Solution**: Use Per-Test container pattern (Pattern 1), not shared container

**Problem**: Integration test fails with 401 Unauthorized  
**Solution**: Add authentication to test client (see Testing Patterns doc)

**Problem**: Can't find WebApplicationFactory  
**Solution**: Reference `Microsoft.AspNetCore.Mvc.Testing` package

## Quick Reference: Test Types

### Unit Test (Service)
```csharp
// Mock dependencies, test business logic
var mockDb = new Mock<DbContext>();
var service = new MyService(mockDb.Object);
```

### Database Test (Query)
```csharp
// Real database (SQLite), test queries
using var container = new TestDbContextContainer();
await container.CreateAsync(DatabaseNames.App);
using var scope = container.BeginScope();
var db = scope.App;
```

### Integration Test (Controller)
```csharp
// Real HTTP requests, test endpoints
[Collection(WebApplicationFactoryCollection.Name)]
public class MyTests(WebApplicationFactoryFixture fixture)
{
    var client = fixture.Factory.CreateClient();
}
```

## Next Steps

After writing tests:
- Run `dotnet test` to verify all pass
- Check coverage with `dotnet test --collect:"XPlat Code Coverage"`
- Add traits for categorization
- Update tests when implementation changes
- Keep test code clean and maintainable

## Related Documentation

- [Testing Strategy](../overview/server/testing-strategy.md) - Philosophy and approach
- [Testing Patterns](../patterns/server/testing-patterns.md) - Complete technical reference
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md) - Data.Mock deep dive
- [Server Architecture](../patterns/server/server-architecture-patterns.md) - What to test

