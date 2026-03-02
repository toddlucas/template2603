# Server Component Quick Reference

## 🏗️ File Structure
```
Lexy.Contracts/src/{Namespace}/
├── {Entity}Model.cs           # Basic DTO
└── {Entity}DetailModel.cs     # DTO with relations + ITemporal

Lexy.Data/src/{Namespace}/
├── {Entity}.cs                # EF Entity + OnModelCreating
├── {Entity}Query.cs           # Query methods
└── {Entity}Mapper.cs          # Mapperly mappings

Lexy.Services/src/{Namespace}/
└── {Entity}Service.cs         # Business logic + CRUD

Lexy.Web/src/Controllers/{Namespace}/
└── {Entity}Controller.cs      # HTTP endpoints
```

## 📝 Naming Conventions

| Component | Pattern | Example |
|-----------|---------|---------|
| **Entity** | `{Entity}` | `Author`, `Book` |
| **Model** | `{Entity}Model` | `AuthorModel` |
| **Detail Model** | `{Entity}DetailModel` | `AuthorDetailModel` |
| **Service** | `{Entity}Service` | `AuthorService` |
| **Controller** | `{Entity}Controller` | `AuthorController` |
| **Query** | `{Entity}Query` | `AuthorQuery` |
| **Mapper** | `{Entity}Mapper` | `AuthorMapper` |
| **Table** | `{entity}` (snake_case) | `author`, `book` |
| **Column** | `{property}` (snake_case) | `id`, `author_id`, `created_at` |
| **DbSet** | `{Entity}s` (plural) | `Authors`, `Books` |

## 🔧 Type Aliases (Standard)
```csharp
using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;
using Record = {Entity};  // For OnModelCreating
```

## 🎯 TypeScript Generation (TypeGen)
```csharp
// Add to AppGenerationSpec.cs
AddInterface<{Entity}Model>();
AddInterface<{Entity}DetailModel>();
```
**Output**: `src/client/lib/src/models/{entity}-model.ts`

## 📋 Standard Operations

### Service Methods
```csharp
// Read operations (no user/tenant/group params - RLS handles isolation)
Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken)
Task<DetailModel?> ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken)
Task<Model[]> ListAsync(CancellationToken cancellationToken)

// Create operations (need identity context to set on entity)
Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)

// Update/Delete (RLS handles isolation, no identity params needed)
Task<Model?> UpdateAsync(Model model)
Task<bool> DeleteAsync(long id)
```

### Parameter Ordering Convention
For create operations: **userId → tenantId → groupId → data**

| Parameter | When to Include |
|-----------|-----------------|
| `userId` | Create (for ownership), or when business logic needs user context |
| `tenantId` | **Create only** - set on new entity for RLS |
| `groupId` | **Create only** - set on new entity for group isolation |

Controllers extract from claims and pass only what's needed:
```csharp
// Create - needs all identity context
var (userId, tenantId, groupId) = User.GetUserIdentifiers();
var result = await _service.CreateAsync(userId, tenantId, groupId, model);

// Update/Delete - RLS handles isolation
var result = await _service.UpdateAsync(model);
```

### Query Methods
```csharp
Task<Record?> SingleOrDefaultAsync(long id, CancellationToken cancellationToken = default)
Task<Record?> TrackOrDefaultAsync(long id, CancellationToken cancellationToken = default)
Task<Record?> SingleDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default)
Task<Record?> TrackDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default)
Task<Record[]> ListAsync(CancellationToken cancellationToken = default)
```

### HTTP Endpoints
| Method | Route | Action | Returns |
|--------|-------|--------|---------|
| `GET` | `/{id:long}` | Get single | `DetailModel` |
| `GET` | `/` | List all | `Model[]` |
| `POST` | `/` | Create | `Model` |
| `PUT` | `/` | Update | `Model` |
| `DELETE` | `/{id:long}` | Delete | `NoContent` |

## 🚀 Quick Start Templates

### 1. Basic Model
```csharp
namespace Lexy.{Namespace};

public class {Entity}Model
{
    [Display(Name = "ID")]
    public long Id { get; set; }

    [Display(Name = "{Property}")]
    public string {Property} { get; set; } = null!;
}

public class {Entity}DetailModel : {Entity}Model, ITemporal
{
    public List<{RelatedEntity}Model> {RelatedEntities} { get; set; } = new();
    
    #region ITemporal
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    #endregion
}
```

### 2. Entity
```csharp
namespace Lexy.{Namespace};
using Record = {Entity};

public class {Entity} : {Entity}Model, ITemporalRecord
{
    public string? InternalId { get; set; }
    public ICollection<{RelatedEntity}> {RelatedEntities} { get; set; } = <{RelatedEntity}>;
    
    #region ITemporalRecord
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; } // Internal-only
    #endregion

    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Record>().ToTable(nameof({Entity}));
        modelBuilder.Entity<Record>().Property(x => x.Id).HasColumnName("id");
        modelBuilder.Entity<Record>().Property(x => x.{Property}).HasColumnName("{property}");
        modelBuilder.Entity<Record>().HasIndex(b => b.{Property});
    }
}
```

### 3. Query
```csharp
namespace Lexy.{Namespace};
using Record = {Entity};

public record {Entity}Query(DbSet<Record> DbSet, ILogger logger)
{
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken cancellationToken = default) => 
        DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(cancellationToken);

    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken cancellationToken = default) => 
        DbSet.AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(cancellationToken);

    public Task<Record[]> ListAsync(CancellationToken cancellationToken = default) => 
        DbSet.ToArrayAsync(cancellationToken);
}
```

### 4. Mapper
```csharp
namespace Lexy.{Namespace};
using Record = {Entity}; using Model = {Entity}Model; using DetailModel = {Entity}DetailModel;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
    [MapperIgnoreSource(nameof(Record.InternalId), nameof(Record.{RelatedEntities}), 
                       nameof(Record.CreatedAt), nameof(Record.UpdatedAt), nameof(Record.DeletedAt))]
    public static partial Model ToModel(this Record source);

    [MapperIgnoreSource(nameof(Record.InternalId), nameof(Record.DeletedAt))] // Internal-only
    // DO NOT use [MapperIgnoreTarget] for navigation properties in DetailModels
    public static partial DetailModel ToDetailModel(this Record source);

    public static partial Model[] ToModels(this IEnumerable<Record> source);
    public static partial DetailModel[] ToDetailModels(this IEnumerable<Record> source);
    public static partial Record ToRecord(this Model source);

    public static void UpdateFrom(this Record record, Model model)
    {
        record.{Property} = model.{Property};
    }
}
```

### 5. Service
```csharp
namespace Lexy.{Namespace};
using Record = {Entity}; using Model = {Entity}Model; using DetailModel = {Entity}DetailModel;

public class {Entity}Service(LexyDbContext dbContext, ILogger<{Entity}Service> logger)
{
    private readonly ILogger _logger = logger;
    private readonly LexyDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.{Entity}s;
    private readonly {Entity}Query _query = new(dbContext.{Entity}s, logger);

    public async Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken)
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
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;
        _dbSet.Add(record);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Created {entity} {EntityId}.", record.Id);
        return record.ToModel();
    }
}
```

### 6. Controller
```csharp
namespace Lexy.Controllers.{Namespace};

[Route("api/[area]/[controller]")]
[Area(nameof({Namespace}))]
[Tags(nameof({Namespace}))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class {Entity}Controller(ILogger<{Entity}Controller> logger, {Entity}Service {entity}Service) : ControllerBase
{
    private readonly {Entity}Service _{entity}Service = {entity}Service;

    [HttpGet("{id:long}")]
    [TenantRead]
    [Produces(typeof({Entity}DetailModel))]
    public async Task<ActionResult> Get(long id, CancellationToken cancellationToken)
    {
        if (id <= 0) return BadRequest();
        var result = await _{entity}Service.ReadDetailOrDefaultAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [TenantWrite]
    public async Task<ActionResult> Post({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var (userId, tenantId, groupId) = User.GetUserIdentifiers();
        var result = await _{entity}Service.CreateAsync(userId, tenantId, groupId, model);
        return Ok(result);
    }
}
```

## ⚡ Essential Attributes

### Models
```csharp
[Display(Name = "Friendly Name")]
[Description("RFC 3339 timestamp description")]
```

### Mappers
```csharp
[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
[MapperIgnoreSource(nameof(Record.PropertyName))]
[MapperIgnoreTarget(nameof(Record.PropertyName))]
```

### Controllers
```csharp
[Route("api/[area]/[controller]")]
[Area(nameof(Namespace))]
[Tags(nameof(Namespace))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
[HttpGet("{id:long}")]
[Produces(typeof(Model))]
[EndpointDescription("Description text")]
```

## 🔗 Relationships

### One-to-Many Setup
```csharp
// Parent Entity
public ChildEntity[] ChildEntities { get; set; } = [];

// Child Entity  
public long ParentEntityId { get; set; }
public ParentEntity ParentEntity { get; set; } = null!;

// EF Configuration
modelBuilder.Entity<ChildEntity>()
    .HasOne(x => x.ParentEntity)
    .WithMany(y => y.ChildEntities)
    .HasForeignKey(x => x.ParentEntityId)
    .IsRequired();
```

## 🛠️ Registration Checklist

### DbContext
```csharp
// Add DbSet
public DbSet<{Entity}> {Entity}s { get; set; } = null!;

// Add to OnModelCreating
{Entity}.OnModelCreating(modelBuilder);
```

### Services
```csharp
// Add to IServiceCollectionExtensions
serviceCollection.AddScoped<{Entity}Service>();
```

### TypeScript Generation
```csharp
// Add to AppGenerationSpec.cs
AddInterface<{Entity}Model>();
AddInterface<{Entity}DetailModel>();
```

## 🚨 Common Patterns

### Error Handling
```csharp
// Service Layer
return record?.ToModel();  // null for not found
return false;              // for failed operations

// Controller Layer
if (id <= 0) return BadRequest();
if (model is null) return BadRequest();
return result is null ? NotFound() : Ok(result);
return NoContent();  // for successful deletes
```

### Timestamps
```csharp
// Create
record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

// Update  
record.UpdatedAt = DateTime.UtcNow;

// Soft Delete (internal-only)
record.DeletedAt = DateTime.UtcNow;
```

### Temporal Pattern
- **Detail Models**: Implement `ITemporal` (exposes `CreatedAt`, `UpdatedAt` to API)
- **Entities**: Implement `ITemporalRecord` (includes internal `DeletedAt`)
- **Basic Models**: No temporal interfaces (no audit fields in API)
- **`DeletedAt`**: Always internal-only, never exposed via API

### Logging
```csharp
_logger.LogInformation("Created {entityName} {EntityId}.", record.Id);
_logger.LogInformation("Updated {entityName} {EntityId}.", record.Id);
_logger.LogInformation("Deleted {entityName} {EntityId}.", id);
```

## 🔧 Migration Commands
```bash
cd src/server/Lexy.Data.Npgsql
dotnet ef migrations add Add{Entity}Entity
dotnet ef database update
```

## Configuration

We use the .NET Core Options pattern for configuration.

## 🐛 Quick Troubleshooting

| Issue | Check |
|-------|-------|
| **Migration fails** | Entity configuration, relationships |
| **Mapping errors** | Mapperly attributes, property names |
| **DI errors** | Service registration in IServiceCollectionExtensions |
| **Auth fails** | Policy configuration, controller attributes |
| **Performance** | Indexes, Include statements, AsTracking usage |

## 📚 Reference Links
- **Full Architecture Guide**: `doc/patterns/server-architecture-patterns.md`
- **Implementation Template**: `doc/patterns/server-component-template.md`
- **Mapper Patterns**: `doc/patterns/server/mapper-patterns.md` 