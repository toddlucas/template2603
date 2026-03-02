# Server Testing Patterns

## Overview

This document describes the technical patterns and best practices for testing .NET/C# code in the Product Name server. It covers unit testing, integration testing with WebApplicationFactory, and provides concrete examples using our testing stack.

## Testing Stack

- **xUnit**: Test framework (preferred)
- **FluentAssertions**: Expressive assertions via AwesomeAssertions
- **WebApplicationFactory**: Integration testing with in-memory test server
- **Moq** or **NSubstitute**: Mocking framework (when needed)
- **SQLite**: In-memory database for testing

## Directory Structure

### Test Organization

```
main/src/server/
├── Base2.Web/
│   ├── src/                          # Application code
│   │   └── Controllers/
│   │       └── OrganizationController.cs
│   └── test/                         # Tests alongside src
│       ├── Properties/
│       │   └── GlobalUsings.cs       # Global test imports
│       ├── Helpers/
│       │   ├── WebApplicationFactoryFixture.cs
│       │   └── ApiClient.cs
│       ├── Auth/
│       │   └── LoginTests.cs         # Feature-organized tests
│       └── Base2.Web.Test.csproj
│
├── Base2.Services/
│   ├── src/
│   │   └── Identity/
│   │       └── UserService.cs
│   └── test/                         # Service unit tests
│       └── Identity/
│           └── UserServiceTests.cs
│
├── Base2.Data/
│   ├── src/
│   │   └── Access/
│   │       └── OrganizationQuery.cs
│   └── test/                         # Data layer tests
│       ├── RlsUnitTest.cs
│       └── Access/
│           └── OrganizationQueryTests.cs
│
└── Base2.Common/
    ├── src/
    │   └── Pagination/
    │       └── PagedResult.cs
    └── test/                         # Utility tests
        └── Pagination/
            └── PagedResultTests.cs
```

### Key Principles

1. **Colocated Tests**: Test projects live alongside source projects (`src/` and `test/` folders)
2. **Feature Organization**: Tests organized by feature area (Auth, Identity, Access)
3. **Shared Helpers**: Reusable test utilities in `Helpers/` directory
4. **Global Usings**: Common imports in `Properties/GlobalUsings.cs`

## Unit Testing Patterns

### Testing Pure Functions

```csharp
namespace Base2.Common.Test.Pagination;

public class PagedResultTests
{
    [Fact]
    public void Constructor_WithValidData_ShouldSetProperties()
    {
        // Arrange
        var items = new[] { 1, 2, 3 };
        var total = 10;
        var page = 2;
        var pageSize = 3;

        // Act
        var result = new PagedResult<int>(items, total, page, pageSize);

        // Assert
        result.Data.Should().Equal(items);
        result.Total.Should().Be(total);
        result.Page.Should().Be(page);
        result.PageSize.Should().Be(pageSize);
        result.TotalPages.Should().Be(4); // Calculated property
    }

    [Theory]
    [InlineData(0, 10)]
    [InlineData(-1, 10)]
    [InlineData(1, 0)]
    [InlineData(1, -1)]
    public void Constructor_WithInvalidParameters_ShouldThrowArgumentException(int page, int pageSize)
    {
        // Arrange
        var items = Array.Empty<int>();

        // Act
        var action = () => new PagedResult<int>(items, 0, page, pageSize);

        // Assert
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void HasNextPage_WhenOnLastPage_ShouldBeFalse()
    {
        // Arrange
        var result = new PagedResult<int>(new[] { 1, 2 }, total: 2, page: 1, pageSize: 10);

        // Act & Assert
        result.HasNextPage.Should().BeFalse();
    }
}
```

### Testing Services with Dependencies

```csharp
namespace Base2.Services.Test.Identity;

public class UserServiceTests
{
    private readonly Mock<WarehouseDbContext> _mockDbContext;
    private readonly Mock<ILogger<UserService>> _mockLogger;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _mockDbContext = new Mock<WarehouseDbContext>();
        _mockLogger = new Mock<ILogger<UserService>>();
        _service = new UserService(_mockDbContext.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var userId = 1L;
        var expectedUser = new UserModel { Id = userId, Email = "test@example.com" };
        
        var mockQuery = new Mock<UserQuery>();
        mockQuery.Setup(q => q.SingleOrDefaultAsync(userId, default))
            .ReturnsAsync(new User { Id = userId, Email = "test@example.com" });

        // Act
        var result = await _service.ReadOrDefaultAsync(userId, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task CreateUserAsync_WithValidModel_ShouldSetTimestamps()
    {
        // Arrange
        var model = new UserModel { Email = "new@example.com" };
        var beforeCreate = DateTime.UtcNow;

        // Act
        var result = await _service.CreateAsync(model);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        _mockDbContext.Verify(db => db.SaveChangesAsync(default), Times.Once);
        _mockLogger.VerifyLog(LogLevel.Information, "Created user", Times.Once());
    }

    [Fact]
    public async Task DeleteUserAsync_WhenUserNotFound_ShouldReturnFalse()
    {
        // Arrange
        var userId = 999L;
        
        _mockDbContext.Setup(db => db.Users.FindAsync(userId))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _service.DeleteAsync(userId);

        // Assert
        result.Should().BeFalse();
        _mockDbContext.Verify(db => db.SaveChangesAsync(default), Times.Never);
    }
}
```

## Database Testing with Base2.Data.Mock

For fast, isolated database testing, use the `Base2.Data.Mock` library. This provides in-memory SQLite databases with complete test isolation.

### Quick Example (Recommended Pattern)

```csharp
public class OrganizationQueryTests
{
    [Fact]
    public async Task SingleOrDefaultAsync_WhenExists_ShouldReturnOrganization()
    {
        // Arrange - Fresh database for each test (recommended)
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
        // Fresh database - no data from previous test
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

### Key Benefits

- **10-100x faster** than real PostgreSQL
- **Isolated** - each test gets fresh contexts
- **No infrastructure** - no database setup required
- **Multi-context** - test App and Warehouse together

### When to Use

✅ Use for: Unit tests, service tests, query tests, mapper tests  
❌ Don't use for: RLS tests, PostgreSQL-specific features, performance tests

**See**: [Database Testing Pattern](./database-testing-pattern.md) for comprehensive documentation.

## Integration Testing with WebApplicationFactory

### Setting Up Test Fixture

```csharp
// test/Helpers/WebApplicationFactoryFixture.cs
namespace Base2.Web.Test;

public class WebApplicationFactoryFixture : IDisposable
{
    public WebApplicationFactory<Program> Factory { get; }

    public WebApplicationFactoryFixture()
    {
        // Configure test database paths
        Environment.SetEnvironmentVariable(
            "ConnectionStrings:SqliteAppDbContextConnection", 
            "Data Source=:memory:"
        );
        
        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove production database
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>)
                    );
                    
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add in-memory database for testing
                    services.AddDbContext<AppDbContext>(options =>
                    {
                        options.UseSqlite("Data Source=:memory:");
                        options.EnableSensitiveDataLogging();
                    });

                    // Seed test data
                    var sp = services.BuildServiceProvider();
                    using var scope = sp.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    db.Database.OpenConnection();
                    db.Database.EnsureCreated();
                    SeedTestData(db);
                });

                builder.UseEnvironment("Testing");
            });
    }

    private static void SeedTestData(AppDbContext db)
    {
        db.Users.Add(new User 
        { 
            Email = "test@example.com",
            // Add other required fields
        });
        db.SaveChanges();
    }

    public void Dispose()
    {
        Factory.Dispose();
        GC.SuppressFinalize(this);
    }
}

[CollectionDefinition(Name)]
public class WebApplicationFactoryCollection : ICollectionFixture<WebApplicationFactoryFixture>
{
    public const string Name = "WebApplicationFactory Collection";
}
```

### API Integration Tests

```csharp
namespace Base2.Web.Test.Auth;

[Collection(WebApplicationFactoryCollection.Name)]
public class LoginTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task PostLogin_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new LoginRequest 
        { 
            Email = "test@example.com", 
            Password = "Password123!" 
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<AccessTokenResponse>();
        result.Should().NotBeNull();
        result!.AccessToken.Should().NotBeNullOrWhiteSpace();
        result.ExpiresIn.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task PostLogin_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new LoginRequest 
        { 
            Email = "test@example.com", 
            Password = "WrongPassword" 
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostLogin_WithMissingEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new LoginRequest { Password = "Password123!" };

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var problemDetails = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        problemDetails.Should().NotBeNull();
        problemDetails!.Errors.Should().ContainKey("Email");
    }
}
```

### Testing Controllers

```csharp
namespace Base2.Web.Test.Access;

[Collection(WebApplicationFactoryCollection.Name)]
public class OrganizationControllerTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task GetOrganization_WithValidId_ShouldReturnOrganization()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client); // Helper to add auth token
        
        // Act
        var response = await client.GetAsync("/api/access/organization/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var org = await response.Content.ReadFromJsonAsync<OrganizationDetailModel>();
        org.Should().NotBeNull();
        org!.Id.Should().Be(1);
        org.CreatedAt.Should().BeBefore(DateTime.UtcNow);
    }

    [Fact]
    public async Task GetOrganization_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Act
        var response = await client.GetAsync("/api/access/organization/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostOrganization_WithValidModel_ShouldCreateAndReturnCreated()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client);
        
        var model = new OrganizationModel { Name = "Test Org" };

        // Act
        var response = await client.PostAsJsonAsync("/api/access/organization", model);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
        
        var created = await response.Content.ReadFromJsonAsync<OrganizationModel>();
        created.Should().NotBeNull();
        created!.Id.Should().BeGreaterThan(0);
        created.Name.Should().Be("Test Org");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task PostOrganization_WithInvalidName_ShouldReturnBadRequest(string? name)
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client);
        
        var model = new OrganizationModel { Name = name! };

        // Act
        var response = await client.PostAsJsonAsync("/api/access/organization", model);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private static async Task AuthenticateClient(HttpClient client)
    {
        // Login and set bearer token
        var loginRequest = new LoginRequest 
        { 
            Email = "test@example.com", 
            Password = "Password123!" 
        };
        
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", loginRequest);
        var token = await loginResponse.Content.ReadFromJsonAsync<AccessTokenResponse>();
        
        client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token!.AccessToken);
    }
}
```

## Database Testing Patterns

### Testing Queries

```csharp
namespace Base2.Data.Test.Access;

public class OrganizationQueryTests : IDisposable
{
    private readonly AppDbContext _dbContext;
    private readonly OrganizationQuery _query;

    public OrganizationQueryTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        _dbContext = new AppDbContext(options);
        _dbContext.Database.OpenConnection();
        _dbContext.Database.EnsureCreated();

        _query = new OrganizationQuery(
            _dbContext.Organizations, 
            Mock.Of<ILogger>()
        );
    }

    [Fact]
    public async Task SingleOrDefaultAsync_WhenExists_ShouldReturnOrganization()
    {
        // Arrange
        var org = new Organization { Name = "Test Org" };
        _dbContext.Organizations.Add(org);
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _query.SingleOrDefaultAsync(org.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Name.Should().Be("Test Org");
    }

    [Fact]
    public async Task SingleOrDefaultAsync_WhenNotExists_ShouldReturnNull()
    {
        // Act
        var result = await _query.SingleOrDefaultAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task ListAsync_ShouldReturnAllOrganizations()
    {
        // Arrange
        _dbContext.Organizations.AddRange(
            new Organization { Name = "Org 1" },
            new Organization { Name = "Org 2" },
            new Organization { Name = "Org 3" }
        );
        await _dbContext.SaveChangesAsync();

        // Act
        var result = await _query.ListAsync();

        // Assert
        result.Should().HaveCount(3);
        result.Should().OnlyContain(o => o.Name.StartsWith("Org"));
    }

    public void Dispose()
    {
        _dbContext.Database.CloseConnection();
        _dbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}
```

### Testing RLS (Row-Level Security)

```csharp
namespace Base2.Data.Test;

public class RlsTests
{
    [Fact]
    [Trait("Category", "Npgsql")]
    public async Task Read_WithDifferentTenant_ShouldNotReturnData()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Npgsql.json")
            .Build();

        var services = new ServiceCollection();
        services.AddDatabases(configuration);
        services.AddTenantServices();
        
        var sp = services.BuildServiceProvider();

        // Create data as Tenant A
        await using (var scope = sp.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var guard = GetRequestGuard(scope.ServiceProvider, tenantId: 1);
            await guard.EnsureWriteAsync();

            var org = new Organization { TenantId = 1, Name = "Tenant A Org" };
            db.Organizations.Add(org);
            await db.SaveChangesAsync();
        }

        // Try to read as Tenant B
        await using (var scope = sp.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var guard = GetRequestGuard(scope.ServiceProvider, tenantId: 2);
            await guard.EnsureReadAsync();

            // Act
            var orgs = await db.Organizations.ToListAsync();

            // Assert
            orgs.Should().BeEmpty(); // RLS filters out Tenant A's data
        }
    }

    private static IRequestDbGuard GetRequestGuard(IServiceProvider sp, long tenantId)
    {
        var contextAccessor = sp.GetRequiredService<IHttpContextAccessor>();
        var httpContext = new DefaultHttpContext();
        httpContext.Items["TenantId"] = tenantId;
        contextAccessor.HttpContext = httpContext;
        
        return sp.GetRequiredService<IRequestDbGuard>();
    }
}
```

## Testing Mappers

```csharp
namespace Base2.Data.Test.Access;

public class OrganizationMapperTests
{
    [Fact]
    public void ToModel_ShouldMapAllProperties()
    {
        // Arrange
        var org = new Organization
        {
            Id = 1,
            Name = "Test Org",
            InternalId = "internal-123",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            DeletedAt = null
        };

        // Act
        var model = org.ToModel();

        // Assert
        model.Id.Should().Be(org.Id);
        model.Name.Should().Be(org.Name);
        // InternalId, DeletedAt should NOT be mapped to Model
    }

    [Fact]
    public void ToDetailModel_ShouldIncludeNavigationProperties()
    {
        // Arrange
        var org = new Organization
        {
            Id = 1,
            Name = "Test Org",
            Users = new List<User>
            {
                new() { Email = "user1@example.com" },
                new() { Email = "user2@example.com" }
            }
        };

        // Act
        var model = org.ToDetailModel();

        // Assert
        model.Id.Should().Be(org.Id);
        model.Users.Should().HaveCount(2);
        model.CreatedAt.Should().NotBe(default);
    }

    [Fact]
    public void ToRecord_ShouldCreateNewRecord()
    {
        // Arrange
        var model = new OrganizationModel
        {
            Id = 0, // Not set yet
            Name = "New Org"
        };

        // Act
        var record = model.ToRecord();

        // Assert
        record.Should().NotBeNull();
        record.Name.Should().Be("New Org");
        record.Id.Should().Be(0); // Not assigned until saved
    }

    [Fact]
    public void UpdateFrom_ShouldUpdateExistingRecord()
    {
        // Arrange
        var record = new Organization
        {
            Id = 1,
            Name = "Old Name",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };
        
        var model = new OrganizationModel
        {
            Id = 1,
            Name = "New Name"
        };

        // Act
        record.UpdateFrom(model);

        // Assert
        record.Name.Should().Be("New Name");
        record.Id.Should().Be(1); // Should not change
        record.CreatedAt.Should().BeBefore(DateTime.UtcNow); // Should not change
    }
}
```

## Testing with Traits

Use traits to categorize and filter tests:

```csharp
public class DatabaseTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void FastTest() { }

    [Fact]
    [Trait("Category", "Integration")]
    public async Task SlowerTest() { }

    [Fact]
    [Trait("Category", "Npgsql")]
    [Trait("Category", "Slow")]
    public async Task RequiresPostgres() { }
}
```

Run specific categories:

```bash
# Run only unit tests
dotnet test --filter "Category=Unit"

# Exclude slow tests
dotnet test --filter "Category!=Slow"

# Run PostgreSQL tests only
dotnet test --filter "Category=Npgsql"
```

## Custom Test Helpers

### API Client Helper

```csharp
namespace Base2.Web.Test.Helpers;

public class ApiClient(HttpClient client)
{
    private readonly HttpClient _client = client;
    private readonly JsonSerializerOptions _options = new() 
    { 
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
    };

    public async Task<T?> GetAsync<T>(string url, CancellationToken ct = default)
    {
        var response = await _client.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>(_options, ct);
    }

    public async Task<HttpResponseMessage> PostAsync<T>(
        string url, 
        T model, 
        CancellationToken ct = default)
    {
        return await _client.PostAsJsonAsync(url, model, _options, ct);
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(
        string url, 
        TRequest model, 
        CancellationToken ct = default)
    {
        var response = await PostAsync(url, model, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TResponse>(_options, ct);
    }

    public async Task<HttpResult<TSuccess, TError>> PostWithResultAsync<TRequest, TSuccess, TError>(
        string url,
        TRequest model,
        CancellationToken ct = default)
    {
        var response = await _client.PostAsJsonAsync(url, model, _options, ct);

        if (response.IsSuccessStatusCode)
        {
            var success = await response.Content.ReadFromJsonAsync<TSuccess>(_options, ct);
            return HttpResult<TSuccess, TError>.Success(success!);
        }

        var error = await response.Content.ReadFromJsonAsync<TError>(_options, ct);
        return HttpResult<TSuccess, TError>.Failure(error!);
    }
}
```

### Test Data Builders

```csharp
namespace Base2.Test.Builders;

public class OrganizationBuilder
{
    private long _id = 1;
    private string _name = "Test Organization";
    private long _tenantId = 1;
    private List<User> _users = new();

    public OrganizationBuilder WithId(long id)
    {
        _id = id;
        return this;
    }

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

    public OrganizationBuilder WithUsers(params User[] users)
    {
        _users.AddRange(users);
        return this;
    }

    public Organization Build()
    {
        return new Organization
        {
            Id = _id,
            Name = _name,
            TenantId = _tenantId,
            Users = _users,
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static OrganizationBuilder Default() => new();
}

// Usage
var org = OrganizationBuilder.Default()
    .WithName("Acme Corp")
    .WithTenantId(42)
    .Build();
```

## Async Testing Best Practices

```csharp
public class AsyncTests
{
    [Fact]
    public async Task AsyncMethod_ShouldAwaitProperly()
    {
        // ✅ Good - Properly awaited
        var result = await _service.GetDataAsync();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task MultipleAwaits_ShouldCompleteInOrder()
    {
        // ✅ Good - Sequential operations
        await _service.CreateAsync(model1);
        await _service.CreateAsync(model2);
        
        var all = await _service.ListAsync();
        all.Should().HaveCount(2);
    }

    [Fact]
    public async Task ParallelOperations_UseTaskWhenAll()
    {
        // ✅ Good - Parallel operations
        var task1 = _service.GetAsync(1);
        var task2 = _service.GetAsync(2);
        var task3 = _service.GetAsync(3);

        var results = await Task.WhenAll(task1, task2, task3);
        
        results.Should().HaveCount(3);
    }
}
```

## Exception Testing

```csharp
public class ExceptionTests
{
    [Fact]
    public void Method_WithInvalidInput_ShouldThrowArgumentException()
    {
        // Arrange
        var service = new OrganizationService(/* deps */);

        // Act
        var action = () => service.Create(null!);

        // Assert
        action.Should().Throw<ArgumentNullException>()
            .WithMessage("*model*");
    }

    [Fact]
    public async Task AsyncMethod_WithInvalidInput_ShouldThrowArgumentException()
    {
        // Arrange
        var service = new OrganizationService(/* deps */);

        // Act
        var action = async () => await service.CreateAsync(null!);

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>()
            .WithMessage("*model*");
    }

    [Fact]
    public async Task Service_WhenDatabaseFails_ShouldThrowDbException()
    {
        // Arrange
        _mockDbContext.Setup(db => db.SaveChangesAsync(default))
            .ThrowsAsync(new DbUpdateException());

        // Act
        var action = async () => await _service.CreateAsync(model);

        // Assert
        await action.Should().ThrowAsync<DbUpdateException>();
    }
}
```

## Best Practices

### DO ✅

- Use `async`/`await` consistently for all async operations
- Test both success and error paths
- Use descriptive test names that explain the scenario
- Isolate tests (no shared state between tests)
- Use FluentAssertions for readable assertions
- Mock external dependencies (database, HTTP, file system)
- Use test fixtures to share expensive setup (WebApplicationFactory)
- Test edge cases and boundary conditions

### DON'T ❌

- Use `Task.Wait()` or `.Result` (causes deadlocks)
- Share mutable state between tests
- Test framework internals (EF Core, ASP.NET Core)
- Commit tests with hardcoded connection strings
- Over-mock (don't mock what you own)
- Write tests that depend on execution order
- Ignore warnings or failing tests

## Related Documentation

- [Server Testing Strategy](../../overview/server/testing-strategy.md) - High-level testing approach
- [Database Testing Pattern](./database-testing-pattern.md) - In-memory database testing with Data.Mock
- [Testing Conventions](../../conventions/testing-conventions.md) - Naming and organization standards
- [Server Architecture Patterns](./server-architecture-patterns.md) - Overall architecture
- [Server Component Template](./server-component-template.md) - Component structure

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
