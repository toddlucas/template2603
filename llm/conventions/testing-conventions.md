# Testing Conventions

## Overview

This document defines the team standards for writing tests across the Product Name codebase (both client and server). Follow these conventions to ensure consistency and maintainability across TypeScript/React and C#/.NET projects.

---

# Client Testing Conventions (TypeScript/React)

This section covers testing conventions for the React/TypeScript client applications.

## File Naming

### Test Files

| Test Type | Extension | Location | Example |
|-----------|-----------|----------|---------|
| Unit Test | `.test.ts` | Colocated with source | `authService.test.ts` |
| Component Test | `.test.tsx` | Colocated with component | `Button.test.tsx` |
| Integration Test | `.test.ts` | In `tests/` directory | `contact-workflow.test.ts` |
| E2E Test | `.spec.ts` | In `e2e/tests/` directory | `login.spec.ts` |

### Test Utilities

| File Type | Naming | Example |
|-----------|--------|---------|
| Test setup | `setup.ts` | `src/testing/setup.ts` |
| Test helpers | `*-helpers.ts` | `render-helpers.tsx` |
| Mock handlers | `handlers.ts` | `mocks/handlers.ts` |
| Test builders | `*Builder.ts` | `contactBuilder.ts` |
| Test fixtures | `*.json` | `fixtures/test-data.json` |

## Directory Structure

### Required Directories

```
src/client/
├── common/src/
│   ├── testing/              # Test utilities (required)
│   │   ├── setup.ts
│   │   ├── utils/
│   │   └── mocks/
│   └── tests/                # Integration tests (optional)
│
├── web/src/
│   ├── testing/              # App-specific utilities
│   └── tests/                # App-level integration tests
│
└── e2e/                      # E2E tests (required)
    ├── tests/
    ├── fixtures/
    └── playwright.config.ts
```

**Key Rules**:
- Use `testing/` for test utilities and setup
- Use `tests/` for integration tests
- Colocate unit and component tests with source files
- Keep E2E tests in separate `e2e/` directory

## Test Structure

### Describe Blocks

Use `describe` to group related tests:

```typescript
describe('ComponentName', () => {
  describe('specificFeature', () => {
    it('should do something specific', () => {
      // test
    });
  });
});
```

**Naming**:
- Top-level `describe`: Component or function name
- Nested `describe`: Feature or method name
- Use camelCase for nested describes

### Test Cases

Use `it` for individual test cases:

```typescript
it('should return formatted phone number for valid input', () => {
  // test
});
```

**Naming**:
- Start with "should"
- Be specific about the scenario
- Include expected outcome
- Use plain English, not code terms

**Good Examples**:
- ✅ `it('should disable submit button while loading', () => {})`
- ✅ `it('should show validation error for invalid email', () => {})`
- ✅ `it('should call onSubmit with form data', () => {})`

**Bad Examples**:
- ❌ `it('works', () => {})` - Too vague
- ❌ `it('button click', () => {})` - Missing expectation
- ❌ `it('tests the handleClick function', () => {})` - Implementation detail

### Test Organization (AAA Pattern)

Structure tests with Arrange-Act-Assert:

```typescript
it('should create contact successfully', async () => {
  // Arrange - Set up test data and mocks
  const user = userEvent.setup();
  const mockContact = { email: 'test@example.com' };
  
  // Act - Perform the action
  render(<ContactForm />);
  await user.type(screen.getByLabelText(/email/i), mockContact.email);
  await user.click(screen.getByRole('button', { name: /save/i }));
  
  // Assert - Verify the outcome
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

Add comments for clarity in complex tests, but prefer self-documenting code.

## Query Selectors

### Priority Order

Always prefer accessible queries:

1. **getByRole** (highest priority)
   ```typescript
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /email/i })
   ```

2. **getByLabelText**
   ```typescript
   screen.getByLabelText(/email address/i)
   ```

3. **getByPlaceholderText**
   ```typescript
   screen.getByPlaceholderText(/enter your email/i)
   ```

4. **getByText**
   ```typescript
   screen.getByText(/contact created/i)
   ```

5. **getByTestId** (last resort only)
   ```typescript
   screen.getByTestId('custom-widget')
   ```

### Case Insensitive Matching

Use regex with `i` flag for text matching:

```typescript
// ✅ Good - Case insensitive
screen.getByRole('button', { name: /submit/i })

// ❌ Bad - Case sensitive
screen.getByRole('button', { name: 'Submit' })
```

### Partial Text Matching

Use regex for partial matches:

```typescript
// ✅ Good - Flexible
screen.getByText(/contact created/i)

// ❌ Bad - Brittle
screen.getByText('Contact "John Doe" was successfully created.')
```

## Assertions

### Expect Statements

Use descriptive matchers:

```typescript
// ✅ Good - Clear intent
expect(button).toBeDisabled()
expect(input).toHaveValue('test@example.com')
expect(element).toBeInTheDocument()

// ❌ Bad - Unclear
expect(button.disabled).toBe(true)
expect(input.value).toEqual('test@example.com')
```

### Async Assertions

Use `waitFor` for async updates:

```typescript
// ✅ Good
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ❌ Bad - May fail due to timing
expect(screen.getByText(/success/i)).toBeInTheDocument();
```

### Custom Matchers

Prefer `@testing-library/jest-dom` matchers:

```typescript
// ✅ Good
expect(element).toBeVisible()
expect(element).toHaveClass('active')
expect(input).toBeRequired()

// ❌ Bad
expect(element.style.display).not.toBe('none')
expect(element.className).toContain('active')
expect(input.required).toBe(true)
```

## Mocking

### Services and Dependencies

```typescript
// ✅ Good - Mock at module level
vi.mock('@/services/contactService', () => ({
  ContactService: {
    getContacts: vi.fn().mockResolvedValue([]),
  }
}));

// ❌ Bad - Mocking implementation details
vi.spyOn(React, 'useState')
```

### API Calls

Use MSW for API mocking:

```typescript
// ✅ Good - Declarative API mocks
import { http, HttpResponse } from 'msw';
import { server } from '@/testing/mocks/server';

server.use(
  http.get('/api/contacts', () => {
    return HttpResponse.json({ data: [] });
  })
);

// ❌ Bad - Mocking fetch directly
global.fetch = vi.fn().mockResolvedValue(...)
```

### Mock Data

Use test data builders:

```typescript
// ✅ Good - Reusable builder
const contact = new ContactBuilder()
  .withEmail('test@example.com')
  .build();

// ❌ Bad - Inline objects everywhere
const contact = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'active',
  // ... 20 more fields
};
```

## Setup and Teardown

### beforeEach / afterEach

Use for common setup:

```typescript
describe('ContactService', () => {
  let service: ContactService;
  let mockApi: ApiClient;

  beforeEach(() => {
    mockApi = createMockApiClient();
    service = new ContactService(mockApi);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch contacts', async () => {
    // Service is already set up
  });
});
```

### Global Setup

Keep in `testing/setup.ts`:

```typescript
// src/testing/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';
import '@testing-library/jest-dom/vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

## User Interactions

### Use userEvent, Not fireEvent

```typescript
import userEvent from '@testing-library/user-event';

// ✅ Good - Realistic user interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// ❌ Bad - Low-level events
fireEvent.click(button);
fireEvent.change(input, { target: { value: 'text' } });
```

### Async Interactions

Always await user interactions:

```typescript
// ✅ Good
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'test');

// ❌ Bad - Race conditions
const user = userEvent.setup();
user.click(button); // Missing await
user.type(input, 'test'); // Missing await
```

## Test Data

### Keep It Minimal

Only include relevant data:

```typescript
// ✅ Good - Minimal test data
const contact = { id: '1', email: 'test@example.com' };

// ❌ Bad - Unnecessary fields
const contact = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-1234',
  address: '123 Main St',
  // ... fields not used in test
};
```

### Use Meaningful Values

```typescript
// ✅ Good - Clear test intent
const validEmail = 'test@example.com';
const invalidEmail = 'not-an-email';

// ❌ Bad - Unclear meaning
const email1 = 'a@b.com';
const email2 = 'xyz';
```

## E2E Test Conventions

### File Organization

```
e2e/tests/
├── auth/
│   ├── login.spec.ts
│   └── logout.spec.ts
├── contacts/
│   └── contact-crud.spec.ts
└── sequences/
    └── sequence-builder.spec.ts
```

### Page Objects

Use page objects for reusability:

```typescript
// e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button:has-text("Sign In")');
  }
}

// e2e/tests/auth/login.spec.ts
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('test@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

## Comments in Tests

### When to Comment

Add comments for:
- Non-obvious setup or mocking
- Complex test scenarios
- Temporary workarounds
- Disabled tests (with ticket reference)

```typescript
// ✅ Good - Explains why
it.skip('should handle large datasets', () => {
  // TODO: Re-enable when pagination is implemented (REACH-123)
});

// Override default handler to simulate error
server.use(
  http.get('/api/contacts', () => {
    return HttpResponse.json({ error: 'Server error' }, { status: 500 });
  })
);
```

### When NOT to Comment

Skip comments for:
- Self-explanatory test names
- Standard AAA pattern
- Obvious assertions

```typescript
// ❌ Bad - Unnecessary comments
it('should click button', () => {
  // Render component
  render(<Button>Click me</Button>);
  
  // Click the button
  fireEvent.click(screen.getByRole('button'));
  
  // Assert button was clicked
  expect(onClick).toHaveBeenCalled();
});
```

## Skipping and Focusing Tests

### Skip Tests with Reason

```typescript
// ✅ Good
it.skip('should handle edge case', () => {
  // TODO: Implement after API update (REACH-456)
});

// ❌ Bad
it.skip('something', () => {});
```

### Never Commit Focused Tests

```typescript
// ❌ Bad - Don't commit this
it.only('should test one thing', () => {});

// Use .only during development, remove before commit
```

## Test Coverage

### Don't Test Implementation

```typescript
// ✅ Good - Test behavior
it('should show success message after submit', async () => {
  render(<ContactForm />);
  await submitForm();
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ❌ Bad - Test implementation
it('should call setState with success', async () => {
  const { result } = renderHook(() => useState(false));
  expect(result.current[0]).toBe(false);
});
```

### Test Error States

Every feature test should include:
- ✅ Happy path (success case)
- ✅ Validation errors
- ✅ API errors
- ✅ Loading states

---

# Server Testing Conventions (C#/.NET)

This section covers testing conventions for the .NET/C# server applications.

## File Naming

### Test Projects and Files

| Test Type | Naming Convention | Location | Example |
|-----------|------------------|----------|---------|
| Test Project | `{Project}.Test.csproj` | `{Project}/test/` | `Base2.Web.Test.csproj` |
| Test Class | `{ClassName}Tests` | Feature-organized | `OrganizationServiceTests.cs` |
| Test Method | `{Method}_{Scenario}_Should{Expected}` | In test class | `Create_WithValidModel_ShouldReturnCreated` |

### Test Utilities

| File Type | Naming | Example |
|-----------|--------|---------|
| Global usings | `GlobalUsings.cs` | `Properties/GlobalUsings.cs` |
| Test fixtures | `{Name}Fixture.cs` | `WebApplicationFactoryFixture.cs` |
| Test helpers | `{Name}.cs` | `ApiClient.cs` |
| Test builders | `{Name}Builder.cs` | `OrganizationBuilder.cs` |

## Directory Structure

### Required Structure

```
main/src/server/
├── {Project}/
│   ├── src/                        # Application code
│   │   └── Controllers/
│   └── test/                       # Tests alongside src
│       ├── Properties/
│       │   └── GlobalUsings.cs     # Global imports
│       ├── Helpers/
│       │   └── WebApplicationFactoryFixture.cs
│       ├── {Feature}/
│       │   └── {Feature}Tests.cs   # Feature-organized tests
│       └── {Project}.Test.csproj
```

**Key Rules**:
- Test projects in `test/` folder alongside `src/`
- Organize tests by feature area (Auth, Access, Identity)
- Use `Helpers/` for reusable test utilities
- Global usings in `Properties/GlobalUsings.cs`

## Test Structure

### Test Class Organization

```csharp
namespace Base2.Services.Test.Access;

public class OrganizationServiceTests
{
    // Setup with constructor
    public OrganizationServiceTests()
    {
        // Initialize mocks and dependencies
    }

    [Fact]
    public async Task Create_WithValidModel_ShouldReturnCreated()
    {
        // Arrange
        
        // Act
        
        // Assert
    }
}
```

### Test Method Naming

Pattern: `{Method}_{Scenario}_Should{Expected}`

**Good Examples**:
- ✅ `Create_WithValidModel_ShouldReturnCreated`
- ✅ `GetById_WhenNotFound_ShouldReturnNull`
- ✅ `Delete_WithInvalidId_ShouldReturnFalse`
- ✅ `List_WithPagination_ShouldReturnPagedResult`

**Bad Examples**:
- ❌ `TestCreate` - Too vague
- ❌ `CreateOrganization` - Missing scenario and expectation
- ❌ `Test1` - Meaningless name
- ❌ `CreateShouldWork` - Not specific enough

### Arrange-Act-Assert Pattern

Always use AAA pattern with clear sections:

```csharp
[Fact]
public async Task Create_WithValidModel_ShouldSetTimestamps()
{
    // Arrange
    var service = new OrganizationService(_mockDbContext.Object, _mockLogger.Object);
    var model = new OrganizationModel { Name = "Test Org" };
    var beforeCreate = DateTime.UtcNow;

    // Act
    var result = await service.CreateAsync(model);

    // Assert
    result.Should().NotBeNull();
    result.CreatedAt.Should().BeOnOrAfter(beforeCreate);
    result.UpdatedAt.Should().BeOnOrAfter(beforeCreate);
}
```

## Assertions

### FluentAssertions Style

Use FluentAssertions (via AwesomeAssertions) for all assertions:

```csharp
// ✅ Good - FluentAssertions
result.Should().NotBeNull();
result.Name.Should().Be("Test Org");
result.Id.Should().BeGreaterThan(0);
result.Users.Should().HaveCount(3);
result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));

// ❌ Bad - xUnit assertions
Assert.NotNull(result);
Assert.Equal("Test Org", result.Name);
Assert.True(result.Id > 0);
```

### Common Assertions

```csharp
// Nullability
result.Should().NotBeNull();
result.Should().BeNull();

// Equality
value.Should().Be(expected);
value.Should().NotBe(unexpected);

// Numeric comparisons
count.Should().BeGreaterThan(0);
count.Should().BeLessThanOrEqualTo(10);
count.Should().BeInRange(1, 100);

// Collections
list.Should().HaveCount(5);
list.Should().BeEmpty();
list.Should().NotBeEmpty();
list.Should().Contain(item);
list.Should().OnlyContain(x => x.IsActive);

// Strings
text.Should().StartWith("Hello");
text.Should().EndWith("World");
text.Should().Contain("middle");
text.Should().Match("pattern*");

// DateTime
timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
timestamp.Should().BeBefore(DateTime.UtcNow);
timestamp.Should().BeAfter(startTime);

// Exceptions
action.Should().Throw<ArgumentNullException>();
action.Should().ThrowAsync<InvalidOperationException>();
action.Should().NotThrow();

// Types
obj.Should().BeOfType<Organization>();
obj.Should().BeAssignableTo<IEntity>();
```

## Test Categorization with Traits

Use `[Trait]` attribute to categorize tests:

```csharp
[Fact]
[Trait("Category", "Unit")]
public void FastUnitTest() { }

[Fact]
[Trait("Category", "Integration")]
public async Task IntegrationTest() { }

[Fact]
[Trait("Category", "Npgsql")]
[Trait("Category", "Slow")]
public async Task PostgresSpecificTest() { }
```

### Standard Trait Categories

| Category | Purpose | Example |
|----------|---------|---------|
| `Unit` | Fast unit tests | Service method tests |
| `Integration` | WebApplicationFactory tests | Controller tests |
| `Npgsql` | PostgreSQL-specific | RLS policy tests |
| `Slow` | Long-running tests | Performance tests |

Run tests by category:

```bash
# Run only unit tests
dotnet test --filter "Category=Unit"

# Skip slow tests
dotnet test --filter "Category!=Slow"

# Run PostgreSQL tests
dotnet test --filter "Category=Npgsql"
```

## Test Data and Fixtures

### Collection Fixtures

Use for sharing expensive setup (like WebApplicationFactory):

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
}
```

### Test Data Builders

Use builder pattern for complex test data:

```csharp
public class OrganizationBuilder
{
    private long _id = 1;
    private string _name = "Test Organization";

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

    public Organization Build() => new()
    {
        Id = _id,
        Name = _name,
        CreatedAt = DateTime.UtcNow
    };
}

// Usage
var org = new OrganizationBuilder()
    .WithName("Acme Corp")
    .Build();
```

### Keep Test Data Minimal

```csharp
// ✅ Good - Only relevant fields
var org = new Organization { Id = 1, Name = "Test" };

// ❌ Bad - Unnecessary fields
var org = new Organization
{
    Id = 1,
    Name = "Test",
    InternalId = "abc-123",
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow,
    // ... many more fields not used in test
};
```

## Mocking

### When to Mock

Mock external dependencies:
- ✅ Database context (for service tests)
- ✅ HTTP clients
- ✅ Third-party services
- ✅ File system
- ✅ ILogger

Don't mock internal code:
- ❌ Your own utilities
- ❌ DTOs/Models
- ❌ Mappers (test directly)
- ❌ Query classes (use in-memory database)

### Mock Setup

```csharp
// Setup return value
_mockService.Setup(s => s.GetAsync(1))
    .ReturnsAsync(expectedResult);

// Setup with parameters
_mockService.Setup(s => s.Create(It.IsAny<OrganizationModel>()))
    .ReturnsAsync((OrganizationModel m) => new Organization { Name = m.Name });

// Setup exception
_mockDbContext.Setup(db => db.SaveChangesAsync(default))
    .ThrowsAsync(new DbUpdateException());

// Verify calls
_mockService.Verify(s => s.Create(It.IsAny<OrganizationModel>()), Times.Once);
_mockLogger.VerifyLog(LogLevel.Information, "Created organization", Times.Once());
```

## Async Testing

### Async Test Methods

Always use `async Task` for async tests:

```csharp
// ✅ Good - Async method
[Fact]
public async Task GetAsync_ShouldReturnResult()
{
    var result = await _service.GetAsync(1);
    result.Should().NotBeNull();
}

// ❌ Bad - Missing async
[Fact]
public void GetAsync_ShouldReturnResult()
{
    var result = _service.GetAsync(1).Result; // NEVER use .Result
}
```

### Testing Exceptions

```csharp
// Synchronous exception
[Fact]
public void Method_WithInvalidInput_ShouldThrow()
{
    var action = () => service.Create(null!);
    action.Should().Throw<ArgumentNullException>();
}

// Asynchronous exception
[Fact]
public async Task MethodAsync_WithInvalidInput_ShouldThrow()
{
    var action = async () => await service.CreateAsync(null!);
    await action.Should().ThrowAsync<ArgumentNullException>();
}
```

## Test Organization Best Practices

### One Assert Per Test (Guideline)

Prefer focused tests, but multiple related assertions are acceptable:

```csharp
// ✅ Good - Related assertions
[Fact]
public async Task Create_ShouldSetTimestampsAndId()
{
    var result = await _service.CreateAsync(model);
    
    result.Id.Should().BeGreaterThan(0);
    result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    result.UpdatedAt.Should().Be(result.CreatedAt);
}

// ❌ Bad - Unrelated assertions
[Fact]
public async Task Service_ShouldDoEverything()
{
    // Testing too many things
}
```

### Test Independence

Each test must be completely independent:

```csharp
// ✅ Good - Fresh setup per test
public OrganizationServiceTests()
{
    _mockDbContext = new Mock<AppDbContext>();
    _service = new OrganizationService(_mockDbContext.Object);
}

// ❌ Bad - Shared state
private static Organization _sharedOrg; // Tests can affect each other!
```

### Dispose Pattern

Implement `IDisposable` when using database connections:

```csharp
public class QueryTests : IDisposable
{
    private readonly AppDbContext _dbContext;

    public QueryTests()
    {
        // Setup
    }

    public void Dispose()
    {
        _dbContext.Database.CloseConnection();
        _dbContext.Dispose();
        GC.SuppressFinalize(this);
    }
}
```

## Comments in Tests

### When to Comment

Add comments for:
- Complex setup or mocking
- Non-obvious test scenarios
- Temporarily disabled tests

```csharp
[Fact(Skip = "Disabled pending API update - REACH-123")]
public async Task FutureFeature_ShouldWork() { }

// Simulate database timeout
_mockDbContext.Setup(db => db.SaveChangesAsync(default))
    .ThrowsAsync(new TimeoutException());
```

### When NOT to Comment

Skip comments for:
- Self-explanatory AAA sections
- Standard mocking patterns
- Obvious assertions

## Related Documentation

### Client Testing

- [Client Testing Strategy](../overview/client/testing-strategy.md) - Client testing approach
- [Client Testing Patterns](../patterns/client/testing-patterns.md) - Technical patterns

### Server Testing

- [Server Testing Strategy](../overview/server/testing-strategy.md) - Server testing approach
- [Server Testing Patterns](../patterns/server/testing-patterns.md) - Technical patterns

### General

- [Server Overview](../overview/server/server-overview.md) - Architecture
- [Client Overview](../overview/client/client-overview.md) - Architecture

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
