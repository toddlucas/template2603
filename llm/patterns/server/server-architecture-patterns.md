# Server Architecture Patterns

## Overview

This document outlines the architectural patterns and design principles used in the Lexy server components. These patterns ensure consistency, maintainability, and scalability across all server-side features.

## Core Architecture

### Layered Architecture

The server follows a classic 3-tier architecture with clear separation of concerns:

```
┌─────────────────┐
│   Web Layer     │  Controllers, API endpoints, HTTP concerns
├─────────────────┤
│ Services Layer  │  Business logic, orchestration, validation
├─────────────────┤
│   Data Layer    │  Entities, queries, database operations
├─────────────────┤
│ Contracts Layer │  Models, DTOs, shared interfaces
└─────────────────┘
```

### Layer Responsibilities

#### **Contracts Layer** (`Lexy.Contracts`)
- **Purpose**: Define data transfer objects and shared contracts
- **Contains**: Models, DTOs, interfaces, enums
- **Dependencies**: None (pure data structures)
- **Examples**: `AuthorModel`, `BookModel`, `AuthorDetailModel`

#### **Data Layer** (`Lexy.Data`)
- **Purpose**: Database entities, queries, and data access logic
- **Contains**: EF Core entities, query classes, mappers, DbContext
- **Dependencies**: Contracts, EF Core
- **Examples**: `Author`, `Book`, `AuthorQuery`, `AuthorMapper`

#### **Services Layer** (`Lexy.Services`)
- **Purpose**: Business logic, orchestration, and domain operations
- **Contains**: Service classes, business rules, validation
- **Dependencies**: Data, Contracts
- **Examples**: `AuthorService`, `BookService`

#### **Web Layer** (`Lexy.Web`)
- **Purpose**: HTTP endpoints, request/response handling, authentication
- **Contains**: Controllers, middleware, configuration
- **Dependencies**: Services, Contracts
- **Examples**: `AuthorController`, `BookController`

## Design Patterns

### 1. Repository Pattern (via Query Classes)

Instead of traditional repositories, we use **Query classes** that encapsulate common database operations:

```csharp
public record AuthorQuery(DbSet<Record> DbSet, ILogger logger)
{
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    public Task<Record[]> ListAsync(CancellationToken cancellationToken = default)
}
```

**Benefits**:
- Encapsulates complex queries
- Provides consistent query patterns
- Separates read operations from write operations
- Easy to test and mock

### 2. Mapper Pattern

We use **Mapperly** for compile-time mapping between entities and models:

```csharp
[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class AuthorMapper
{
    public static partial Model ToModel(this Record source);
    public static partial DetailModel ToDetailModel(this Record source);
    public static partial Record ToRecord(this Model source);
    public static void UpdateFrom(this Record record, Model model);
}
```

**Temporal Field Mapping Rules**:
- **Basic Models**: Always ignore temporal fields (`CreatedAt`, `UpdatedAt`, `DeletedAt`) - they're not exposed via API
- **Detail Models**: Map temporal fields from source, but ignore `DeletedAt` (internal-only)
- **Detail Models**: Only ignore related entity collections on target, not temporal fields
- **Entities**: Always ignore temporal fields when mapping from models (they're set by services)

**Navigation Property Mapping Rules**:
- **Basic Models**: Always ignore navigation properties - use `[MapperIgnoreSource]`
- **Detail Models**: Include navigation properties - do NOT use `[MapperIgnoreTarget]`
- **Entities**: Always ignore navigation properties when mapping from models - use `[MapperIgnoreTarget]`
- **Related Entities**: Use base models in DetailModels to prevent circular references

> **See**: `doc/patterns/server/mapper-patterns.md` for comprehensive mapper guidance

**Benefits**:
- Compile-time safety
- High performance
- Explicit control over mapping behavior
- Clear separation between entity and model concerns

### 3. Service Pattern

Services encapsulate business logic and orchestrate data operations:

```csharp
public class AuthorService(LexyDbContext dbContext, ILogger<AuthorService> logger)
{
    public async Task<AuthorModel?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken)
    public async Task<AuthorDetailModel?> ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken)
    public async Task<AuthorModel[]> ListAsync(CancellationToken cancellationToken)
    public async Task<Model> CreateAsync(Model model)
    public async Task<Model?> UpdateAsync(Model model)
    public async Task<bool> DeleteAsync(long id)
}
```

**Benefits**:
- Centralized business logic
- Consistent operation patterns
- Easy to test and mock
- Clear transaction boundaries

### 4. Controller Pattern

Controllers handle HTTP concerns and delegate to services:

```csharp
[Route("api/[area]/[controller]")]
[Area(nameof(Example))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class AuthorController(ILogger<AuthorController> logger, AuthorService authorService) : ControllerBase
```

**Benefits**:
- Thin controllers focused on HTTP concerns
- Consistent routing and authorization
- Standardized response patterns
- Clear API documentation

## Code Style

For detailed code style conventions (using statement organization, primary constructors, namespace organization), see the [Server Feature Template](./server-feature-template.md#code-style-conventions).

---

## Naming Conventions

### Type Aliases
Use type aliases at the top of files for clarity:

```csharp
using Record = Author;        // Database entity
using Model = AuthorModel;    // Basic DTO
using DetailModel = AuthorDetailModel; // Detailed DTO with relations
```

### Entity Naming
- **Entities**: `Author`, `Book` (singular, PascalCase)
- **Models**: `AuthorModel`, `BookModel` (entity name + "Model")
- **Detail Models**: `AuthorDetailModel`, `BookDetailModel` (entity name + "DetailModel")
- **Services**: `AuthorService`, `BookService` (entity name + "Service")
- **Controllers**: `AuthorController`, `BookController` (entity name + "Controller")
- **Queries**: `AuthorQuery`, `BookQuery` (entity name + "Query")
- **Mappers**: `AuthorMapper`, `BookMapper` (entity name + "Mapper")

### Database Naming
- **Tables**: `author`, `book` (singular, snake_case)
- **Columns**: `id`, `author_id`, `created_at` (snake_case)
- **Properties**: `Id`, `AuthorId`, `CreatedAt` (PascalCase)

## Standard Operations

### CRUD Operations
Every service should implement these standard operations:

1. **Read**: `ReadOrDefaultAsync(long id, CancellationToken cancellationToken)`
2. **Read Detail**: `ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken)`
3. **List**: `ListAsync(CancellationToken cancellationToken)`
4. **Create**: `CreateAsync(Model model)`
5. **Update**: `UpdateAsync(Model model)`
6. **Delete**: `DeleteAsync(long id)`

### Query Variations
Query classes should provide these standard methods:

1. **Single**: `SingleOrDefaultAsync` (read-only, no tracking)
2. **Track**: `TrackOrDefaultAsync` (with change tracking for updates)
3. **Detail**: `SingleDetailOrDefaultAsync` (with related entities)
4. **Track Detail**: `TrackDetailOrDefaultAsync` (with tracking and relations)
5. **List**: `ListAsync` (collection operations)

### HTTP Endpoints
Controllers should implement these standard endpoints:

1. **GET** `/{id}` - Get single entity
2. **GET** `/` - List entities
3. **POST** `/` - Create entity
4. **PUT** `/` - Update entity
5. **DELETE** `/{id}` - Delete entity

## Temporal/Audit Pattern

### ITemporal Interface
All entities should implement `ITemporal` for audit tracking:

```csharp
public interface ITemporal
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

public interface ITemporalRecord : ITemporal
{
    DateTime? DeletedAt { get; set; }
}
```

### Temporal Pattern
- **Detail Models**: Implement `ITemporal` (exposes `CreatedAt` and `UpdatedAt` to API)
- **Entities**: Implement `ITemporalRecord` (includes internal `DeletedAt` for soft deletes)
- **Basic Models**: Do not implement temporal interfaces (no audit fields in API)

### Automatic Timestamp Management
Services automatically manage timestamps:

```csharp
// Create
record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

// Update
record.UpdatedAt = DateTime.UtcNow;

// Soft Delete (if implemented)
record.DeletedAt = DateTime.UtcNow;
```

**Note**: `DeletedAt` is internal-only and never exposed via the API.

## Relationship Patterns

### One-to-Many Relationships
```csharp
// Parent entity (Author)
public ICollection<Book> Books { get; set; } = new List<Book>();

// Child entity (Book)
public long AuthorId { get; set; }
public Author Author { get; set; } = null!;

// EF Configuration
modelBuilder.Entity<Book>()
    .HasOne(x => x.Author)
    .WithMany(y => y.Books)
    .HasForeignKey(x => x.AuthorId)
    .IsRequired();
```

### Model Separation
- **Basic Model**: Contains only direct properties (no relations)
- **Detail Model**: Includes related entities for detailed views

## Error Handling Patterns

### Service Layer
- Return `null` for not found scenarios
- Return `false` for failed operations
- Throw exceptions for unexpected errors

### Controller Layer
- `NotFound()` for null service results
- `BadRequest()` for invalid input
- `NoContent()` for successful deletes
- `Ok(result)` for successful operations

## Security Patterns

### Authorization
- Use area-based policies: `[Authorize(Policy = AppPolicy.RequireUserRole)]`
- Apply at controller level for consistent protection
- Use specific policies for different access levels

### Input Validation
- Validate IDs: `if (id <= 0) return BadRequest();`
- Validate models: `if (model is null) return BadRequest();`
- Use data annotations on models for automatic validation

## Performance Considerations

### Query Optimization
- Use `AsTracking()` only when needed for updates
- Separate read and write operations
- Use `Include()` judiciously for detail operations
- Consider pagination for large datasets

### Mapping Performance
- Use Mapperly for compile-time mapping (faster than AutoMapper)
- Avoid deep cloning unless necessary
- Use explicit ignore attributes to control mapping behavior

## Testing Patterns

### Service Testing
- Mock `DbContext` and `ILogger`
- Test each CRUD operation independently
- Verify mapping behavior
- Test error scenarios

### Controller Testing
- Mock services
- Test HTTP response codes
- Verify authorization requirements
- Test input validation

## Future Considerations

### Pagination
Consider implementing pagination for list operations:

```csharp
public Task<PagedResult<Model>> PageAsync(int page, int size, CancellationToken cancellationToken)
```

### Caching
Consider adding caching at the service layer for frequently accessed data.

### Event Sourcing
Consider adding domain events for complex business operations.

### Validation
Consider implementing FluentValidation for complex validation scenarios. 