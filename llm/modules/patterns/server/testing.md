# Server Testing

> **Module**: Patterns / Server  
> **Domain**: Testing  
> **Token target**: 400-500

## Purpose

Defines testing patterns for server-side code: services, controllers, and data access.

## Content to Include

### Service Testing

> **Note:** Create tests in `Base2.Tests` project under matching namespace folder.

```csharp
// File: Tests/src/{Namespace}/{Entity}ServiceTests.cs
public class {Entity}ServiceTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;
    private readonly {Entity}Service _service;

    public {Entity}ServiceTests(TestFixture fixture)
    {
        _fixture = fixture;
        _service = new {Entity}Service(
            fixture.Logger<{Entity}Service>(),
            fixture.DbContext);
    }

    [Fact]
    public async Task CreateAsync_ValidModel_ReturnsCreatedEntity()
    {
        // Arrange
        var model = new {Entity}Model { Name = "Test" };
        var userId = Guid.NewGuid();
        var tenantId = _fixture.TenantId;
        var groupId = _fixture.GroupId;

        // Act
        var result = await _service.CreateAsync(userId, tenantId, groupId, model);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Test", result.Name);
    }

    [Fact]
    public async Task ReadOrDefaultAsync_ExistingId_ReturnsEntity()
    {
        // Arrange - create entity first
        var created = await CreateTestEntityAsync();

        // Act
        var result = await _service.ReadOrDefaultAsync(created.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(created.Id, result.Id);
    }

    [Fact]
    public async Task ReadOrDefaultAsync_NonExistingId_ReturnsNull()
    {
        // Act
        var result = await _service.ReadOrDefaultAsync(999999);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_ExistingEntity_ReturnsUpdatedEntity()
    {
        // Arrange
        var created = await CreateTestEntityAsync();
        created.Name = "Updated";

        // Act
        var result = await _service.UpdateAsync(created);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Updated", result.Name);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_ReturnsTrue()
    {
        // Arrange
        var created = await CreateTestEntityAsync();

        // Act
        var result = await _service.DeleteAsync(created.Id);

        // Assert
        Assert.True(result);
        Assert.Null(await _service.ReadOrDefaultAsync(created.Id));
    }

    private async Task<{Entity}Model> CreateTestEntityAsync()
    {
        var model = new {Entity}Model { Name = $"Test_{Guid.NewGuid()}" };
        return await _service.CreateAsync(
            Guid.NewGuid(), 
            _fixture.TenantId, 
            _fixture.GroupId, 
            model);
    }
}
```

### Test Patterns Summary

| Test Type | What to Test | Pattern |
|-----------|--------------|---------|
| Create | Valid input returns entity with ID | Arrange model → Act create → Assert ID > 0 |
| Read | Existing ID returns entity | Create first → Read by ID → Assert match |
| Read | Non-existing ID returns null | Read fake ID → Assert null |
| Update | Changes persist | Create → Modify → Update → Assert changes |
| Delete | Entity removed | Create → Delete → Assert gone |
| Validation | Invalid input rejected | Arrange invalid → Act → Assert exception/error |

### Database Testing with Mock Data

```csharp
// Use Data.Mock for seeded test data
public class {Entity}ServiceTests : IClassFixture<MockDataFixture>
{
    private readonly MockDataFixture _fixture;

    public {Entity}ServiceTests(MockDataFixture fixture)
    {
        _fixture = fixture;
        // MockDataFixture provides pre-seeded tenant, users, and sample data
    }

    [Fact]
    public async Task GetPagedAsync_ReturnsSeededData()
    {
        // Arrange - use fixture's seeded data
        var query = new PagedQuery { Page = 1, Limit = 10 };

        // Act
        var result = await _service.GetPagedAsync(query);

        // Assert
        Assert.True(result.TotalCount > 0);
    }
}
```

### Controller Integration Testing

```csharp
// File: Tests/src/{Namespace}/{Entity}ControllerTests.cs
public class {Entity}ControllerTests : IClassFixture<WebAppFactory>
{
    private readonly HttpClient _client;

    public {Entity}ControllerTests(WebAppFactory factory)
    {
        _client = factory.CreateAuthenticatedClient();
    }

    [Fact]
    public async Task Get_ExistingId_ReturnsOk()
    {
        // Arrange - create via API first
        var created = await CreateViaApiAsync();

        // Act
        var response = await _client.GetAsync($"/api/{namespace}/{entity}/{created.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Get_NonExistingId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/{namespace}/{entity}/999999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_ValidModel_ReturnsOk()
    {
        // Arrange
        var model = new {Entity}Model { Name = "Test" };

        // Act
        var response = await _client.PostAsJsonAsync("/api/{namespace}/{entity}", model);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<{Entity}Model>();
        Assert.True(result?.Id > 0);
    }
}
```

### What to Test Checklist

- [ ] **CRUD operations** - Create, Read, Update, Delete all work
- [ ] **Not found cases** - Non-existing IDs return null/404
- [ ] **Validation** - Invalid input is rejected appropriately
- [ ] **RLS isolation** - Data is tenant-isolated (use different tenant in test)
- [ ] **Edge cases** - Empty lists, max lengths, special characters

## Backlink

- [Testing Strategy](../../../overview/server/testing-strategy.md) - Comprehensive testing approach
- [Database Testing Pattern](../../../patterns/server/database-testing-pattern.md) - Mock data setup

