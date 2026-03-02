# Server Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Product Name server applications (.NET/C#). It defines what we test, how we test it, and the quality standards we maintain across the server codebase.

## Testing Philosophy

Our server testing approach follows these core principles:

1. **Layered Testing**: Test each architectural layer appropriately (Web → Services → Data → Contracts)
2. **Integration Over Mocking**: Prefer integration tests with real dependencies when practical
3. **Fast Feedback**: Unit tests run in milliseconds, integration tests in seconds
4. **Maintainability**: Tests should survive refactoring of implementation details
5. **Confidence**: Tests should catch regressions before they warehouse production

## Testing Pyramid

We follow the testing pyramid adapted for .NET server applications:

```
        ╱╲
       ╱  ╲
      ╱E2E ╲          ~5% - Full stack (via Playwright from client)
     ╱──────╲
    ╱  API   ╲        ~15% - WebApplicationFactory tests
   ╱Integration╲
  ╱────────────╲
 ╱ Unit & Data  ╲     ~80% - Services, queries, mappers, utilities
╱    Tests       ╲
──────────────────
```

### Unit Tests (60%)

**What**: Pure business logic, services, utilities, validators

**Why**: Fast execution, precise failure isolation, test complex logic thoroughly

**Tools**: xUnit, FluentAssertions (AwesomeAssertions)

**Examples**:
- Service methods (`OrganizationService.CreateAsync()`)
- Validation logic
- Mapper classes
- Utility functions
- Enumeration classes

**Coverage Target**: 90%+ for business logic, 100% for validators

### Data Layer Tests (20%)

**What**: Queries, database operations, EF Core entities, mappers

**Why**: Ensure database operations work correctly, test RLS policies

**Tools**: xUnit, SQLite in-memory database, FluentAssertions

**Examples**:
- Query classes (`OrganizationQuery`)
- Entity configurations (`OnModelCreating`)
- Mapper functionality
- RLS (Row-Level Security) policies
- Database migrations

**Coverage Target**: 85%+ for data access code

### Integration Tests (15%)

**What**: API endpoints with WebApplicationFactory, multi-layer workflows

**Why**: Verify layers work together, test real HTTP requests/responses

**Tools**: xUnit, WebApplicationFactory, FluentAssertions

**Examples**:
- Controller endpoints
- Authentication/authorization flows
- Request validation
- Response serialization
- Multi-tenant isolation

**Coverage Target**: All API endpoints, critical workflows

### End-to-End Tests (5%)

**What**: Full stack tests through the UI (managed by client team)

**Why**: Verify complete user journeys with real browser

**Tools**: Playwright (from client tests)

**Note**: E2E tests are primarily owned by the client team and test through the UI. Server team ensures APIs support these tests.

## Test Organization

### Directory Structure

```
main/src/server/
├── Base2.Web/
│   ├── src/                          # Application code
│   └── test/                         # Integration tests
│       ├── Properties/
│       │   └── GlobalUsings.cs
│       ├── Helpers/
│       │   ├── WebApplicationFactoryFixture.cs
│       │   └── ApiClient.cs
│       ├── Auth/
│       │   └── LoginTests.cs
│       └── Access/
│           └── OrganizationControllerTests.cs
│
├── Base2.Services/
│   ├── src/
│   └── test/                         # Service unit tests
│       └── Identity/
│           └── UserServiceTests.cs
│
├── Base2.Data/
│   ├── src/
│   └── test/                         # Data layer tests
│       ├── RlsUnitTest.cs
│       └── Access/
│           └── OrganizationQueryTests.cs
│
└── Base2.Common/
    ├── src/
    └── test/                         # Utility tests
        └── Pagination/
            └── PagedResultTests.cs
```

### Naming Conventions

- **Test Projects**: `{Project}.Test.csproj` (e.g., `Base2.Web.Test.csproj`)
- **Test Classes**: `{ClassName}Tests` (e.g., `OrganizationServiceTests`)
- **Test Methods**: `{Method}_{Scenario}_Should{Expected}` (e.g., `Create_WithValidModel_ShouldReturnCreated`)

See [Testing Conventions](../../conventions/testing-conventions.md) for detailed naming standards.

## Test Types by Layer

### Contracts Layer (DTOs/Models)

**What We Test**:
- Model validation attributes
- Data annotations
- Serialization/deserialization

**Testing Approach**:
- Validation attribute tests
- JSON serialization tests (if custom logic)
- Generally minimal testing (simple DTOs)

**Example**: Testing that `[Required]` attribute on `Email` property is enforced

### Data Layer

**What We Test**:
- Query methods
- Entity configurations
- Mappers (Mapperly)
- Database migrations
- RLS policies (PostgreSQL)

**Testing Approach**:
- SQLite in-memory for unit tests
- PostgreSQL for RLS and production-specific features
- Test both read and write operations
- Verify soft deletes work correctly

**Example**: Testing `OrganizationQuery.SingleOrDefaultAsync()` returns correct entity

### Services Layer

**What We Test**:
- Business logic
- CRUD operations
- Validation rules
- Error handling
- Service orchestration

**Testing Approach**:
- Mock data layer dependencies
- Test success and error paths
- Verify logging calls
- Test timestamp management

**Example**: Testing `OrganizationService.CreateAsync()` sets `CreatedAt` and `UpdatedAt`

### Web Layer (Controllers)

**What We Test**:
- HTTP request/response handling
- Route parameters and query strings
- Request validation
- Authorization
- Status codes
- Response serialization

**Testing Approach**:
- Use WebApplicationFactory for integration tests
- Test with real in-memory database
- Verify authentication/authorization
- Test all HTTP verbs (GET, POST, PUT, DELETE)

**Example**: Testing `OrganizationController.Get()` returns 404 when organization not found

## Coverage Goals

### Minimum Coverage Requirements

| Layer | Target | Critical |
|-------|--------|----------|
| Business Logic (Services) | 90% | 100% |
| Data Access (Queries) | 85% | 95% |
| Controllers (Web) | 80% | 90% |
| Utilities (Common) | 95% | 100% |
| Mappers | 90% | 100% |

### What NOT to Test

- Third-party libraries (EF Core, ASP.NET Core, Hangfire)
- Auto-generated code (Mapperly mappers, migrations)
- Simple DTOs with no logic
- Framework infrastructure code
- Database provider internals

## Testing Practices

### Test Structure (AAA Pattern)

Follow the **Arrange-Act-Assert** pattern:

```csharp
[Fact]
public async Task Create_WithValidModel_ShouldReturnCreated()
{
    // Arrange - Set up test data and dependencies
    var service = new OrganizationService(_mockDbContext.Object, _mockLogger.Object);
    var model = new OrganizationModel { Name = "Test Org" };

    // Act - Perform the operation
    var result = await service.CreateAsync(model);

    // Assert - Verify the outcome
    result.Should().NotBeNull();
    result.Id.Should().BeGreaterThan(0);
    result.Name.Should().Be("Test Org");
}
```

### Assertion Style

Use FluentAssertions for readable, expressive assertions:

```csharp
// ✅ Good - FluentAssertions
result.Should().NotBeNull();
result.Name.Should().Be("Test Org");
result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

// ❌ Bad - xUnit assertions
Assert.NotNull(result);
Assert.Equal("Test Org", result.Name);
```

### Mocking Strategy

**Mock External Dependencies**:
- ✅ Database context (for service tests)
- ✅ HTTP clients
- ✅ Third-party services
- ✅ File system access
- ✅ Time/DateTime (via `ITimeProvider`)

**Don't Mock Internal Code**:
- ❌ Your own utilities
- ❌ Models/DTOs
- ❌ Mappers (test them directly)
- ❌ Query classes (test with real database)

### Test Isolation

Each test must be independent:

```csharp
public class OrganizationServiceTests : IDisposable
{
    private readonly Mock<WarehouseDbContext> _mockDbContext;
    private readonly OrganizationService _service;

    public OrganizationServiceTests()
    {
        // Fresh mocks for each test
        _mockDbContext = new Mock<WarehouseDbContext>();
        _service = new OrganizationService(_mockDbContext.Object);
    }

    public void Dispose()
    {
        // Clean up if needed
        GC.SuppressFinalize(this);
    }
}
```

### Testing Database Operations

Use `Base2.Data.Mock` for fast, isolated database tests:

```csharp
public class OrganizationQueryTests
{
    [Fact]
    public async Task Test_WithRealDatabase()
    {
        // Fresh database per test (recommended)
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        
        using var scope = container.BeginScope();
        var db = scope.App;
        
        // Test with real EF Core and SQLite...
        var org = new Organization { Name = "Test" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        
        org.Id.Should().BeGreaterThan(0);
    }
}
```

**Key Benefits**:
- 10-100x faster than PostgreSQL
- Complete test isolation (fresh database per test)
- Supports multiple DbContexts (App + Warehouse)
- No external infrastructure required
- Parallel-safe test execution

**See**: [Database Testing Pattern](../../patterns/server/database-testing-pattern.md) for complete guide.

## Continuous Integration

### Pre-commit Checks

Fast unit tests only:

```bash
dotnet test --filter "Category!=Integration&Category!=Npgsql" --no-build
```

### Pull Request Checks

All tests except PostgreSQL-specific:

```bash
dotnet test --filter "Category!=Npgsql"
dotnet test --collect:"XPlat Code Coverage"
```

### Pre-deployment Checks

Complete test suite including PostgreSQL tests:

```bash
dotnet test
dotnet test --collect:"XPlat Code Coverage"
```

### Coverage Reporting

- Use Coverlet for code coverage collection
- Integrate with CI/CD (GitHub Actions, Azure DevOps)
- Fail builds if coverage drops below thresholds
- Generate HTML reports for review

```bash
# Generate coverage report
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# Generate HTML report
reportgenerator -reports:./coverage/**/coverage.cobertura.xml \
                -targetdir:./coverage/report \
                -reporttypes:Html
```

## Integration Testing with WebApplicationFactory

### When to Write Integration Tests

Write integration tests for:
- ✅ All API endpoints (CRUD operations)
- ✅ Authentication and authorization flows
- ✅ Request/response validation
- ✅ Multi-tenant isolation
- ✅ Complex workflows spanning multiple services

Skip integration tests for:
- ❌ Simple service methods (use unit tests)
- ❌ Pure data operations (use data layer tests)
- ❌ UI behavior (covered by E2E tests)

### Test Organization

```
Base2.Web/test/
├── Auth/
│   ├── LoginTests.cs
│   └── RegisterTests.cs
├── Access/
│   ├── OrganizationControllerTests.cs
│   └── UserControllerTests.cs
└── Helpers/
    ├── WebApplicationFactoryFixture.cs
    └── ApiClient.cs
```

### Test Fixture Setup

Use collection fixtures to share expensive setup:

```csharp
[CollectionDefinition(Name)]
public class WebApplicationFactoryCollection : ICollectionFixture<WebApplicationFactoryFixture>
{
    public const string Name = "WebApplicationFactory Collection";
}

[Collection(WebApplicationFactoryCollection.Name)]
public class LoginTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;
    
    // Tests use shared factory
}
```

## Testing Multi-Tenancy and RLS

### Testing Tenant Isolation

```csharp
[Fact]
[Trait("Category", "Integration")]
public async Task GetOrganization_AsDifferentTenant_ShouldReturnNotFound()
{
    // Create org as Tenant 1
    var org = await CreateOrganization(tenantId: 1, name: "Tenant 1 Org");

    // Try to access as Tenant 2
    var client = await CreateAuthenticatedClient(tenantId: 2);
    var response = await client.GetAsync($"/api/access/organization/{org.Id}");

    // Should not find org due to RLS
    response.StatusCode.Should().Be(HttpStatusCode.NotFound);
}
```

### Testing RLS Policies

Use PostgreSQL-specific tests with `[Trait("Category", "Npgsql")]`:

```csharp
[Fact]
[Trait("Category", "Npgsql")]
public async Task Query_WithRlsEnabled_ShouldFilterByTenant()
{
    // Setup RLS context for Tenant 1
    await SetRlsContext(tenantId: 1);

    // Query should only return Tenant 1 data
    var orgs = await _dbContext.Organizations.ToListAsync();
    orgs.Should().OnlyContain(o => o.TenantId == 1);
}
```

## Performance Testing

### Load Testing

Use tools like k6 or Apache Bench for API load testing:

```javascript
// k6 load test script
import http from 'k6/http';
import { check } from 'k6';

export default function() {
  const res = http.get('http://localhost:8181/api/access/organization');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

### Query Performance

Test query performance with larger datasets:

```csharp
[Fact]
[Trait("Category", "Performance")]
public async Task ListOrganizations_WithThousandsOfRecords_ShouldBeEfficient()
{
    // Arrange - Create 10,000 organizations
    var orgs = Enumerable.Range(1, 10_000)
        .Select(i => new Organization { Name = $"Org {i}" })
        .ToList();
    
    _dbContext.Organizations.AddRange(orgs);
    await _dbContext.SaveChangesAsync();

    // Act
    var stopwatch = Stopwatch.StartNew();
    var result = await _query.ListAsync();
    stopwatch.Stop();

    // Assert
    result.Should().HaveCount(10_000);
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000); // < 1 second
}
```

## Debugging Tests

### Running Tests

```bash
# Run all tests
dotnet test

# Run tests in specific project
dotnet test Base2.Web.Test

# Run single test class
dotnet test --filter "FullyQualifiedName~LoginTests"

# Run single test method
dotnet test --filter "Name=PostLogin_WithValidCredentials_ShouldReturnToken"

# Run with verbose output
dotnet test --logger "console;verbosity=detailed"
```

### Test Categorization

Use traits to organize tests:

```bash
# Run only unit tests
dotnet test --filter "Category=Unit"

# Skip integration tests
dotnet test --filter "Category!=Integration"

# Run only PostgreSQL tests
dotnet test --filter "Category=Npgsql"

# Run fast tests only
dotnet test --filter "Category!=Slow"
```

### Visual Studio / Rider Integration

- Use Test Explorer to run/debug tests
- Set breakpoints in test code
- View test output in real-time
- Run tests on file save (with plugins)

## Test Maintenance

### When Tests Break

1. **Understand why**: Check if bug in code or test
2. **Fix root cause**: Update code or test as appropriate
3. **Update test data**: Keep seed data current with schema
4. **Refactor if brittle**: Tests breaking from minor changes indicate tight coupling

### Refactoring Tests

- Extract setup to helper methods or fixtures
- Use test data builders for complex objects
- Create custom assertions for domain-specific checks
- Share test utilities across projects

### Removing Tests

Delete tests when:
- Feature is removed
- Test is duplicate of another
- Test has been flaky without resolution
- Test is testing framework internals

## Related Documentation

- [Server Testing Patterns](../../patterns/server/testing-patterns.md) - Detailed technical patterns
- [Database Testing Pattern](../../patterns/server/database-testing-pattern.md) - In-memory database testing
- [Testing Conventions](../../conventions/testing-conventions.md) - Naming and style guide
- [Server Overview](./server-overview.md) - Overall architecture
- [Server Architecture Patterns](../../patterns/server/server-architecture-patterns.md) - Layered architecture

## Resources

### Internal

- [Database Testing Pattern](../../patterns/server/database-testing-pattern.md) - Comprehensive Data.Mock guide
- [Server Component Template](../../patterns/server/server-component-template.md)
- [Mapper Patterns](../../patterns/server/mapper-patterns.md)
- [Pagination Patterns](../../patterns/server/pagination-patterns.md)

### External

- [xUnit Documentation](https://xunit.net/)
- [FluentAssertions](https://fluentassertions.com/)
- [Moq Quickstart](https://github.com/devlooped/moq/wiki/Quickstart)
- [WebApplicationFactory](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests)
- [EF Core Testing](https://learn.microsoft.com/en-us/ef/core/testing/)

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
