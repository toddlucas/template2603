# Fullstack Feature Workflow

Complete workflow for building a feature end-to-end: server API followed by client UI.

## Prerequisites

Before starting, determine:

**Server:**
1. Namespace (Access, Business, Prospecting, etc.)
2. Database (App or Warehouse)
3. Entity name (singular, PascalCase)

**Client:**
4. Which app (web, admin, common)
5. Feature namespace (should match server)

## Server Code Style Conventions

### Using Statement Organization

**Placement**: Using statements go **above** the namespace declaration. Type aliases go **after** the namespace.

Group `using` statements with blank lines between groups:
1. **System** namespaces (`System.*`)
2. **Microsoft** namespaces (`Microsoft.*`)
3. **Third-party** namespaces (e.g., `Riok.Mapperly`)
4. **Project** namespaces (`Base2.*`)

```csharp
using System.Text.Json;

using Microsoft.EntityFrameworkCore;

using Riok.Mapperly.Abstractions;

using Base2.Infrastructure;

namespace Base2.Interaction;

using Record = IncomingReply;
using Model = IncomingReplyModel;
```

### Namespace Organization (Vertical Slices)

**Rule**: Keep namespaces "vertically integrated" - **no intermediate layer namespaces** like `.Data`, `.Services`, or `.BackgroundJobs`.

All files for a feature use the same namespace across projects:
- `Base2.Contracts/src/{Namespace}/` → `Base2.{Namespace}`
- `Base2.Data/src/{Namespace}/` → `Base2.{Namespace}`
- `Base2.Services/src/{Namespace}/` → `Base2.{Namespace}`
- `Base2.Web/src/Controllers/{Namespace}/` → `Base2.Controllers.{Namespace}` (exception)

**❌ Don't**: `namespace Base2.Services.Prospecting;`  
**✅ Do**: `namespace Base2.Prospecting;`

## File Structure Overview

**Server:**
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

**Client:**
```
client/{app}/src/features/{feature}/
├── api/{entity}Api.ts
├── components/{entity}/
│   ├── {Entity}List.tsx
│   └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts
│   └── {Entity}Service.ts
├── views/
│   ├── {Entity}Page.tsx
│   └── {Feature}TestPage.tsx
├── locales/
│   ├── de.jsonc, el.jsonc, en.jsonc, es.jsonc, fr.jsonc
│   └── index.ts
└── index.ts
```

---

# Part 1: Server

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

    public RelatedEntity Related { get; set; } = null!;

    #endregion Navigation properties

    #region ITemporalRecord

    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

    [Display(Name = "Updated At")]
    public DateTime UpdatedAt { get; set; }

    [Display(Name = "Deleted At")]
    public DateTime? DeletedAt { get; set; }

    #endregion ITemporalRecord
}
```

### 1.3 DbContext Registration

```csharp
// File: Data/src/{DbContext}.cs

// Add DbSet property
public DbSet<{Entity}> {Entities} { get; set; } = null!;

// In OnModelCreating
modelBuilder.Entity<{Entity}>(entity =>
{
    entity.ToTable("{entity}");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
    entity.Property(e => e.CreatedAt).HasColumnName("created_at");
    entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
    entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
    entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
});
```

---

## Step 2: Queries

> **Note:** Generate XML doc comments for all public methods.

```csharp
// File: Data/src/{Namespace}/{Entity}Query.cs
public record {Entity}Query(DbSet<{Entity}> DbSet, ILogger logger)
{
    public Task<{Entity}?> SingleOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    public Task<{Entity}?> TrackOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    public Task<{Entity}?> SingleDetailOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Include(e => e.Related).Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    public Task<{Entity}[]> ListAsync(CancellationToken ct = default) 
        => DbSet.ToArrayAsync(ct);

    public Task<{Entity}[]> GetPagedAsync(int skip, int take, CancellationToken ct = default) 
        => DbSet.OrderByDescending(e => e.CreatedAt).Skip(skip).Take(take).ToArrayAsync(ct);
}
```

---

## Step 3: Mappers

> **Note:** Generate XML doc comments. Use `<remarks>` to document exclusions.

> **Note:** Always include the using aliases for `Record`, `Model`, and `DetailModel`. This keeps mappers consistent and maintainable.

```csharp
// File: Data/src/{Namespace}/{Entity}Mapper.cs
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.CreatedAt))]
    [MapperIgnoreSource(nameof(Record.UpdatedAt))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    [MapperIgnoreSource(nameof(Record.NavigationProperty))]
    public static partial Model ToModel(this Record source);

    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    public static partial DetailModel ToDetailModel(this Record source);

    public static partial Model[] ToModels(this IEnumerable<Record> source);

    [MapperIgnoreTarget(nameof(Record.TenantId))]
    [MapperIgnoreTarget(nameof(Record.CreatedAt))]
    [MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    [MapperIgnoreTarget(nameof(Record.DeletedAt))]
    [MapperIgnoreTarget(nameof(Record.NavigationProperty))]
    public static partial Record ToRecord(this Model source);

    public static void UpdateFrom(this Record record, Model model)
    {
        record.Field1 = model.Field1;
        record.Field2 = model.Field2;
    }
}
```

---

## Step 4: Services

> **Note:** Generate XML doc comments for all public methods.

> **Note:** Always include the using aliases for `Record`, `Model`, and `DetailModel`. This keeps services consistent and maintainable.

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

public class {Entity}Service(
    WarehouseDbContext dbContext,
    ILogger<{Entity}Service> logger)
{
    private readonly ILogger _logger = logger;
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.{Entities};
    private readonly {Entity}Query _query = new(dbContext.{Entities}, logger);

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

    public async Task<Model?> UpdateAsync(Model model)
    {
        Record? record = await _query.TrackOrDefaultAsync(model.Id);
        if (record is null) return null;

        record.UpdateFrom(model);
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();
        return record.ToModel();
    }

    public async Task<bool> DeleteAsync(long id)
    {
        Record? record = await _query.TrackOrDefaultAsync(id);
        if (record is null) return false;

        record.DeletedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<Record> queryable = _dbSet.AsQueryable();

        query.Search((term) =>
        {
            queryable = queryable
                .Where(e => e.Name.ToLower().Contains(term));
        });

        Record[] records = await queryable
            .OrderByPage(query, nameof(Record.CreatedAt))
            .Paginate(query, out int count)
            .ToArrayAsync(cancellationToken);

        return PagedResult.Create(records.ToModels(), count, (string?)null);
    }
}
```

### DI Registration

```csharp
// File: Services/src/Extensions/IServiceCollectionExtensions.cs
services.AddScoped<{Entity}Service>();
```

---

## Step 5: Controllers

> **Note:** Generate XML doc comments. Use `[EndpointDescription]` for OpenAPI.

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

---

## Step 6: RLS Setup

1. **Entity has TenantId** ✓
2. **Service sets TenantId on create** ✓
3. **Controller uses RLS attributes** ✓
4. **Register table for RLS**:

```csharp
// In RlsPolicyManager.cs
public static readonly string[] TablesWithTenantOnly = 
[
    // existing tables...
    "{entity}",
];
```

---

## Step 7: Server Testing

> **Note:** Create tests in `Base2.Tests` project.

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
        var model = new {Entity}Model { Name = "Test" };
        var result = await _service.CreateAsync(
            Guid.NewGuid(), _fixture.TenantId, _fixture.GroupId, model);
        
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task ReadOrDefaultAsync_NonExistingId_ReturnsNull()
    {
        var result = await _service.ReadOrDefaultAsync(999999);
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_ExistingEntity_ReturnsTrue()
    {
        var created = await CreateTestEntityAsync();
        var result = await _service.DeleteAsync(created.Id);
        Assert.True(result);
    }

    private async Task<{Entity}Model> CreateTestEntityAsync()
    {
        var model = new {Entity}Model { Name = $"Test_{Guid.NewGuid()}" };
        return await _service.CreateAsync(
            Guid.NewGuid(), _fixture.TenantId, _fixture.GroupId, model);
    }
}
```

---

## Part 2: Client

With the server API complete and tested, build the client to consume it.

**Verify before proceeding:**
- [ ] Server endpoints return expected data
- [ ] Swagger/OpenAPI shows correct schemas
- [ ] TypeScript types generated (if using TypeGen)

---

## Step 8: Client Localization

### Create Language Files

Create all 5 files in `features/{feature}/locales/`:

```jsonc
// en.jsonc
{
    "Feature Name": "Feature Name",
    "Entity Name": "Entity Name",
    "Field Label": "Field Label",
    "Created successfully": "Created successfully",
    "Error loading": "Error loading",
    "Add Entity": "Add Entity",
    "Edit Entity": "Edit Entity"
}
```

```bash
cp en.jsonc de.jsonc && cp en.jsonc el.jsonc && cp en.jsonc es.jsonc && cp en.jsonc fr.jsonc
```

### Generate Initial Translations

Once English keys are finalized, translate values in each language file. Mark AI-generated translations for human review:

```jsonc
// de.jsonc
{
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "Feature Name": "Funktionsname",
    "Entity Name": "Entitätsname",
    "Created successfully": "Erfolgreich erstellt"
}
```

> **Review markers:** `REVIEW: AI_TRANSLATED` indicates AI-generated translations needing native speaker review. Remove the comment after verification.

### Create Locale Index

```typescript
// locales/index.ts
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const {feature} = {
  de: { {feature}: de },
  el: { {feature}: el },
  en: { {feature}: en },
  es: { {feature}: es },
  fr: { {feature}: fr },
};
```

### Register in App

```typescript
// {app}/src/features/locales.ts
import { {feature} } from "../features/{feature}/locales";

export const features = {
  de: { ...existing.de, ...{feature}.de },
  el: { ...existing.el, ...{feature}.el },
  en: { ...existing.en, ...{feature}.en },
  es: { ...existing.es, ...{feature}.es },
  fr: { ...existing.fr, ...{feature}.fr },
};
```

---

## Step 9: Client API & Service

### API Client

```typescript
// api/{entity}Api.ts
import { getModel, postModel, putModel, del, makePageQueryString, type Result } from '$/api';
import type { EntityModel, PagedResult, PagedQuery } from '$/models';

export const {entity}Api = {
  get: (id: number): Promise<Result<EntityModel, Response>> =>
    getModel<EntityModel>(`/api/{namespace}/{entity}/${id}`),

  list: (query: PagedQuery): Promise<Result<PagedResult<EntityModel>, Response>> =>
    getModel<PagedResult<EntityModel>>(
      `/api/{namespace}/{entity}${makePageQueryString(query)}`
    ),

  create: (model: Omit<EntityModel, 'id'>): Promise<Result<EntityModel, Response>> =>
    postModel(`/api/{namespace}/{entity}`, model),

  update: (model: EntityModel): Promise<Result<EntityModel, Response>> =>
    putModel(`/api/{namespace}/{entity}`, model),

  delete: (id: number): Promise<Response> =>
    del(`/api/{namespace}/{entity}/${id}`),
};
```

### Service

```typescript
// services/I{Entity}Service.ts
export interface I{Entity}Service {
  get(id: number): Promise<EntityModel>;
  list(query: PagedQuery): Promise<PagedResult<EntityModel>>;
  create(model: Omit<EntityModel, 'id'>): Promise<EntityModel>;
  update(model: EntityModel): Promise<EntityModel>;
  delete(id: number): Promise<void>;
}

// services/{Entity}Service.ts
@injectable()
export class {Entity}Service implements I{Entity}Service {
  async get(id: number): Promise<EntityModel> {
    const result = await {entity}Api.get(id);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to get');
    return result.value;
  }

  async list(query: PagedQuery): Promise<PagedResult<EntityModel>> {
    const result = await {entity}Api.list(query);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to list');
    return result.value;
  }

  async create(model: Omit<EntityModel, 'id'>): Promise<EntityModel> {
    const result = await {entity}Api.create(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to create');
    return result.value;
  }

  async update(model: EntityModel): Promise<EntityModel> {
    const result = await {entity}Api.update(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to update');
    return result.value;
  }

  async delete(id: number): Promise<void> {
    const response = await {entity}Api.delete(id);
    if (!response.ok) throw await ApiError.fromResponse(response, 'Failed to delete');
  }
}
```

### DI Registration

```typescript
// platform/di/types.ts
export const TYPES = {
  {Entity}Service: Symbol.for('{Entity}Service'),
} as const;

// platform/di/container.ts
container.bind<I{Entity}Service>(TYPES.{Entity}Service)
  .to({Entity}Service)
  .inSingletonScope();
```

---

## Step 10: Client Components

### List Component

```tsx
// components/{entity}/{Entity}List.tsx
import { useTranslation } from 'react-i18next';
import { useContainer } from '$/platform/di/ContainerContext';
import { TYPES } from '$/platform/di/types';

export const {Entity}List: React.FC = () => {
  const { t } = useTranslation("{feature}");
  const container = useContainer();
  const service = container.get<I{Entity}Service>(TYPES.{Entity}Service);

  const [items, setItems] = useState<EntityModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await service.list({ page: 1, limit: 10 });
      setItems(result.data);
    } catch (err) {
      setError(t("Error loading"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (items.length === 0) return <div>{t("No items found")}</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("Field Label")}</TableHead>
          <TableHead>{t("Actions", { ns: "common" })}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">{t("Edit", { ns: "common" })}</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

---

## Step 11: Client Routing

### Create Pages

```tsx
// views/{Entity}Page.tsx
const {Entity}Page: React.FC = () => {
  const { t } = useTranslation("{feature}");
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("Entity Name")}</h1>
      <{Entity}List />
    </div>
  );
};
export default {Entity}Page;
```

```tsx
// views/{Feature}TestPage.tsx
const {Feature}TestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{Feature} Test Page</h1>
      <{Entity}List />
    </div>
  );
};
export default {Feature}TestPage;
```

### Register Routes

```tsx
// {app}/src/routes/index.tsx
<Route path="{feature}/{entity}" element={<{Entity}Page />} />
<Route path="test/{feature}" element={<{Feature}TestPage />} />
```

### Add Sidebar Navigation

```typescript
// {app}/src/constants/sidebar-data.ts
{
  title: "{Entity}s",
  path: "/{feature}/{entity}",
  icon: Users,
},
```

---

## Part 3: Integration

### End-to-End Testing

1. **Start both servers** (if not running)
2. **Navigate to test page**: `/test/{feature}`
3. **Verify operations**:
   - [ ] List loads data from API
   - [ ] Create adds new record
   - [ ] Update modifies existing record
   - [ ] Delete removes record
   - [ ] Error states display correctly
   - [ ] Loading states display correctly

### Common Integration Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| 401 Unauthorized | Missing/invalid token | Check auth setup, token refresh |
| 404 Not Found | Wrong API path | Verify route in controller vs client |
| CORS error | Server CORS config | Add origin to allowed list |
| Type mismatch | Stale TypeScript types | Regenerate with update-models.cmd |
| Empty response | RLS filtering | Verify TenantId matches |

---

## Step 12: Update Tracking Documents

| Document | Location |
|----------|----------|
| User Stories | `doc/prd/11-roadmap/mvp-user-stories.md` |
| Feature PRD | `doc/prd/06-feature-requirements/mvp/{feature}.md` |
| Current State | `doc/prd/11-roadmap/mvp-current-state.md` |
| GitHub Issues | Via `gh` CLI |

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Full Checklist

### Server
- [ ] Model, Entity, Query created
- [ ] Mapper created
- [ ] Service created and registered in DI
- [ ] Controller created with RLS attributes
- [ ] RLS policy registered
- [ ] Migration created
- [ ] Server tests written

### Client
- [ ] Directory structure created
- [ ] API client created
- [ ] Service created and registered in DI
- [ ] All 5 locale files created
- [ ] Generated initial translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Locales registered in features/locales.ts
- [ ] Components created
- [ ] Routes added
- [ ] Client tests written

### Integration
- [ ] End-to-end flow tested
- [ ] Error handling verified
- [ ] Loading states verified

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated
- [ ] GitHub issues updated/closed

---

## Backlinks for Deep Dives

### Server
- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md)
- [Mapper Patterns](../patterns/server/mapper-patterns.md)

### Client
- [Client Feature Template](../patterns/client/client-feature-template.md)
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
- [API Client Pattern](../patterns/client/api-client-pattern.md)
