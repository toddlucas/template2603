# Server Modification Workflow

Complete workflow for modifying an existing server entity—adding fields, operations, or endpoints to an existing Model/Entity.

## Prerequisites

Before starting:
1. **Identify the existing feature**: Which namespace and entity?
2. **Understand the change**: New field? New operation? New endpoint?
3. **Review existing code**: Understand current patterns in use

## Decision Tree

What are you modifying?

```
├─ New field on existing entity
│  └─ Update: Model → Entity → Entity OnModelCreating → Mapper (ignore or map) → Migration
│
├─ New query method
│  └─ Update: Query class → Service method → Controller endpoint
│
├─ New operation (complex logic)
│  └─ Update: Service method → Controller endpoint
│
├─ New entity in existing namespace
│  └─ Use server-entity workflow instead
│
└─ New feature/namespace
    └─ Use server-feature workflow instead
```

---

## Adding Fields to Existing Entity

When adding a new field to an existing entity, you'll need to update the Model, Entity, entity configuration (OnModelCreating), and mappers.

### Step 1: Update Model

Add the field to the Model class if it should be exposed via the API:

```csharp
// File: Contracts/src/{Namespace}/{Entity}Model.cs
public class {Entity}Model
{
    public long Id { get; set; }
    
    // Existing fields...
    
    /// <summary>
    /// Description of the new field.
    /// </summary>
    [Display(Name = "Field Label")]
    [StringLength(100)]  // Add validation as needed
    public string NewField { get; set; } = string.Empty;
}
```

**Key Points:**
- Add XML doc comments (`/// <summary>`)
- Use `[Display]` for user-friendly names
- Add validation attributes (`[Required]`, `[StringLength]`, `[Range]`, etc.)
- Initialize properties with default values to avoid nullability issues

**Common Validation Attributes:**

| Attribute | Use Case | Example |
|-----------|----------|---------|
| `[Required]` | Non-null/empty | `[Required]` |
| `[StringLength]` | Max string length | `[StringLength(100)]` |
| `[Range]` | Numeric range | `[Range(0, 100)]` |
| `[EmailAddress]` | Email format | `[EmailAddress]` |
| `[Url]` | URL format | `[Url]` |
| `[RegularExpression]` | Custom pattern | `[RegularExpression(@"^\d{3}-\d{4}$")]` |

### Step 2: Update Entity

If the field was added to the Model, it's automatically inherited by the Entity:

```csharp
// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    // Existing properties...
    
    // NewField is inherited from Model - no need to redeclare
    // Unless it needs database-specific configuration or override
}
```

**When to Override in Entity:**
- ✅ Need different validation for database layer
- ✅ Need to add database-specific attributes (`[Column]`, `[MaxLength]`, etc.)
- ✅ Need different default values for database
- ❌ Simple properties - just inherit from Model

**Example of Override (if needed):**

```csharp
// Override only if you need database-specific behavior
[Column("new_field")]
[MaxLength(100)]
public new string NewField { get; set; } = string.Empty;
```

### Step 3: Update Entity Configuration

Add column mapping in the entity's colocated `OnModelCreating` method:

```csharp
// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    // ... properties ...
    
    /// <summary>
    /// Configures the entity mappings for Entity Framework Core.
    /// </summary>
    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Existing configuration...
        modelBuilder.Entity<{Entity}>().Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        
        // Add column mapping for new field
        modelBuilder.Entity<{Entity}>().Property(e => e.NewField)
            .HasColumnName("new_field")  // snake_case
            .HasMaxLength(100)
            .IsRequired(false);  // or .IsRequired() for NOT NULL
    }
}
```

> **Note:** Entity configuration is colocated with the entity class (not in DbContext). This keeps related code together and follows the codebase pattern.

**Configuration Options:**

| Method | Purpose | Example |
|--------|---------|---------|
| `.HasColumnName()` | Map to DB column | `.HasColumnName("new_field")` |
| `.HasMaxLength()` | Max string length | `.HasMaxLength(100)` |
| `.IsRequired()` | NOT NULL constraint | `.IsRequired()` |
| `.HasDefaultValue()` | DB default | `.HasDefaultValue(0)` |
| `.HasDefaultValueSql()` | SQL default | `.HasDefaultValueSql("CURRENT_TIMESTAMP")` |
| `.HasColumnType()` | Specific DB type | `.HasColumnType("jsonb")` |

**Naming Convention:**
- ✅ Column names: `snake_case` (e.g., `new_field`)
- ✅ Table names: `snake_case` (e.g., `contact`)
- ❌ Never use PascalCase or camelCase in database

**Colocation Pattern:**
- ✅ Add configuration to entity's `OnModelCreating` method
- ✅ Entity configuration lives with the entity class
- ❌ Don't add inline configuration in DbContext

### Step 4: Update Mapper Ignores (If Needed)

> **Note:** Mapperly auto-maps matching properties by default. Only add ignore attributes if the field should NOT be mapped.

#### If Field is API-Visible (Most Cases)

**No changes needed** - Mapperly automatically maps properties with matching names between Model and Entity.

#### If Field is Internal/Computed (Exclude from API)

Add ignore attributes to prevent mapping:

```csharp
// File: Data/src/{Namespace}/{Entity}Mapper.cs
using Record = {Entity};
using Model = {Entity}Model;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
    /// <summary>
    /// Maps the entity to the basic model.
    /// </summary>
    /// <remarks>
    /// Excludes: TenantId, GroupId, temporal fields, navigation properties, NewInternalField.
    /// </remarks>
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.CreatedAt))]
    [MapperIgnoreSource(nameof(Record.UpdatedAt))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    [MapperIgnoreSource(nameof(Record.NewInternalField))]  // NEW: Exclude internal field
    public static partial Model ToModel(this Record source);

    /// <summary>
    /// Maps the model to the entity.
    /// </summary>
    [MapperIgnoreTarget(nameof(Record.TenantId))]
    [MapperIgnoreTarget(nameof(Record.CreatedAt))]
    [MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    [MapperIgnoreTarget(nameof(Record.DeletedAt))]
    [MapperIgnoreTarget(nameof(Record.NewInternalField))]  // NEW: Exclude internal field
    public static partial Record ToRecord(this Model source);
}
```

**When to Ignore Fields:**

| Scenario | Entity → Model | Model → Entity |
|----------|----------------|----------------|
| Internal DB field (not in Model) | ✅ Ignore source | N/A |
| Computed property (not stored) | ✅ Ignore source | ✅ Ignore target |
| Navigation property | ✅ Ignore source | ✅ Ignore target |
| Temporal fields (always) | ✅ Ignore source | ✅ Ignore target |

### Step 5: Update UpdateFrom Method

The `UpdateFrom` extension method controls which fields can be updated. Add your new field if it should be updatable:

```csharp
// File: Data/src/{Namespace}/{Entity}Mapper.cs
/// <summary>
/// Updates an existing entity from a model.
/// </summary>
/// <remarks>
/// Never update: Id, TenantId, GroupId, CreatedAt, DeletedAt.
/// UpdatedAt is set by the service.
/// </remarks>
public static void UpdateFrom(this Record record, Model model)
{
    // Existing field assignments...
    record.Field1 = model.Field1;
    record.Field2 = model.Field2;
    
    // Add new field
    record.NewField = model.NewField;
}
```

**Rules for UpdateFrom:**

| Field Type | Update? | Reason |
|------------|---------|--------|
| Business fields | ✅ Yes | User data changes |
| Id | ❌ Never | Immutable identifier |
| TenantId | ❌ Never | Security boundary |
| GroupId | ❌ Never | Security boundary |
| CreatedAt | ❌ Never | Historical timestamp |
| UpdatedAt | ❌ Never | Set by service |
| DeletedAt | ❌ Never | Set by service |
| Navigation properties | ❌ Never | Use separate operations |

### Step 6: Create Migration

After updating the entity and DbContext, create a migration to apply the database change:

```bash
# Navigate to Data project directory
cd src/Base2.Data/src

./add-sqlite-app-migration.sh Add{Entity}{FieldName}

# Create migration with descriptive name
#dotnet ef migrations add Add{Entity}{FieldName} --context AppDbContext

# Example:
#dotnet ef migrations add AddContactEmailVerified --context AppDbContext
```

**Migration Naming Convention:**
- `Add{Entity}{Field}` - Adding new field
- `Update{Entity}{Field}` - Modifying existing field
- `Remove{Entity}{Field}` - Removing field
- `Rename{Entity}{OldName}To{NewName}` - Renaming field

**Review the Generated Migration:**

```csharp
// File: Data/src/Migrations/{Timestamp}_Add{Entity}{Field}.cs
public partial class AddContactEmailVerified : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "email_verified",
            table: "contact",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "email_verified",
            table: "contact");
    }
}
```

**Migration Best Practices:**
- ✅ Always review generated migration before committing
- ✅ Use `defaultValue` for non-nullable fields on existing tables
- ✅ Test both `Up()` and `Down()` migrations
- ❌ Never modify migrations after deployment
- ❌ Never delete migrations from source control

### Step 7: Update Tests for New Field

Add tests to verify the field works correctly:

```csharp
// File: Tests/src/{Namespace}/{Entity}ServiceTests.cs
[Fact]
public async Task CreateAsync_WithNewField_SavesCorrectly()
{
    // Arrange
    var model = new {Entity}Model 
    { 
        Name = "Test",
        NewField = "TestValue"  // Include new field
    };

    // Act
    var result = await _service.CreateAsync(
        Guid.NewGuid(),
        _fixture.TenantId,
        _fixture.GroupId,
        model);

    // Assert
    Assert.NotNull(result);
    Assert.Equal("TestValue", result.NewField);
}

[Fact]
public async Task UpdateAsync_NewField_PersistsChanges()
{
    // Arrange
    var created = await CreateTestEntityAsync();
    created.NewField = "Updated Value";

    // Act
    var result = await _service.UpdateAsync(created);

    // Assert
    Assert.NotNull(result);
    Assert.Equal("Updated Value", result.NewField);
    
    // Verify persistence
    var retrieved = await _service.ReadOrDefaultAsync(created.Id);
    Assert.Equal("Updated Value", retrieved?.NewField);
}
```

**What to Test:**
- ✅ Field is saved on create
- ✅ Field is updated correctly
- ✅ Field persists after round-trip
- ✅ Validation rules work (if any)
- ✅ Default values are applied

---

Add query methods if new data access patterns are needed.

## Adding Query Methods

When you need new ways to query your entity, add methods to the Query class.

### Step 1: Add to Query Class

```csharp
// File: Data/src/{Namespace}/{Entity}Query.cs
public record {Entity}Query(DbSet<{Entity}> DbSet, ILogger logger)
{
    // Existing methods...
    
    /// <summary>
    /// Finds entities by the new field.
    /// </summary>
    /// <param name="value">The value to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Array of matching entities.</returns>
    public Task<{Entity}[]> FindByNewFieldAsync(string value, CancellationToken cancellationToken = default)
        => DbSet.Where(e => e.NewField == value).ToArrayAsync(cancellationToken);
    
    /// <summary>
    /// Search by multiple fields including new field.
    /// </summary>
    /// <param name="term">The search term.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Array of matching entities.</returns>
    public Task<{Entity}[]> SearchAsync(string term, CancellationToken cancellationToken = default)
    {
        var lower = term.ToLower();
        return DbSet
            .Where(e => e.Name.ToLower().Contains(lower) ||
                       e.NewField.ToLower().Contains(lower))  // Add new field to search
            .ToArrayAsync(cancellationToken);
    }
    
    /// <summary>
    /// Gets entities by related ID with new field filtering.
    /// </summary>
    public Task<{Entity}[]> FindByRelatedIdAsync(long relatedId, CancellationToken cancellationToken = default)
        => DbSet
            .Where(e => e.RelatedId == relatedId)
            .Include(e => e.Related)  // Include navigation if needed
            .ToArrayAsync(cancellationToken);
}
```

**Query Method Patterns:**

| Pattern | Use Case | Return Type |
|---------|----------|-------------|
| `FindBy{Field}Async` | Single field lookup | `Task<Entity?>` or `Task<Entity[]>` |
| `SearchAsync` | Multi-field text search | `Task<Entity[]>` |
| `ListBy{Criteria}Async` | Filtered list | `Task<Entity[]>` |
| `GetPagedAsync` | Simple pagination | `Task<Entity[]>` |
| `Count{Criteria}Async` | Count matching | `Task<int>` |
| `Exists{Criteria}Async` | Check existence | `Task<bool>` |

**Best Practices:**
- ✅ Return `Task<Entity?>` for single results (or null)
- ✅ Return `Task<Entity[]>` for multiple results (use arrays, not lists)
- ✅ Use `CancellationToken` parameter with default
- ✅ Include XML doc comments
- ❌ Don't add tenant filtering (RLS handles it)
- ❌ Don't use `.ToList()` (use `.ToArrayAsync()`)

**Performance Considerations:**

```csharp
// ✅ GOOD: Efficient query with projection
public Task<{Entity}[]> FindActiveAsync(CancellationToken ct = default)
    => DbSet
        .Where(e => e.IsActive)
        .OrderBy(e => e.Name)
        .ToArrayAsync(ct);

// ❌ BAD: Loading all data then filtering in memory
public async Task<{Entity}[]> FindActiveAsync(CancellationToken ct = default)
{
    var all = await DbSet.ToArrayAsync(ct);  // Loads everything
    return all.Where(e => e.IsActive).ToArray();  // Filters in memory
}

// ✅ GOOD: Including related data efficiently
public Task<{Entity}[]> GetWithRelatedAsync(CancellationToken ct = default)
    => DbSet
        .Include(e => e.Related)
        .ToArrayAsync(ct);

// ❌ BAD: N+1 query problem
public async Task<{Entity}[]> GetWithRelatedAsync(CancellationToken ct = default)
{
    var entities = await DbSet.ToArrayAsync(ct);
    foreach (var entity in entities)
    {
        entity.Related = await DbSet.Set<Related>()
            .FindAsync(entity.RelatedId);  // Separate query per entity
    }
    return entities;
}
```

---

Update mappers to handle any new fields.

## Updating Mappers for Complex Scenarios

Most field additions don't require mapper changes (auto-mapping), but complex scenarios need custom handling.

### Custom Mapping for Related Entities

When adding navigation properties that need to be mapped to models:

```csharp
// File: Data/src/{Namespace}/{Entity}Mapper.cs
using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
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
    
    // Private mapper for related entities (delegation pattern)
    private static RelatedModel MapToRelatedModel(RelatedEntity source) 
        => RelatedMapper.ToModel(source);
    
    // Private mapper for collections
    private static RelatedModel[] MapToRelatedModels(ICollection<RelatedEntity> source)
        => source.Select(RelatedMapper.ToModel).ToArray();
}
```

### Custom Mapping for Computed Fields

When adding fields that require transformation:

```csharp
// Add to mapper partial class
public static partial class {Entity}Mapper
{
    /// <summary>
    /// Maps entity to model with computed DisplayName.
    /// </summary>
    public static Model ToModelWithDisplayName(this Record source)
    {
        var model = source.ToModel();
        model.DisplayName = $"{source.FirstName} {source.LastName}";
        return model;
    }
}
```

### Mapping Enum IDs to Enum Objects

When you have enumeration IDs that need to be hydrated:

```csharp
// Entity has StatusId (string), Model has Status (StatusType object)
[MapperIgnoreSource(nameof(Record.Status))]  // Ignore navigation
public static partial Model ToModel(this Record source);

// Custom mapping to include Status object
public static Model ToModelWithStatus(this Record source)
{
    var model = source.ToModel();
    model.Status = ContactStatus.FromId(source.StatusId);
    return model;
}
```

---

Add service methods to expose the new functionality.

## Adding Service Methods

Services orchestrate business logic and use query classes to access data.

### Step 1: Add Methods to Existing Service

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
using Record = {Entity};
using Model = {Entity}Model;

public class {Entity}Service
{
    // Existing constructor and fields...
    
    /// <summary>
    /// Finds entities by the new field.
    /// </summary>
    /// <param name="value">The value to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Array of matching entities.</returns>
    public async Task<Model[]> FindByNewFieldAsync(string value, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByNewFieldAsync(value, cancellationToken);
        return records.ToModels();
    }
    
    /// <summary>
    /// Performs a new operation on an entity.
    /// </summary>
    /// <param name="id">The entity ID.</param>
    /// <param name="operationParams">Parameters for the operation.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Result indicating success or failure.</returns>
    public async Task<Result> PerformNewOperationAsync(
        long id, 
        OperationParams operationParams,
        CancellationToken cancellationToken = default)
    {
        Record? record = await _query.TrackOrDefaultAsync(id, cancellationToken);
        if (record is null)
        {
            _logger.LogWarning("Entity {Id} not found for operation.", id);
            return Result.NotFound();
        }
        
        // Perform operation logic
        record.Status = operationParams.NewStatus;
        record.UpdatedAt = DateTime.UtcNow;
        
        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Performed operation on {Entity} {Id}.", id);
        return Result.Success();
    }
}
```

**Service Method Patterns:**

| Pattern | Use Case | Example |
|---------|----------|---------|
| `FindBy{Criteria}Async` | Query delegation | `FindByEmailAsync(email)` |
| `{Action}Async` | State change | `ActivateAsync(id)` |
| `{Action}{Entity}Async` | Business operation | `EnrollContactAsync(id)` |
| `Validate{Entity}Async` | Validation logic | `ValidateSequenceAsync(id)` |
| `Calculate{Result}` | Computation | `CalculateTotalCost(params)` |

**Best Practices:**
- ✅ Use `TrackOrDefaultAsync` for operations that modify data
- ✅ Use `SingleOrDefaultAsync` for read-only operations
- ✅ Log warnings for not-found cases
- ✅ Log information for successful operations
- ✅ Return null/Result objects for error cases
- ❌ Don't throw exceptions for expected errors (use Result pattern)
- ❌ Don't inject `IRequestDbGuard` (RLS set at controller level)

### Complex Business Operations

For operations with multiple steps or validation:

```csharp
/// <summary>
/// Archives an entity after validation.
/// </summary>
public async Task<Result<Model>> ArchiveAsync(long id, CancellationToken cancellationToken = default)
{
    Record? record = await _query.TrackDetailOrDefaultAsync(id, cancellationToken);
    if (record is null)
    {
        return Result<Model>.NotFound("Entity not found.");
    }
    
    // Validation
    if (record.Status == "archived")
    {
        return Result<Model>.Invalid("Entity is already archived.");
    }
    
    if (record.HasActiveChildren)
    {
        return Result<Model>.Invalid("Cannot archive entity with active children.");
    }
    
    // Perform operation
    record.Status = "archived";
    record.ArchivedAt = DateTime.UtcNow;
    record.UpdatedAt = DateTime.UtcNow;
    
    _dbSet.Update(record);
    await _dbContext.SaveChangesAsync(cancellationToken);
    
    _logger.LogInformation("Archived {Entity} {Id}.", id);
    return Result<Model>.Success(record.ToModel());
}
```

---

Add localized messages for any new user-facing errors or validations.

## Adding Localized Messages

When adding new service methods with user-facing error messages, use the existing localization infrastructure.

### When to Add Localized Messages

**Localize:**
- ✅ New exception messages thrown to users
- ✅ New validation error messages
- ✅ New business rule violations
- ✅ User-facing status messages

**Do NOT localize:**
- ❌ Log messages (`_logger.LogInformation`, etc.)
- ❌ Debug/trace output
- ❌ Internal system messages

### Using the Existing Localizer

The service should already have `IStringLocalizer` injected (added when the feature was created):

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
using Microsoft.Extensions.Localization;
using Base2.Localization;

public class {Entity}Service
{
    private readonly IStringLocalizer _localizer;
    
    public {Entity}Service(
        AppDbContext dbContext,
        IStringLocalizer<{Namespace}ServiceResource> localizer,  // Should already exist
        ILogger<{Entity}Service> logger)
    {
        _dbContext = dbContext;
        _localizer = localizer;
        _logger = logger;
    }
}
```

**If Not Present:**

Add the localizer parameter to the constructor. The marker class should already exist for the namespace.

### Pattern for New Messages

When adding operations with user-facing errors:

```csharp
public async Task<Result> PerformNewOperationAsync(long id, OperationParams params)
{
    Record? record = await _query.TrackOrDefaultAsync(id);
    if (record is null)
    {
        // User-facing message - localized
        string message = _localizer["Entity not found."];
        throw new InvalidOperationException(message);
    }
    
    if (record.Status == "locked")
    {
        // User-facing message - localized
        string message = _localizer["Cannot perform operation on locked entity."];
        throw new InvalidOperationException(message);
    }
    
    if (!ValidateParams(params))
    {
        // User-facing message - localized with parameters
        string message = _localizer["Invalid parameter: {0}", params.Name];
        throw new ArgumentException(message);
    }
    
    // Perform operation logic
    record.Status = params.NewStatus;
    record.UpdatedAt = DateTime.UtcNow;
    
    _dbSet.Update(record);
    await _dbContext.SaveChangesAsync();
    
    // Log message - NOT localized (remains English)
    _logger.LogInformation("Performed operation on {Entity} {Id}.", id);
    
    return Result.Success();
}
```

**Key Points:**
1. Use English text as the resource key: `_localizer["English text"]`
2. Store in a variable for readability (optional)
3. Continue using `_logger` for logging (no localization)
4. The localization team will add translations to the existing resource files

**With Parameters:**

```csharp
// Simple parameter substitution
string message = _localizer["Cannot delete {0} because it has active {1}.", entityName, relationType];

// Multiple parameters
string message = _localizer[
    "Operation failed: {0} must be between {1} and {2}.", 
    fieldName, 
    minValue, 
    maxValue];
```

---

Add or update metrics for the new operations.

## Adding or Recording Metrics

Track the new operations with metrics for observability.

### For New Operations

When adding new service methods, record metrics for success and failure:

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
using Base2.Services.Observability;
using System.Diagnostics;

public async Task<Result> NewOperationAsync(long id, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        Record? record = await _query.TrackOrDefaultAsync(id, ct);
        if (record is null)
        {
            return Result.NotFound();
        }
        
        // ... operation logic ...
        
        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync(ct);
        
        // Record success metric
        _metrics.RecordOperationSuccess(operationType: "new_operation");
        
        // Record duration metric
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordOperationDuration(duration, operationType: "new_operation");
        
        return Result.Success();
    }
    catch (Exception ex)
    {
        // Record failure metric
        _metrics.RecordOperationFailed(
            errorType: ex.GetType().Name,
            operationType: "new_operation");
        throw;
    }
}
```

**Metric Recording Patterns:**

| Pattern | When | Example |
|---------|------|---------|
| After successful operation | Operation completed | `_metrics.RecordEntityCreated()` |
| In catch block | Operation failed | `_metrics.RecordOperationFailed(...)` |
| Before/after timing | Track duration | `Stopwatch.GetTimestamp()` → `.RecordDuration()` |
| Conditional success | Check result first | `if (result.Success) _metrics.Record...()` |

### For Modified Operations

Add metrics to existing methods that don't have them:

```csharp
public async Task<Model> UpdateAsync(Model model)
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
    
    // Add metrics if not already present
    _metrics.RecordEntityUpdated();
    
    return record.ToModel();
}
```

### Timing Operations

Use `Stopwatch` for precise timing:

```csharp
public async Task<Result> ComplexOperationAsync(long id, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        // ... operation logic ...
        
        // Record duration in seconds (floating-point)
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordOperationDuration(duration, operationType: "complex_operation");
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordOperationFailed(
            errorType: ex.GetType().Name,
            operationType: "complex_operation");
        throw;
    }
}
```

**Timing Best Practices:**
- ✅ Use `Stopwatch.GetTimestamp()` (most efficient)
- ✅ Use `Stopwatch.GetElapsedTime(startTime)` to calculate duration
- ✅ Record duration in **seconds** (floating-point)
- ❌ Don't use `DateTime.Now` for timing (not precise)
- ❌ Don't create new `Stopwatch()` instances (use static methods)

### Adding New Metrics (If Needed)

If you need a new metric that doesn't exist in `IObservabilityMetrics`:

#### Step 1: Add Constants

```csharp
// File: Services/src/Observability/MetricsConstants.cs
public static class MetricsConstants
{
    public const string EntityOperationCompleted = "product_name.{namespace}.operation_completed";
    
    public static class Descriptions
    {
        public const string EntityOperationCompleted = "Total operations completed for {entity}";
    }
}
```

#### Step 2: Add Interface Method

```csharp
// File: Services/src/Observability/IObservabilityMetrics.cs
public interface IObservabilityMetrics
{
    /// <summary>
    /// Records a completed operation.
    /// </summary>
    /// <param name="operationType">The type of operation (e.g., "archive", "activate").</param>
    void RecordOperationCompleted(string operationType);
}
```

#### Step 3: Create Instrument & Implement

```csharp
// File: Services/src/Observability/ObservabilityMetrics.cs
public sealed class ObservabilityMetrics : IObservabilityMetrics
{
    private readonly Counter<long> _operationCompleted;

    public ObservabilityMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create(
            MetricsConstants.MeterName,
            MetricsConstants.MeterVersion);

        // Create instrument in constructor
        _operationCompleted = _meter.CreateCounter<long>(
            MetricsConstants.EntityOperationCompleted,
            unit: "{operations}",
            description: MetricsConstants.Descriptions.EntityOperationCompleted);
    }

    // Implement method
    public void RecordOperationCompleted(string operationType)
    {
        var tags = CreateTagList(("operation.type", operationType));
        _operationCompleted.Add(1, tags);
    }
}
```

#### Step 4: Add Test

```csharp
// File: Tests/src/Observability/ObservabilityMetricsTests.cs
[Fact]
public void RecordOperationCompleted_IncrementsCounter()
{
    var services = MetricsTestHelpers.CreateServiceProvider();
    var metrics = services.GetRequiredService<IObservabilityMetrics>();
    var collector = MetricsTestHelpers.CreateCollector<long>(
        services,
        MetricsConstants.EntityOperationCompleted);

    metrics.RecordOperationCompleted("archive");

    var measurements = collector.GetMeasurementSnapshot();
    measurements.Should().HaveCount(1);
    measurements[0].Value.Should().Be(1);
    measurements[0].Tags.ToArray().Should().Contain(
        new KeyValuePair<string, object?>("operation.type", "archive"));
}
```

**Best Practices:**
- ✅ Use existing metrics when possible
- ✅ Record after successful operations
- ✅ Record failures in catch blocks
- ✅ Add tests for new metrics
- ✅ Use low-cardinality tags (< 1,000 combinations)
- ❌ Don't use high-cardinality data as tags (IDs, emails)

---

Finally, expose via controller endpoints.

## Adding Controller Endpoints

Expose the new operations via HTTP endpoints.

### Step 1: Add Action to Controller

```csharp
// File: Web/src/Controllers/{Namespace}/{Entity}Controller.cs

/// <summary>
/// Find entities by new field.
/// </summary>
[HttpGet("by-field/{value}")]
[TenantRead]
[Produces(typeof({Entity}Model[]))]
[EndpointDescription("Finds entities by the new field value.")]
public async Task<ActionResult> GetByField(string value, CancellationToken ct)
{
    if (string.IsNullOrWhiteSpace(value)) 
        return BadRequest("Value cannot be empty.");
        
    var results = await _service.FindByNewFieldAsync(value, ct);
    return Ok(results);
}

/// <summary>
/// Perform new operation on entity.
/// </summary>
[HttpPost("{id:long}/operation")]
[TenantWrite]
[Produces(typeof(Result))]
[EndpointDescription("Performs a new operation on the entity.")]
public async Task<ActionResult> PerformOperation(
    long id, 
    [FromBody] OperationParams params,
    CancellationToken ct)
{
    if (id <= 0) 
        return BadRequest("Invalid ID.");
        
    if (params is null) 
        return BadRequest("Parameters required.");
        
    var result = await _service.PerformNewOperationAsync(id, params, ct);
    
    return result.Success 
        ? Ok(result) 
        : StatusCode((int)result.StatusCode, result);
}

/// <summary>
/// Archive an entity.
/// </summary>
[HttpPost("{id:long}/archive")]
[TenantWrite]
[Produces(typeof(Result))]
[EndpointDescription("Archives the entity.")]
public async Task<ActionResult> Archive(long id, CancellationToken ct)
{
    if (id <= 0) 
        return BadRequest("Invalid ID.");
        
    var result = await _service.ArchiveAsync(id, ct);
    
    return result.Success
        ? Ok(result)
        : NotFound();
}
```

**Endpoint Patterns:**

| HTTP Method | Route Pattern | Use Case |
|-------------|---------------|----------|
| `GET` | `/by-{field}/{value}` | Query by field |
| `GET` | `/{id}/detail` | Get with related data |
| `POST` | `/{id}/{action}` | Perform action |
| `PUT` | `/{id}/{property}` | Update single property |
| `DELETE` | `/{id}` | Delete entity |

**Choose Appropriate RLS Attribute:**

| Attribute | Use For | Effect |
|-----------|---------|--------|
| `[TenantRead]` | GET operations | Sets read-only RLS context |
| `[TenantWrite]` | POST, PUT, DELETE | Sets read-write RLS context |

**Response Patterns:**

```csharp
// ✅ GOOD: Explicit status codes
[HttpPost("{id:long}/activate")]
[TenantWrite]
public async Task<ActionResult> Activate(long id, CancellationToken ct)
{
    if (id <= 0) return BadRequest("Invalid ID.");
    
    var result = await _service.ActivateAsync(id, ct);
    
    return result switch
    {
        { Success: true } => Ok(result),
        { NotFound: true } => NotFound(),
        { Invalid: true } => BadRequest(result.Error),
        _ => StatusCode(500, "An error occurred.")
    };
}

// ✅ GOOD: Result object with status code
public async Task<ActionResult> PerformOperation(long id, CancellationToken ct)
{
    var result = await _service.OperationAsync(id, ct);
    return StatusCode((int)result.StatusCode, result);
}

// ❌ BAD: Throwing exceptions for control flow
public async Task<ActionResult> Activate(long id, CancellationToken ct)
{
    try
    {
        await _service.ActivateAsync(id, ct);
        return Ok();
    }
    catch (NotFoundException)
    {
        return NotFound();  // Don't use exceptions for expected cases
    }
}
```

**Validation Best Practices:**

```csharp
// ✅ GOOD: Validate at controller level
[HttpPost]
public async Task<ActionResult> Create([FromBody] EntityModel model)
{
    if (model is null) 
        return BadRequest("Model is required.");
    
    if (string.IsNullOrWhiteSpace(model.Name))
        return BadRequest("Name is required.");
    
    if (model.Name.Length > 100)
        return BadRequest("Name must be 100 characters or less.");
    
    var (userId, tenantId, groupId) = User.GetUserIdentifiers();
    var result = await _service.CreateAsync(userId, tenantId, groupId, model);
    return Ok(result);
}

// ✅ ALSO GOOD: Use model validation attributes
[HttpPost]
public async Task<ActionResult> Create([FromBody] EntityModel model)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    
    var (userId, tenantId, groupId) = User.GetUserIdentifiers();
    var result = await _service.CreateAsync(userId, tenantId, groupId, model);
    return Ok(result);
}
```

---

Update tests for the new functionality.

## Updating Tests

Add tests for the new fields, queries, and operations.

### For New Fields

Test that fields are saved, updated, and retrieved correctly:

```csharp
[Fact]
public async Task UpdateAsync_NewField_PersistsChanges()
{
    // Arrange
    var created = await CreateTestEntityAsync();
    created.NewField = "Updated Value";

    // Act
    var result = await _service.UpdateAsync(created);

    // Assert
    Assert.NotNull(result);
    Assert.Equal("Updated Value", result.NewField);
    
    // Verify persistence
    var retrieved = await _service.ReadOrDefaultAsync(created.Id);
    Assert.NotNull(retrieved);
    Assert.Equal("Updated Value", retrieved.NewField);
}

[Fact]
public async Task CreateAsync_WithNewField_SavesDefaultValue()
{
    // Arrange
    var model = new EntityModel 
    { 
        Name = "Test"
        // NewField not set - should use default
    };

    // Act
    var result = await _service.CreateAsync(
        Guid.NewGuid(),
        _fixture.TenantId,
        _fixture.GroupId,
        model);

    // Assert
    Assert.NotNull(result);
    Assert.Equal(string.Empty, result.NewField);  // Or expected default
}
```

### For New Query Methods

Test that queries return correct results:

```csharp
[Fact]
public async Task FindByNewFieldAsync_ExistingValue_ReturnsEntities()
{
    // Arrange
    var entity1 = await CreateTestEntityAsync();
    entity1.NewField = "UniqueValue";
    await _service.UpdateAsync(entity1);
    
    var entity2 = await CreateTestEntityAsync();
    entity2.NewField = "DifferentValue";
    await _service.UpdateAsync(entity2);

    // Act
    var results = await _service.FindByNewFieldAsync("UniqueValue");

    // Assert
    Assert.NotEmpty(results);
    Assert.Single(results);
    Assert.Equal(entity1.Id, results[0].Id);
}

[Fact]
public async Task FindByNewFieldAsync_NonExistingValue_ReturnsEmpty()
{
    // Arrange
    await CreateTestEntityAsync();

    // Act
    var results = await _service.FindByNewFieldAsync("NonExistingValue");

    // Assert
    Assert.Empty(results);
}

[Fact]
public async Task SearchAsync_IncludesNewField_ReturnsMatches()
{
    // Arrange
    var entity = await CreateTestEntityAsync();
    entity.NewField = "SearchableContent";
    await _service.UpdateAsync(entity);

    // Act
    var results = await _service.SearchAsync("Searchable");

    // Assert
    Assert.NotEmpty(results);
    Assert.Contains(results, r => r.Id == entity.Id);
}
```

### For New Operations

Test success cases, failure cases, and edge cases:

```csharp
[Fact]
public async Task PerformNewOperationAsync_ValidId_Succeeds()
{
    // Arrange
    var entity = await CreateTestEntityAsync();
    var params = new OperationParams { NewStatus = "Active" };

    // Act
    var result = await _service.PerformNewOperationAsync(entity.Id, params);

    // Assert
    Assert.True(result.Success);
    
    // Verify operation took effect
    var updated = await _service.ReadOrDefaultAsync(entity.Id);
    Assert.NotNull(updated);
    Assert.Equal("Active", updated.Status);
}

[Fact]
public async Task PerformNewOperationAsync_InvalidId_ReturnsNotFound()
{
    // Arrange
    var params = new OperationParams { NewStatus = "Active" };

    // Act
    var result = await _service.PerformNewOperationAsync(999999, params);

    // Assert
    Assert.False(result.Success);
    Assert.True(result.NotFound);
}

[Fact]
public async Task PerformNewOperationAsync_InvalidState_ReturnsError()
{
    // Arrange
    var entity = await CreateTestEntityAsync();
    entity.Status = "Locked";
    await _service.UpdateAsync(entity);
    
    var params = new OperationParams { NewStatus = "Active" };

    // Act & Assert
    await Assert.ThrowsAsync<InvalidOperationException>(
        () => _service.PerformNewOperationAsync(entity.Id, params));
}
```

### Test Organization

```csharp
public class {Entity}ServiceTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;
    private readonly {Entity}Service _service;

    public {Entity}ServiceTests(TestFixture fixture)
    {
        _fixture = fixture;
        _service = CreateService();
    }
    
    private {Entity}Service CreateService()
    {
        return new {Entity}Service(
            _fixture.DbContext,
            _fixture.GetRequiredService<IObservabilityMetrics>(),
            _fixture.GetRequiredService<IStringLocalizer<NamespaceServiceResource>>(),
            _fixture.Logger<{Entity}Service>());
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
    
    // Group related tests with regions or nested classes
    #region New Field Tests
    
    [Fact]
    public async Task NewField_Tests() { /* ... */ }
    
    #endregion
    
    #region New Operation Tests
    
    [Fact]
    public async Task NewOperation_Tests() { /* ... */ }
    
    #endregion
}
```

---

Update tracking documents to reflect the changes.

## Update Tracking Documents

After implementing modifications, update the appropriate tracking documents.

### For Field Additions

Usually **don't** require tracking document updates unless part of a user story.

### For New Operations

Update if the operation fulfills a user story:

#### Update User Stories

Location: `llm/prd/11-roadmap/mvp-user-stories.md`

```markdown
Before:
- [ ] As a user, I can archive inactive contacts

After:
- [x] As a user, I can archive inactive contacts
  - Completed: 2025-12-21
  - PR: #789
```

#### Update Feature PRD (If Exists)

Location: `llm/prd/06-feature-requirements/mvp/{feature}.md`

Update implementation status in the feature document if it exists.

### Update GitHub Issues

**⚠️ Confirm with user before closing or modifying issues.**

```bash
# Find related issues
gh issue list --search "archive contacts" --state open

# Add progress comment
gh issue comment <number> --body "Added archive operation. PR #789"

# Or close if complete (after user confirmation)
gh issue close <number> --comment "Completed in PR #789"
```

### When to Update What

| Change Type | User Stories | Feature PRD | GitHub Issues |
|-------------|--------------|-------------|---------------|
| New field (internal) | ❌ No | ❌ No | ❌ No |
| New field (user-facing) | ✅ If story exists | ✅ If PRD exists | ✅ Yes |
| New query method | ❌ No | ❌ No | ❌ No |
| New operation | ✅ Yes | ✅ If PRD exists | ✅ Yes |
| Bug fix | ❌ No | ❌ No | ✅ Yes |

---

## Common Modification Patterns

Quick reference for common modification scenarios.

### Adding Enum Field

```csharp
// 1. Add enum property to Model
public string Status { get; set; } = ContactStatus.Active.Id;

// 2. No entity changes needed (inherited)

// 3. Update Entity's OnModelCreating
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.Status)
        .HasColumnName("status")
        .HasMaxLength(50)
        .IsRequired();
}

// 4. Update UpdateFrom in mapper
record.Status = model.Status;

// 5. Add query method (if needed)
public Task<{Entity}[]> FindByStatusAsync(string status, CancellationToken ct = default)
    => DbSet.Where(e => e.Status == status).ToArrayAsync(ct);

// 6. Create migration
cd src/Base2.Data/src
./add-sqlite-app-migration.sh Add{Entity}Status
```

### Adding Foreign Key Relationship

```csharp
// 1. Add FK to Model
public long RelatedId { get; set; }

// 2. Add navigation to Entity
public RelatedEntity Related { get; set; } = null!;

// 3. Update Entity's OnModelCreating
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.RelatedId)
        .HasColumnName("related_id")
        .IsRequired();

    modelBuilder.Entity<{Entity}>()
        .HasOne(e => e.Related)
        .WithMany()
        .HasForeignKey(e => e.RelatedId)
        .IsRequired();
}

// 4. Update mapper - ignore navigation property
[MapperIgnoreSource(nameof(Record.Related))]  // ToModel
[MapperIgnoreTarget(nameof(Record.Related))]  // ToRecord

// 5. Add private mapper for detail model (if needed)
private static RelatedModel MapToRelatedModel(RelatedEntity source) 
    => RelatedMapper.ToModel(source);

// 6. Update UpdateFrom (usually FK only, not navigation)
record.RelatedId = model.RelatedId;

// 7. Create migration
cd src/Base2.Data/src
./add-sqlite-app-migration.sh Add{Entity}RelatedId
```

### Adding Computed/Display Field

```csharp
// 1. Add to Model only (not stored in database)
public string DisplayName => $"{FirstName} {LastName}";

// 2. Mark as computed in Entity
[NotMapped]
public string DisplayName => $"{FirstName} {LastName}";

// 3. No DbContext changes needed (not a column)

// 4. No mapper changes needed (computed on access)

// 5. No migration needed (not stored)
```

### Adding Nullable vs Non-Nullable Field

```csharp
// Non-nullable field on existing table
// 1. Add to Model with default value
public string NewField { get; set; } = string.Empty;

// 2. Configure in Entity's OnModelCreating with default
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.NewField)
        .HasColumnName("new_field")
        .HasMaxLength(100)
        .IsRequired()
        .HasDefaultValue(string.Empty);  // Important for existing rows
}

// 3. Migration will include default
migrationBuilder.AddColumn<string>(
    name: "new_field",
    table: "entity",
    nullable: false,
    defaultValue: "");

// OR nullable field
// 1. Add to Model as nullable
public string? OptionalField { get; set; }

// 2. Configure in Entity's OnModelCreating
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.OptionalField)
        .HasColumnName("optional_field")
        .HasMaxLength(100)
        .IsRequired(false);  // Nullable
}

// 3. Migration allows null
migrationBuilder.AddColumn<string>(
    name: "optional_field",
    table: "entity",
    nullable: true);
```

### Adding Boolean Flag

```csharp
// 1. Add to Model with default
[Display(Name = "Is Active")]
public bool IsActive { get; set; } = true;

// 2. Configure in Entity's OnModelCreating
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.IsActive)
        .HasColumnName("is_active")
        .IsRequired()
        .HasDefaultValue(true);
}

// 3. Add query method
public Task<{Entity}[]> FindActiveAsync(CancellationToken ct = default)
    => DbSet.Where(e => e.IsActive).ToArrayAsync(ct);

// 4. Add toggle operation in service
public async Task<Result> ToggleActiveAsync(long id, CancellationToken ct = default)
{
    var record = await _query.TrackOrDefaultAsync(id, ct);
    if (record is null) return Result.NotFound();
    
    record.IsActive = !record.IsActive;
    record.UpdatedAt = DateTime.UtcNow;
    
    _dbSet.Update(record);
    await _dbContext.SaveChangesAsync(ct);
    
    return Result.Success();
}

// 5. Create migration
cd src/Base2.Data/src
./add-sqlite-app-migration.sh Add{Entity}IsActive
```

### Adding JSON Column

```csharp
// 1. Add to Model
public Dictionary<string, string> Metadata { get; set; } = new();

// 2. Configure in Entity's OnModelCreating
public static void OnModelCreating(ModelBuilder modelBuilder)
{
    // Existing configuration...
    
    modelBuilder.Entity<{Entity}>().Property(e => e.Metadata)
        .HasColumnName("metadata")
        .HasColumnType("jsonb");  // PostgreSQL JSONB
}

// 3. Query JSON data
public Task<{Entity}[]> FindByMetadataKeyAsync(string key, CancellationToken ct = default)
    => DbSet
        .Where(e => EF.Functions.JsonContains(e.Metadata, key))
        .ToArrayAsync(ct);

// 4. Create migration
cd src/Base2.Data/src
./add-sqlite-app-migration.sh Add{Entity}Metadata
```

---

## Implementation Checklist

### For New Fields
- [ ] Added to Model (if API-exposed)
- [ ] Added to Entity (or inherited from Model)
- [ ] Updated entity's `OnModelCreating` configuration
- [ ] Updated mapper ignores (if internal/computed)
- [ ] Updated UpdateFrom method (if updatable)
- [ ] Created migration
- [ ] Updated tests

### For New Query Methods
- [ ] Added to Query class
- [ ] Added to Service (if needed)
- [ ] Added to Controller (if needed)
- [ ] Added tests

### For New Operations
- [ ] Added query method (if needed)
- [ ] Added service method
- [ ] Added localized messages (if user-facing errors)
- [ ] Added metrics recording
- [ ] Added controller endpoint
- [ ] Added appropriate RLS attribute
- [ ] Added tests

### For New Metrics
- [ ] Added constants
- [ ] Added interface method
- [ ] Implemented in ObservabilityMetrics
- [ ] Added unit tests
- [ ] Recorded in service methods

### Tracking
- [ ] User stories updated (if applicable)
- [ ] Feature PRD updated (if applicable)
- [ ] GitHub issues updated (with user confirmation)

---

## Backlinks for Deep Dives

- [Server Feature Template](../patterns/server/server-feature-template.md) - Full feature reference
- [Server Entity Workflow](./server-entity.md) - Adding new entities
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
- [Localization Pattern](../patterns/server/localization-pattern.md) - Comprehensive reference
- [Metrics Instrumentation Pattern](../patterns/server/metrics-instrumentation-pattern.md) - Comprehensive metrics guide
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md) - Testing strategies
- [RLS Patterns](../patterns/server/rls-patterns.md) - Row-level security details
