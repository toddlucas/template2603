# Server Feature Workflow

Complete workflow for building a new server-side feature with CRUD operations, RLS, and testing.

## Prerequisites

Before starting, determine:
1. **Namespace**: Which feature area? (Access, Business, Prospecting, etc.)
2. **Database**: App (OLTP) or Warehouse (OLAP)?
3. **Entity name**: Singular, PascalCase (e.g., `Contact`, `Sequence`)

## Code Style Conventions

### Using Statement Organization

**Placement**: Using statements go **above** the namespace declaration. Type aliases go **after** the namespace.

Group `using` statements with blank lines between groups:
1. **System** namespaces (`System.*`)
2. **Microsoft** namespaces (`Microsoft.*`)
3. **Third-party** namespaces (e.g., `Riok.Mapperly`, `FluentValidation`)
4. **Project** namespaces (`Base2.*`)

```csharp
using System.Text.Json;

using Microsoft.EntityFrameworkCore;

using Riok.Mapperly.Abstractions;

using Base2.Infrastructure;
using Base2.Prospecting;

namespace Base2.Interaction;

using Record = IncomingReply;
using Model = IncomingReplyModel;
```

### Namespace Organization (Vertical Slices)

**Rule**: Keep namespaces "vertically integrated" - **no intermediate layer namespaces** like `.Data`, `.Services`, or `.BackgroundJobs`.

For example, for the `Interaction` feature:
- `Base2.Contracts/src/Interaction/` → `Base2.Interaction`
- `Base2.Data/src/Interaction/` → `Base2.Interaction`
- `Base2.Services/src/Interaction/` → `Base2.Interaction`
- `Base2.Background.Tasks/src/Interaction/` → `Base2.Interaction`
- `Base2.Web/src/Controllers/Interaction/` → `Base2.Controllers.Interaction` (exception)

**Benefits**: Types from different projects share the same namespace, making imports cleaner within the same feature.

**❌ Don't**: `namespace Base2.Services.Interaction;`  
**✅ Do**: `namespace Base2.Interaction;`

## File Structure Overview

For a feature called `{Entity}` in the `{Namespace}` namespace:

```
Base2.Contracts/src/{Namespace}/
├── {Entity}Model.cs

Base2.Data/src/{Namespace}/
├── {Entity}.cs
├── {Entity}Query.cs
├── {Entity}Mapper.cs

Base2.Services/src/{Namespace}/
├── {Entity}Service.cs

Base2.Web/src/Controllers/{Namespace}/
├── {Entity}Controller.cs
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

The service layer orchestrates business logic and uses these mappers.

## Step 4: Service

> **Note:** Generate XML doc comments (`/// <summary>`, `/// <param>`, `/// <returns>`) for all public methods.

> **Note:** Always include the using aliases for `Record`, `Model`, and `DetailModel`. This keeps services consistent and maintainable across the codebase.

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

/// <summary>
/// {Entity} service for business logic and data operations.
/// </summary>
/// <remarks>
/// Services are responsible for:
/// - Setting TenantId, OwnerId, CreatedBy on new entities
/// - Setting timestamps (CreatedAt, UpdatedAt, DeletedAt)
/// - Business logic and validation
///
/// Services do NOT inject IRequestDbGuard. RLS context is set at the controller level.
/// </remarks>
public class {Entity}Service(
    WarehouseDbContext dbContext,
    ILogger<{Entity}Service> logger)
{
    private readonly ILogger _logger = logger;
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.{Entities};
    private readonly {Entity}Query _query = new(dbContext.{Entities}, logger);

    /// <summary>
    /// Gets a single entity by ID.
    /// </summary>
    /// <param name="id">The entity ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The entity model or null if not found.</returns>
    public async Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleOrDefaultAsync(id, cancellationToken);
        return record?.ToModel();
    }

    /// <summary>
    /// Gets a single entity by ID with related entities.
    /// </summary>
    /// <param name="id">The entity ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The entity detail model or null if not found.</returns>
    public async Task<DetailModel?> ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleDetailOrDefaultAsync(id, cancellationToken);
        return record?.ToDetailModel();
    }

    /// <summary>
    /// Creates a new entity.
    /// </summary>
    /// <param name="userId">The ID of the user creating the entity.</param>
    /// <param name="tenantId">The tenant ID for data isolation.</param>
    /// <param name="groupId">The group ID for group isolation.</param>
    /// <param name="model">The entity model.</param>
    /// <returns>The created entity model.</returns>
    public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
    {
        Record record = model.ToRecord();
        
        // Service responsibility: Set identity context and timestamps
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

    /// <summary>
    /// Updates an existing entity.
    /// </summary>
    /// <param name="model">The entity model.</param>
    /// <returns>The updated entity model or null if not found.</returns>
    public async Task<Model?> UpdateAsync(Model model)
    {
        Record? record = await _query.TrackOrDefaultAsync(model.Id);
        if (record is null)
        {
            _logger.LogWarning("Attempted to update non-existent {Entity} {Id}.", model.Id);
            return null;
        }

        record.UpdateFrom(model);
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();
        return record.ToModel();
    }

    /// <summary>
    /// Soft deletes an entity.
    /// </summary>
    /// <param name="id">The entity ID.</param>
    /// <returns>True if the entity was deleted, false if not found.</returns>
    public async Task<bool> DeleteAsync(long id)
    {
        Record? record = await _query.TrackOrDefaultAsync(id);
        if (record is null)
        {
            _logger.LogWarning("Attempted to delete non-existent {Entity} {Id}.", id);
            return false;
        }

        // Soft delete: set DeletedAt timestamp instead of removing
        record.DeletedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Gets a paginated list of entities with search and sorting support.
    /// </summary>
    /// <param name="query">Pagination query parameters.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A paginated result of entity models.</returns>
    public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<Record> queryable = _dbSet.AsQueryable();

        // Apply search across relevant fields
        query.Search((term) =>
        {
            queryable = queryable
                .Where(e => e.Name.ToLower().Contains(term) ||
                           e.Email.ToLower().Contains(term));
        });

        // Apply ordering and pagination
        Record[] records = await queryable
            .OrderByPage(query, nameof(Record.CreatedAt))  // Default sort column
            .Paginate(query, out int count)
            .ToArrayAsync(cancellationToken);

        return PagedResult.Create(records.ToModels(), count, (string?)null);
    }

    /// <summary>
    /// Finds an entity by email.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The entity model or null if not found.</returns>
    public async Task<Model?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.FindByEmailAsync(email, cancellationToken);
        return record?.ToModel();
    }
}
```

**Parameter Ordering Convention:**

For methods needing identity context:
1. `userId` - User performing operation (for ownership)
2. `tenantId` - Tenant context (create only)
3. `groupId` - Group context (create only)
4. `...data` - Model/parameters

**When to include each:**
- `userId`: Creating entities with ownership, audit logging
- `tenantId`: Create operations only (RLS handles read/update/delete)
- `groupId`: Create operations only (reseller mode)

**DI Registration:**

```csharp
// File: Services/src/Extensions/IServiceCollectionExtensions.cs
services.AddScoped<{Entity}Service>();
```

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
- Common marker classes: `OrchestrationServiceResource`, `ProspectingServiceResource`, `AccessServiceResource`
- Store as `IStringLocalizer` (non-generic) field for convenience
- Multiple services in the same namespace share the same marker class

### Using Localizer for Exception Messages

Replace hardcoded exception messages with localized strings:

```csharp
// Before (hardcoded - not localized)
if (firstStep == null)
{
    throw new InvalidOperationException("Sequence has no steps. Add at least one step before enrolling contacts.");
}

// After (localized)
if (firstStep == null)
{
    string message = _localizer["Sequence has no steps. Add at least one step before enrolling contacts."];
    throw new InvalidOperationException(message);
}
```

**Pattern:**
1. Use the English text as the resource key (indexer parameter)
2. Store the result in a variable (optional but recommended for readability)
3. Pass the localized string to the exception constructor

### Multiple Localized Messages

```csharp
if (sequence is null)
{
    string message = _localizer["Sequence not found."];
    throw new InvalidOperationException(message);
}

if (sequence.StatusId == nameof(SequenceStatus.stopped))
{
    string message = _localizer["Cannot enroll contacts in a stopped sequence. Clone it to create a new one."];
    throw new InvalidOperationException(message);
}
```

### Resource File Expectations

**Do NOT create resource files yourself** - they will be created by the localization team or in a separate step. Your responsibility is only to:

1. Inject `IStringLocalizer<MarkerClass>` in the service
2. Use `_localizer["English text"]` for user-facing messages
3. Continue using `_logger` for logging (no localization)

The resource files will be created in `Resources/Localization/{MarkerClass}.{culture}.resx` with translations for all supported languages (en-US, fr, de, el, es).

**If one doesn't exist** and you're creating a new namespace, you can pause and ask the user to help.
Alternatively, you can copy a file from a parallel namespace.
You'll need to create the associated marker class too.

### Marker Class Reference

If adding localization to a new namespace, check if a marker class exists:

```csharp
// File: Services/src/Localization/{Namespace}ServiceResource.cs
namespace Base2.Localization;

/// <summary>
/// Marker class for shared {namespace} service resources.
/// This class is never instantiated - it's only used for resource discovery.
/// </summary>
internal class {Namespace}ServiceResource
{
}
```

**If the marker class doesn't exist:**
- Create it following the pattern above
- Place in `Services/src/Localization/`
- Use `{Namespace}ServiceResource` naming convention
- Mark as `internal` - only used for DI and resource discovery

### Supported Languages

All localized strings must eventually have translations for:
- `en-US` (English - default)
- `fr` (French)
- `de` (German)
- `el` (Greek)
- `es` (Spanish)

The system automatically selects the appropriate translation based on the request's `Accept-Language` header.

---

Add metrics to track operations and provide observability.

## Step 6: Metrics Instrumentation

### Injecting IObservabilityMetrics

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
using Base2.Services.Observability;

public class {Entity}Service(
    WarehouseDbContext dbContext,
    IObservabilityMetrics metrics,
    ILogger<{Entity}Service> logger)
{
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly IObservabilityMetrics _metrics = metrics;
    private readonly ILogger _logger = logger;
}
```

**Key points:**
- Inject `IObservabilityMetrics` in service constructors
- Available for all services via DI
- No additional registration needed

### Recording Metrics

> **Note:** Record metrics after successful operations and in catch blocks for failures.

```csharp
public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
{
    Record record = model.ToRecord();
    record.TenantId = tenantId;
    record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

    _dbSet.Add(record);
    await _dbContext.SaveChangesAsync();

    // Record metric after successful operation
    _metrics.RecordContactCreated();
    
    _logger.LogInformation("Created {Entity} {Id}.", record.Id);
    return record.ToModel();
}
```

### Timing Operations

```csharp
using System.Diagnostics;

public async Task<Result> ProcessAsync(long id, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        _metrics.RecordSequenceStarted();
        
        // ... processing logic ...
        
        _metrics.RecordSequenceCompleted();
        
        // Record duration in seconds
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordSequenceExecutionDuration(duration, sequenceId: id.ToString());
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordSequenceFailed(
            errorType: ex.GetType().Name,
            sequenceId: id.ToString());
        throw;
    }
}
```

**Key points:**
- Use `Stopwatch.GetTimestamp()` for timing
- Calculate duration with `Stopwatch.GetElapsedTime(startTime).TotalSeconds`
- Record duration in **seconds** as floating-point
- Always record failures in catch blocks

### Recording with Context Tags

```csharp
public async Task<SendResult> SendEmailAsync(EmailMessage message, CancellationToken ct)
{
    try
    {
        var result = await _emailProvider.SendAsync(message, ct);
        
        if (result.Success)
        {
            // Record with context tags (provider, sequence, etc.)
            _metrics.RecordEmailSent(
                sequenceId: message.SequenceId?.ToString(),
                emailProvider: "office365");
        }
        else
        {
            _metrics.RecordEmailFailed(
                errorType: result.ErrorType ?? "unknown",
                sequenceId: message.SequenceId?.ToString(),
                emailProvider: "office365");
        }
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordEmailAccountConnectionFailure(
            emailProvider: "office365",
            errorType: ex.GetType().Name);
        throw;
    }
}
```

**Key points:**
- Tags provide context for filtering and grouping metrics
- Use low-cardinality tags (< 1,000 unique combinations)
- ❌ **Never** use user IDs, contact IDs, or other high-cardinality data as tags
- ✅ **Do** use provider names, operation types, error types

### Adding New Metrics (If Needed)

If you need to track a new metric for your feature:

#### Step 1: Add Constants

```csharp
// File: Services/src/Observability/MetricsConstants.cs
public static class MetricsConstants
{
    public const string ContactsImported = "reach.contacts.imported";
    
    public static class Descriptions
    {
        public const string ContactsImported = "Total number of contacts imported from external sources";
    }
}
```

#### Step 2: Add Interface Method

```csharp
// File: Services/src/Observability/IObservabilityMetrics.cs
public interface IObservabilityMetrics
{
    /// <summary>
    /// Records a contact import operation.
    /// </summary>
    /// <param name="count">Number of contacts imported</param>
    /// <param name="source">Import source (e.g., "csv", "api", "manual")</param>
    void RecordContactsImported(int count, string source);
}
```

#### Step 3: Create Instrument & Implement

```csharp
// File: Services/src/Observability/ObservabilityMetrics.cs
public sealed class ObservabilityMetrics : IObservabilityMetrics
{
    private readonly Counter<long> _contactsImported;

    public ObservabilityMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create(
            MetricsConstants.MeterName,
            MetricsConstants.MeterVersion);

        // Create instrument in constructor
        _contactsImported = _meter.CreateCounter<long>(
            MetricsConstants.ContactsImported,
            unit: MetricsConstants.Units.Contacts,
            description: MetricsConstants.Descriptions.ContactsImported);
    }

    // Implement method
    public void RecordContactsImported(int count, string source)
    {
        var tags = CreateTagList(("import.source", source));
        _contactsImported.Add(count, tags);
    }
}
```

#### Step 4: Use in Service

```csharp
public async Task<ImportResult> ImportContactsAsync(Stream csvStream, CancellationToken ct)
{
    var contacts = await ParseCsvAsync(csvStream, ct);
    await _contactQuery.BulkCreateAsync(contacts, ct);
    
    // Record the metric
    _metrics.RecordContactsImported(contacts.Count, source: "csv");
    
    return new ImportResult { ImportedCount = contacts.Count };
}
```

### Instrument Types Quick Reference

| Type | Use For | Example |
|------|---------|---------|
| **Counter<T>** | Events that only increase | Emails sent, API calls, errors |
| **Histogram<T>** | Distributions of values | Latency, duration, sizes |
| **Gauge<T>** | Current value that changes | Cache size, active connections |
| **ObservableGauge<T>** | Value from callback | Queue depth, connection pool size |

### Viewing Metrics Locally

```bash
# Install dotnet-counters (one-time)
dotnet tool install -g dotnet-counters

# View all metrics
dotnet-counters monitor -n Base2.Web --counters Base2.ProductName

# Output:
# [Base2.ProductName]
#     product_name.sequences.emails_sent ({emails})                    42
#     product_name.sequences.emails_failed ({emails})                   3
#     product_name.api.request_duration (s)
#         Percentile
#         50                                                    0.125
#         95                                                    0.450
```

**Best Practices:**
- ✅ Record metrics **after** successful operations
- ✅ Record failure metrics in **catch blocks**
- ✅ Use **seconds** for duration (floating-point)
- ✅ Use **low-cardinality tags** (provider, type, status)
- ❌ Never use high-cardinality data (IDs) as tags

---

Controllers expose the service operations via HTTP endpoints.

## Step 7: Controllers

> **Note:** Generate XML doc comments (`/// <summary>`) for all action methods. Use `[EndpointDescription]` for OpenAPI.

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

    // Update an entity
    [HttpPut]
    [TenantWrite]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Updates an existing entity.")]
    public async Task<ActionResult> Put({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var result = await _service.UpdateAsync(model);
        return result is null ? NotFound() : Ok(result);
    }

    // Delete an entity
    [HttpDelete("{id:long}")]
    [TenantWrite]
    [EndpointDescription("Deletes an entity.")]
    public async Task<ActionResult> Delete(long id)
    {
        if (id <= 0) return BadRequest();
        var succeeded = await _service.DeleteAsync(id);
        return succeeded ? NoContent() : NotFound();
    }
}
```

**RLS Attributes:**

| Attribute | Use For | Effect |
|-----------|---------|--------|
| `[TenantRead]` | GET operations | Sets read-only RLS context |
| `[TenantWrite]` | POST, PUT, DELETE | Sets read-write RLS context |

**Identity Extraction:**

```csharp
// Single values
Guid userId = User.GetNameIdentifier();
Guid tenantId = User.GetTenantId();
Guid groupId = User.GetGroupId();

// Tuple shorthand
var (userId, tenantId, groupId) = User.GetUserIdentifiers();
```

---

Finally, ensure RLS is properly configured for multi-tenancy.

## Step 8: RLS Configuration

### Requirements Checklist

1. **Entity has TenantId**
   ```csharp
   public Guid TenantId { get; set; }
   ```

2. **Service sets TenantId on create**
   ```csharp
   record.TenantId = tenantId;  // Passed from controller
   ```

3. **Controller uses RLS attributes**
   ```csharp
   [TenantRead]   // GET operations
   [TenantWrite]  // POST, PUT, DELETE
   ```

4. **Table registered for RLS policy**
   ```csharp
   // In RlsPolicyManager.cs
   public static readonly string[] TablesWithTenantOnly = 
   [
       // existing tables...
       "{entity}",
   ];
   ```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Controller | Call `[TenantRead]`/`[TenantWrite]` to set RLS context |
| Service | Set `TenantId` on new entities |
| Query | No tenant filtering—RLS handles it |
| Database | PostgreSQL RLS policy filters all queries |

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty results | TenantId not set on entity | Check service sets it |
| Wrong tenant data | RLS attribute missing | Add `[TenantRead]`/`[TenantWrite]` |
| Permission denied | Using wrong attribute | Use `[TenantWrite]` for mutations |

---

Write tests to verify the implementation.

## Step 9: Testing

> **Note:** Create tests in `Base2.Tests` project under matching namespace folder.

### Service Tests

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

### What to Test Checklist

- [ ] **CRUD operations** - Create, Read, Update, Delete all work
- [ ] **Not found cases** - Non-existing IDs return null/404
- [ ] **Validation** - Invalid input is rejected appropriately
- [ ] **RLS isolation** - Data is tenant-isolated (use different tenant in test)
- [ ] **Edge cases** - Empty lists, max lengths, special characters

---

After implementation, update tracking documents.

## Step 10: Update Tracking Documents

### Documents to Update

After implementation, update these documents in order:

| Document | Location | When to Update |
|----------|----------|----------------|
| User Stories (MVP) | `doc/prd/11-roadmap/mvp-user-stories.md` | Always |
| Feature-Specific PRD | `doc/prd/06-feature-requirements/mvp/{feature}.md` | If exists |
| Current State | `doc/prd/11-roadmap/mvp-current-state.md` | For significant features |
| Issue List | `doc/prd/GITHUB_ISSUES.md` | Complete list of issues |
| GitHub Issues | Via `gh` CLI | Always |

### Update User Stories

Location: `doc/prd/11-roadmap/mvp-user-stories.md`

```markdown
Before:
- [ ] As a user, I can create contacts for outreach

After:
- [x] As a user, I can create contacts for outreach
  - Completed: 2025-12-10
  - PR: #123
```

**Steps:**
1. Search for the relevant story by feature keyword
2. Change `[ ]` to `[x]`
3. Add completion date
4. Add PR number or implementation notes if helpful

### Decision Tree: What to Update

```
What did you implement?

├─ New feature (namespace/directory)
│  └─ Update: User Stories + Current State + Feature PRD (create if needed) + GH Issues
│
├─ New entity in existing feature
│  └─ Update: User Stories + Feature PRD (if exists) + GH Issues
│
├─ Modification to existing entity
│  └─ Update: User Stories (if story exists) + GH Issues
│
└─ Bug fix / refactor
    └─ Update: GH Issues only
```

### Checklist

After implementation, verify:

- [ ] **User Stories**: Relevant story marked `[x]` with date
- [ ] **Feature PRD**: Updated if file exists for this feature
- [ ] **Current State**: Updated if significant feature/entity
- [ ] **GitHub Issues**: Closed or commented (with user confirmation)

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Implementation Checklist

### Files Created
- [ ] `Contracts/src/{Namespace}/{Entity}Model.cs`
- [ ] `Data/src/{Namespace}/{Entity}.cs`
- [ ] `Data/src/{Namespace}/{Entity}Query.cs`
- [ ] `Data/src/{Namespace}/{Entity}Mapper.cs`
- [ ] `Services/src/{Namespace}/{Entity}Service.cs`
- [ ] `Web/src/Controllers/{Namespace}/{Entity}Controller.cs`

### Configuration
- [ ] Entity has colocated `OnModelCreating` method
- [ ] DbSet registered in DbContext
- [ ] Entity configuration called from DbContext's OnModelCreating
- [ ] Service registered in DI
- [ ] RLS policy added (TablesWithTenantOnly)
- [ ] Migration created

### Localization
- [ ] IStringLocalizer injected in service (if user-facing messages)
- [ ] Marker class exists for namespace
- [ ] Exception messages use _localizer["..."]
- [ ] Log messages remain in English

### Observability
- [ ] Metrics injected in service
- [ ] Success metrics recorded
- [ ] Failure metrics recorded in catch blocks
- [ ] Metric tests added (if new metrics created)

### Testing
- [ ] Service unit tests written
- [ ] Controller integration tests written

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated (if significant)
- [ ] GitHub issues updated/closed

---

## Backlinks for Deep Dives

- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md) - Full RLS documentation
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md)
- [Metrics Instrumentation Pattern](../patterns/server/metrics-instrumentation-pattern.md) - Comprehensive metrics guide
- [Localization Pattern](../patterns/server/localization-pattern.md) - Comprehensive reference including resource file creation
