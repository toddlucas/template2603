# Server Entity Workflow

Workflow for adding a new entity (Model, Entity, Query, Mapper, Service, Controller) to an existing server namespace/feature.

## Prerequisites

Before starting:
1. **Existing namespace**: Which feature area? (Access, Business, Prospecting, etc.)
2. **Database**: Same as existing feature (App or Warehouse)
3. **New entity name**: Singular, PascalCase (e.g., `Sequence`, `Step`)
4. **Service approach**: Add to existing service or create new service class?
5. **Controller approach**: Add to existing controller or create new controller class?

## Code Style Conventions

### Using Statement Organization

**Placement**: Using statements go **above** the namespace declaration. Type aliases go **after** the namespace.

Group `using` statements with blank lines between groups:
1. **System** namespaces (`System.*`)
2. **Microsoft** namespaces (`Microsoft.*`)
3. **Third-party** namespaces (e.g., `Riok.Mapperly`)
4. **Project** namespaces (`Base2.*`)

```csharp
using Microsoft.EntityFrameworkCore;

using Base2.Infrastructure;

namespace Base2.Prospecting;

using Record = Contact;
using Model = ContactModel;
```

### Namespace Organization (Vertical Slices)

**Rule**: All files for a feature use the same namespace across projects - **no intermediate layer namespaces** like `.Data` or `.Services`.

**❌ Don't**: `namespace Base2.Data.Prospecting;`  
**✅ Do**: `namespace Base2.Prospecting;`

## Decision Tree

Service/Controller Organization:

```
├─ Entity is core to feature (e.g., Sequence in Prospecting)
│  └─ Create new {Entity}Service and {Entity}Controller
│
├─ Entity is supporting/child (e.g., SequenceStep)
│  └─ Add methods to existing parent service/controller
│     OR create new service/controller (your choice)
│
└─ Unsure?
    └─ Prefer separate service/controller for clarity
```

## File Structure Overview

For a new entity `{Entity}` in existing namespace `{Namespace}`:

```
Base2.Contracts/src/{Namespace}/
├── {Entity}Model.cs              # NEW

Base2.Data/src/{Namespace}/
├── {Entity}.cs                   # NEW
├── {Entity}Query.cs              # NEW
├── {Entity}Mapper.cs             # NEW

Base2.Services/src/{Namespace}/
├── {Entity}Service.cs            # NEW (or add to existing)

Base2.Web/src/Controllers/{Namespace}/
├── {Entity}Controller.cs         # NEW (or add to existing)
```

---

## Step 1: Model Troika (Model, Entity, DbContext)

### 1.1 Model (Contracts Layer)

```csharp
// File: Contracts/src/{Namespace}/{Entity}Model.cs
public class {Entity}Model
{
    /// <summary>
    /// The entity ID.
    /// </summary>
    [Display(Name = "ID")]
    public long Id { get; set; }

    // Business properties with [Required], [StringLength], etc.
}

public class {Entity}DetailModel : {Entity}Model, ITemporal
{
    // Related entities as models
    public RelatedModel Related { get; set; } = null!;

    #region ITemporal

    /// <summary>
    /// The created timestamp.
    /// </summary>
    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The updated timestamp.
    /// </summary>
    [Display(Name = "Updated At")]
    public DateTime UpdatedAt { get; set; }

    #endregion ITemporal
}
```

**Key points:**
- Basic Model: No temporal fields, no internal fields
- Detail Model: Includes ITemporal, includes related entity models
- Use data annotations for validation
- If prefixing fields with `AI`, use Pascal `Ai` since TypeGen will yield `aI` rather than the expected `ai` when converting to camel case.

### 1.2 Entity (Data Layer)

```csharp
// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    #region Internal properties (not exposed via API)

#if RESELLER
    /// <summary>
    /// The group ID this entity belongs to (reseller mode).
    /// </summary>
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

    /// <summary>
    /// The tenant ID this entity belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// Related navigation property.
    /// </summary>
    public RelatedEntity Related { get; set; } = null!;

    // Add other navigation properties as needed
    // public ICollection<ChildEntity> Children { get; set; } = new List<ChildEntity>();

    #endregion Navigation properties

    #region ITemporalRecord

    /// <summary>
    /// The created timestamp.
    /// </summary>
    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The updated timestamp.
    /// </summary>
    [Display(Name = "Updated At")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// The deleted timestamp (soft delete).
    /// </summary>
    [Display(Name = "Deleted At")]
    public DateTime? DeletedAt { get; set; }

    #endregion ITemporalRecord
}
```

**Key points:**
- Inherits from Model
- Adds TenantId (required for RLS), and GroupId (with RESELLER guard)
- Adds navigation properties
- Implements ITemporalRecord (includes DeletedAt)

### 1.3 Entity Configuration (Colocated OnModelCreating)

Add a static `OnModelCreating` method directly in the entity class to configure EF Core mappings:

```csharp
using Record = {Entity};

// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    #region Internal properties
    
    // ... TenantId, GroupId, temporal properties ...
    
    #endregion
    
    #region Navigation properties
    
    // ... navigation properties ...
    
    #endregion
    
    /// <summary>
    /// Configures the entity mappings for Entity Framework Core.
    /// </summary>
    /// <param name="modelBuilder">The model builder.</param>
    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Table configuration
        modelBuilder.Entity<Record>().ToTable("{entity}");  // snake_case table name
        
        // Primary key
        modelBuilder.Entity<Record>().HasKey(e => e.Id);
        
        // Column mappings (snake_case)
        modelBuilder.Entity<Record>().Property(e => e.Id).HasColumnName("id");
        
#if RESELLER
        modelBuilder.Entity<Record>().Property(e => e.GroupId).HasColumnName("group_id").IsRequired();
#endif
        modelBuilder.Entity<Record>().Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
        modelBuilder.Entity<Record>().Property(e => e.OwnerId).HasColumnName("owner_id");
        modelBuilder.Entity<Record>().Property(e => e.CreatedBy).HasColumnName("created_by");
        modelBuilder.Entity<Record>().Property(e => e.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<Record>().Property(e => e.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<Record>().Property(e => e.DeletedAt).HasColumnName("deleted_at");
        
        // Business property mappings
        modelBuilder.Entity<Record>().Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        
        // Relationships
        modelBuilder.Entity<Record>()
            .HasOne(e => e.Related)
            .WithMany()
            .HasForeignKey(e => e.RelatedId)
            .IsRequired();

        // Global query filter for soft delete
        modelBuilder.Entity<Record>()
            .HasQueryFilter(e => e.DeletedAt == null);
    }
}
```

### 1.4 DbContext Registration

Register the entity in the DbContext:

```csharp
// File: Data/src/{DbContext}.cs

// 1. Add DbSet property
public DbSet<{Entity}> {Entities} { get; set; } = null!;

// 2. In OnModelCreating, call the entity's static configuration method
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing entity configurations ...
    
    // {Namespace} entities
    {Entity}.OnModelCreating(modelBuilder);
    
    // ... rest of configuration ...
}
```

**Key Points:**
- ✅ Configuration is **colocated** with the entity class (not in DbContext)
- ✅ DbContext **calls** the entity's static `OnModelCreating` method
- ✅ DbSet property uses PascalCase plural (`{Entities}`)
- ✅ Table name uses snake_case singular (`{entity}`)
- ✅ Column names use snake_case
- ✅ Include `#if RESELLER` guard for GroupId

**Benefits of Colocation:**
- Entity configuration lives next to the entity definition
- Easier to maintain and update
- Clear separation of concerns
- Follows the codebase pattern

---

With the data model in place, create the query class to encapsulate data access.

## Step 2: Query Class

> **Note:** Generate XML doc comments (`/// <summary>`) for all public methods.

```csharp
using Record = {Entity};

// File: Data/src/{Namespace}/{Entity}Query.cs
public record {Entity}Query(DbSet<{Entity}> DbSet, ILogger logger)
{
    /// <summary>
    /// Gets a single entity by ID (read-only, no tracking).
    /// </summary>
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID (with change tracking for updates).
    /// </summary>
    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID with related entities (read-only).
    /// </summary>
    public Task<Record?> SingleDetailOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Include(e => e.Related).Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID with related entities (with tracking).
    /// </summary>
    public Task<Record?> TrackDetailOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Include(e => e.Related).AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets all entities.
    /// </summary>
    public Task<Record[]> ListAsync(CancellationToken ct = default) 
        => DbSet.ToArrayAsync(ct);

    /// <summary>
    /// Gets entities with simple pagination.
    /// </summary>
    /// <remarks>
    /// For full PagedQuery with search/sort, use Service.GetPagedAsync instead.
    /// </remarks>
    public Task<Record[]> GetPagedAsync(int skip, int take, CancellationToken ct = default) 
        => DbSet.OrderByDescending(e => e.CreatedAt).Skip(skip).Take(take).ToArrayAsync(ct);

    /// <summary>
    /// Finds entity by unique field (case-insensitive).
    /// </summary>
    public Task<Record?> FindByEmailAsync(string email, CancellationToken ct = default) 
        => DbSet.Where(e => e.Email.ToLower() == email.ToLower()).SingleOrDefaultAsync(ct);
}
```

**Key Patterns:**

| Method Pattern | Use Case | Returns |
|----------------|----------|---------|
| `SingleOrDefaultAsync` | Read by ID | Single or null |
| `TrackOrDefaultAsync` | Update by ID | Single with tracking |
| `SingleDetailOrDefaultAsync` | Read with includes | Single with related |
| `TrackDetailOrDefaultAsync` | Update with includes | Single with tracking + related |
| `ListAsync` | Get all | Array |
| `GetPagedAsync` | Simple pagination | Array |
| `FindBy{Field}Async` | Lookup by unique field | Single or null |

**Design Principles:**
1. **Record with primary constructor** - Immutable, concise
2. **No tenant filtering** - RLS handles isolation automatically
3. **Read vs Track separation** - Explicit about EF change tracking
4. **Simple pagination here** - Full `PagedQuery` with search/sort belongs in Service

---

Now we need mappers to convert between entity and model layers.

## Step 3: Mappers

> **Note:** Generate XML doc comments for all public methods. Use `<remarks>` to document what's excluded.

> **Note:** Always include the using aliases for `Record`, `Model`, and `DetailModel`. This keeps mappers consistent and maintainable across the codebase.

```csharp
// File: Data/src/{Namespace}/{Entity}Mapper.cs
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
    /// <summary>
    /// Maps the entity to the basic model.
    /// </summary>
    /// <remarks>
    /// Excludes: TenantId, GroupId, temporal fields, navigation properties.
    /// </remarks>
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.CreatedAt))]
    [MapperIgnoreSource(nameof(Record.UpdatedAt))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    [MapperIgnoreSource(nameof(Record.NavigationProperty))]
    public static partial Model ToModel(this Record source);

    /// <summary>
    /// Maps the entity to the detail model with related entities.
    /// </summary>
    /// <remarks>
    /// Excludes: TenantId, GroupId, DeletedAt.
    /// Includes: CreatedAt, UpdatedAt, related entities as models.
    /// </remarks>
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    public static partial DetailModel ToDetailModel(this Record source);

    // Collection mappings
    public static partial Model[] ToModels(this IEnumerable<Record> source);
    public static partial DetailModel[] ToDetailModels(this IEnumerable<Record> source);

    // Model → Entity (exclude internal + temporal + navigation)
    [MapperIgnoreTarget(nameof(Record.TenantId))]
    [MapperIgnoreTarget(nameof(Record.CreatedAt))]
    [MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    [MapperIgnoreTarget(nameof(Record.DeletedAt))]
    [MapperIgnoreTarget(nameof(Record.NavigationProperty))]
    public static partial Record ToRecord(this Model source);

    /// <summary>
    /// Updates an existing entity from a model.
    /// </summary>
    /// <remarks>
    /// Never update: Id, TenantId, GroupId, CreatedAt, DeletedAt.
    /// UpdatedAt is set by the service.
    /// </remarks>
    public static void UpdateFrom(this Record record, Model model)
    {
        record.Field1 = model.Field1;
        record.Field2 = model.Field2;
    }

    // Private mapper for related entities (delegation pattern)
    private static RelatedModel MapToRelatedModel(RelatedEntity source) 
        => RelatedMapper.ToModel(source);
}
```

**Mapping Rules Summary:**

| Direction | Ignore |
|-----------|--------|
| Entity → Model | TenantId, GroupId, Temporal, Navigation |
| Entity → DetailModel | TenantId, GroupId, DeletedAt, Enum navigations |
| Model → Entity | TenantId, GroupId, Temporal, Navigation |

---

Add service methods to orchestrate business logic.

## Step 4: Service

> **Note:** Generate XML doc comments (`/// <summary>`, `/// <param>`, `/// <returns>`) for all public methods.

> **Note:** Always include the using aliases for `Record`, `Model`, and `DetailModel`. This keeps services consistent and maintainable across the codebase.

Choose your approach:
- **New Service**: Create a new service class for this entity
- **Extend Existing**: Add methods to an existing service class

### Option A: New Service Class (Recommended for Core Entities)

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

/// <summary>
/// {Entity} service for business logic and data operations.
/// </summary>
public class {Entity}Service(
    WarehouseDbContext dbContext,
    ILogger<{Entity}Service> logger)
{
    private readonly ILogger _logger = logger;
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.{Entities};
    private readonly {Entity}Query _query = new(dbContext.{Entities}, logger);

    // Implement CRUD methods (see Step 4 in server-feature workflow for full examples)
    public async Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleOrDefaultAsync(id, cancellationToken);
        return record?.ToModel();
    }

    public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
    {
        Record record = model.ToRecord();
        record.TenantId = tenantId;
#if RESELLER
        record.GroupId = groupId;
#endif
        record.OwnerId = userId;
        record.CreatedBy = userId;
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Add(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created {Entity} {Id}.", record.Id);
        return record.ToModel();
    }

    // Add Update, Delete, GetPaged, and other methods as needed
}
```

**DI Registration:**
```csharp
// File: Services/src/Extensions/IServiceCollectionExtensions.cs
services.AddScoped<{Entity}Service>();
```

### Option B: Extend Existing Service

Add methods to the existing service class, following the same patterns.

---

Add localization support for user-facing messages in the service.

## Step 5: Localization

### When to Localize

**Localize:**
- ✅ Exception messages thrown to users
- ✅ Validation error messages
- ✅ Business rule violations
- ✅ User-facing status messages

**Do NOT localize:**
- ❌ Log messages (`_logger.LogInformation`, etc.)
- ❌ Debug/trace output
- ❌ Internal system messages
- ❌ Developer-facing errors

### Injecting IStringLocalizer

Add `IStringLocalizer<T>` to the service constructor, where `T` is the shared resource marker class for your namespace:

```csharp
using Microsoft.Extensions.Localization;
using Base2.Localization;

namespace Base2.{Namespace};

public class {Entity}Service(
    WarehouseDbContext dbContext,
    IStringLocalizer<{Namespace}ServiceResource> localizer,
    ILogger<{Entity}Service> logger)
{
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly IStringLocalizer _localizer = localizer;
    private readonly ILogger _logger = logger;
}
```

**Key Points:**
- Use shared resource marker class: `IStringLocalizer<{Namespace}ServiceResource>`
- The marker class should already exist for the namespace (created with the feature)
- Store as `IStringLocalizer` (non-generic) field for convenience
- Multiple services in the same namespace share the same marker class

### Using Localizer for Exception Messages

Replace hardcoded exception messages with localized strings:

```csharp
// Before (hardcoded - not localized)
if (entity is null)
{
    throw new InvalidOperationException("Entity not found.");
}

// After (localized)
if (entity is null)
{
    string message = _localizer["Entity not found."];
    throw new InvalidOperationException(message);
}
```

**Pattern:**
1. Use the English text as the resource key (indexer parameter)
2. Store the result in a variable (optional but recommended for readability)
3. Pass the localized string to the exception constructor

### Resource File Expectations

The marker class and resource files should already exist for this namespace (created when the feature was first implemented). Simply:

1. Inject `IStringLocalizer<{Namespace}ServiceResource>` in the service
2. Use `_localizer["English text"]` for user-facing messages
3. Continue using `_logger` for logging (no localization)

New localized strings will be added to the existing resource files by the localization team.

---

Add metrics to track the new entity operations.

## Step 6: Metrics Instrumentation

### Inject IObservabilityMetrics

```csharp
using Base2.Services.Observability;

public class {Entity}Service(
    WarehouseDbContext dbContext,
    IObservabilityMetrics metrics,
    ILogger<{Entity}Service> logger)
{
    private readonly IObservabilityMetrics _metrics = metrics;
    // ...
}
```

### Record Metrics in Service Methods

```csharp
public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
{
    Record record = model.ToRecord();
    record.TenantId = tenantId;
    record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

    _dbSet.Add(record);
    await _dbContext.SaveChangesAsync();

    // Record metric after successful operation
    _metrics.RecordEntityCreated();  // Use existing or add new metric
    
    _logger.LogInformation("Created {Entity} {Id}.", record.Id);
    return record.ToModel();
}
```

### For Complex Operations

```csharp
using System.Diagnostics;

public async Task<Result> ProcessEntityAsync(long id, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        // ... processing logic ...
        
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordOperationDuration(duration, entityType: "{Entity}");
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordOperationFailed(
            errorType: ex.GetType().Name,
            entityType: "{Entity}");
        throw;
    }
}
```

### Add New Metrics (If Needed)

If your entity requires new metrics not already defined:

1. Add constants in `MetricsConstants.cs`
2. Add interface method in `IObservabilityMetrics.cs`
3. Create instrument and implement in `ObservabilityMetrics.cs`
4. Add tests in `ObservabilityMetricsTests.cs`

See Step 5 in server-feature workflow for detailed examples.

**Best Practices:**
- ✅ Use existing metrics when possible
- ✅ Record after successful operations
- ✅ Record failures in catch blocks
- ❌ Don't use high-cardinality tags (entity IDs)

---

Expose the new entity operations via controller endpoints.

## Step 7: Controllers

> **Note:** Generate XML doc comments (`/// <summary>`) for all action methods. Use `[EndpointDescription]` for OpenAPI.

Choose your approach:
- **New Controller**: Create a new controller class for this entity
- **Extend Existing**: Add endpoints to an existing controller class

### Option A: New Controller Class (Recommended for Core Entities)

```csharp
// File: Web/src/Controllers/{Namespace}/{Entity}Controller.cs
[Route("api/[area]/[controller]")]
[Area(nameof({Namespace}))]
[Tags(nameof({Namespace}))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class {Entity}Controller(
    ILogger<{Entity}Controller> logger,
    {Entity}Service service) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly {Entity}Service _service = service;

    /// <summary>
    /// Get an entity by ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [TenantRead]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Returns an entity by ID.")]
    public async Task<ActionResult> Get(long id, CancellationToken ct)
    {
        if (id <= 0) return BadRequest();
        var result = await _service.ReadOrDefaultAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Create a new entity.
    /// </summary>
    [HttpPost]
    [TenantWrite]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Creates a new entity.")]
    public async Task<ActionResult> Post({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var (userId, tenantId, groupId) = User.GetUserIdentifiers();
        var result = await _service.CreateAsync(userId, tenantId, groupId, model);
        return Ok(result);
    }

    // Add Put, Delete, and other endpoints as needed
}
```

### Option B: Extend Existing Controller

Add endpoints to the existing controller class, following the same patterns.

**RLS Attributes:**

| Attribute | Use For | Effect |
|-----------|---------|--------|
| `[TenantRead]` | GET operations | Sets read-only RLS context |
| `[TenantWrite]` | POST, PUT, DELETE | Sets read-write RLS context |

---

Ensure RLS is properly configured for the new entity.

## Step 8: RLS Configuration

### Requirements Checklist

1. **Entity has TenantId** ✓ (already added in Step 1)
2. **Service sets TenantId on create** ✓ (already added in Step 4)
3. **Controller uses RLS attributes** ✓ (already added in Step 6)
4. **Table registered for RLS policy**

```csharp
// In RlsPolicyManager.cs
public static readonly string[] TablesWithTenantOnly = 
[
    // existing tables...
    "{entity}",  // Add your new table name (snake_case)
];
```

### Verify RLS Works

Test that:
- Creating entities sets TenantId correctly
- Reading entities only returns your tenant's data
- Updating/deleting only works on your tenant's data

---

Write tests to verify the implementation.

## Step 9: Testing

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
            fixture.DbContext,
            fixture.GetRequiredService<IObservabilityMetrics>(),
            fixture.Logger<{Entity}Service>());
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
        // Arrange
        var created = await CreateTestEntityAsync();

        // Act
        var result = await _service.ReadOrDefaultAsync(created.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(created.Id, result.Id);
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

### What to Test

- [ ] **CRUD operations** - Create, Read, Update, Delete all work
- [ ] **Not found cases** - Non-existing IDs return null/404
- [ ] **Validation** - Invalid input is rejected appropriately
- [ ] **RLS isolation** - Data is tenant-isolated

---

After implementation, update tracking documents.

## Step 10: Update Tracking Documents

### Documents to Update

| Document | When to Update |
|----------|----------------|
| User Stories (MVP) | Always |
| Feature-Specific PRD | If exists for this namespace |
| GitHub Issues | Always |

### Update User Stories

Location: `doc/prd/11-roadmap/mvp-user-stories.md`

```markdown
Before:
- [ ] As a user, I can manage sequences for campaigns

After:
- [x] As a user, I can manage sequences for campaigns
  - Completed: 2025-12-15
  - PR: #456
```

### Update Feature PRD (If Exists)

Check: `doc/prd/06-feature-requirements/mvp/{namespace}.md`

If the file exists, update implementation status.

### Update GitHub Issues

**⚠️ Confirm with user before closing or modifying issues.**

```bash
gh issue list --search "{entity}" --state open
gh issue close <number> --comment "Completed in PR #<pr-number>"
```

---

## Implementation Checklist

### Files Created
- [ ] `Contracts/src/{Namespace}/{Entity}Model.cs`
- [ ] `Data/src/{Namespace}/{Entity}.cs`
- [ ] `Data/src/{Namespace}/{Entity}Query.cs`
- [ ] `Data/src/{Namespace}/{Entity}Mapper.cs`
- [ ] `Services/src/{Namespace}/{Entity}Service.cs` (or updated existing)
- [ ] `Web/src/Controllers/{Namespace}/{Entity}Controller.cs` (or updated existing)

### Configuration
- [ ] Entity has colocated `OnModelCreating` method
- [ ] DbSet registered in DbContext
- [ ] Entity configuration called from DbContext's OnModelCreating
- [ ] Service registered in DI (if new service)
- [ ] RLS policy added (TablesWithTenantOnly)
- [ ] Migration created

### Localization
- [ ] IStringLocalizer injected in service (if user-facing messages)
- [ ] Marker class exists for namespace (should already exist)
- [ ] Exception messages use _localizer["..."]
- [ ] Log messages remain in English

### Observability
- [ ] Metrics injected in service
- [ ] Success metrics recorded
- [ ] Failure metrics recorded

### Testing
- [ ] Service unit tests written
- [ ] Controller integration tests written

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] GitHub issues updated/closed

---

## Backlinks for Deep Dives

- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md) - Full RLS documentation
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md)
- [Localization Pattern](../patterns/server/localization-pattern.md) - Comprehensive reference including resource file creation
- [Metrics Instrumentation Pattern](../patterns/server/metrics-instrumentation-pattern.md) - Comprehensive metrics guide
