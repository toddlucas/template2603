# Fullstack Entity Workflow

Workflow for adding a new entity end-to-end to an existing feature: server entity followed by client entity.

## Prerequisites

Before starting:

**Server:**
1. Existing namespace (Access, Business, Prospecting, etc.)
2. Database (same as existing feature)
3. New entity name (singular, PascalCase)
4. Service/Controller approach (new or extend existing)

**Client:**
5. Existing feature namespace (should match server)
6. Service approach (new or extend existing)

## Server Code Style Conventions

### Using Statement Organization

**Placement**: Using statements go **above** the namespace declaration. Type aliases go **after** the namespace.

Group `using` statements with blank lines between groups:
1. **System** namespaces (`System.*`)
2. **Microsoft** namespaces (`Microsoft.*`)
3. **Third-party** namespaces
4. **Project** namespaces (`Base2.*`)

```csharp
using Microsoft.EntityFrameworkCore;

using Base2.Infrastructure;

namespace Base2.Prospecting;

using Record = ContactActivity;
using Model = ContactActivityModel;
```

### Namespace Organization (Vertical Slices)

**Rule**: All files for a feature use the same namespace across projects - **no intermediate layer namespaces** like `.Data` or `.Services`.

**❌ Don't**: `namespace Base2.Data.Prospecting;`  
**✅ Do**: `namespace Base2.Prospecting;`

### Decision Tree

```
Service/Controller Organization:

├─ Entity is core to feature (e.g., Sequence in Prospecting)
│  └─ Create new {Entity}Service and {Entity}Controller
│
├─ Entity is supporting/child (e.g., SequenceStep)
│  └─ Add methods to existing parent service/controller
│     OR create new (your choice)
│
└─ Unsure?
    └─ Prefer separate service/controller for clarity
```

## File Structure Overview

**Server** - New entity `{Entity}` in namespace `{Namespace}`:
```
Contracts/src/{Namespace}/{Entity}Model.cs
Data/src/{Namespace}/{Entity}.cs
Data/src/{Namespace}/{Entity}Query.cs
Data/src/{Namespace}/{Entity}Mapper.cs
Services/src/{Namespace}/{Entity}Service.cs
Web/src/Controllers/{Namespace}/{Entity}Controller.cs
```

**Client** - New entity `{entity}` in feature `{feature}`:
```
features/{feature}/api/{entity}Api.ts
features/{feature}/components/{entity}/{Entity}List.tsx
features/{feature}/components/{entity}/{Entity}Form.tsx
features/{feature}/services/I{Entity}Service.ts
features/{feature}/services/{Entity}Service.ts
features/{feature}/views/{Entity}Page.tsx
features/{feature}/locales/*.jsonc  (update all 5)
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
    public RelatedModel Related { get; set; } = null!;

    #region ITemporal
    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

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
    #region Internal properties
#if RESELLER
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

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
}
```

### DI Registration

```csharp
services.AddScoped<{Entity}Service>();
```

---

## Step 5: Controllers

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
    public async Task<ActionResult> Get(long id, CancellationToken ct)
    {
        if (id <= 0) return BadRequest();
        var result = await _service.ReadOrDefaultAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [TenantWrite]
    [Produces(typeof({Entity}Model))]
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
    public async Task<ActionResult> Put({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var result = await _service.UpdateAsync(model);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:long}")]
    [TenantWrite]
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

### Add to All 5 Locale Files

```jsonc
// Add to en.jsonc
{
    // ... existing keys ...
    
    "New Entity Name": "New Entity Name",
    "New field label": "New field label",
    "Add New Entity": "Add New Entity",
    "Edit New Entity": "Edit New Entity"
}
```

### Generate Translations for New Keys

Translate the new keys in each non-English file. Mark AI-generated translations for review:

```jsonc
// Add to de.jsonc (and el, es, fr)
{
    // ... existing keys ...
    
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "New Entity Name": "Neuer Entitätsname",
    "New field label": "Neue Feldbezeichnung",
    "Add New Entity": "Neue Entität hinzufügen"
}
```

> Remove `REVIEW: AI_TRANSLATED` comment after native speaker verification.

### Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

---

## Step 9: Client API & Service

### API Client

```typescript
// api/{entity}Api.ts
import { getModel, postModel, putModel, del, makePageQueryString, type Result } from '$/api';

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
          <TableHead>{t("New field label")}</TableHead>
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

### Create Page

```tsx
// views/{Entity}Page.tsx
const {Entity}Page: React.FC = () => {
  const { t } = useTranslation("{feature}");
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("New Entity Name")}</h1>
      <{Entity}List />
    </div>
  );
};
export default {Entity}Page;
```

### Register Routes

```tsx
// {app}/src/routes/index.tsx
<Route path="{feature}/{entity}" element={<{Entity}Page />} />
```

### Add Sidebar Navigation (if needed)

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
2. **Navigate to new entity page**: `/{feature}/{entity}`
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
| GitHub Issues | Via `gh` CLI |

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Full Checklist

### Server
- [ ] Model and Entity created
- [ ] DbSet and configuration added to DbContext
- [ ] Query class created
- [ ] Mapper created
- [ ] Service created (or methods added to existing)
- [ ] Service registered in DI (if new)
- [ ] Controller created (or endpoints added to existing)
- [ ] RLS policy registered
- [ ] Migration created
- [ ] Server tests written

### Client
- [ ] API client created
- [ ] Service created (or methods added to existing)
- [ ] Service registered in DI (if new)
- [ ] New keys added to all 5 locale files
- [ ] Generated translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Components created
- [ ] Views/pages created
- [ ] Routes added
- [ ] Client tests written

### Integration
- [ ] End-to-end flow tested
- [ ] Error handling verified
- [ ] Loading states verified

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
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
