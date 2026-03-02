# Fullstack Modification Workflow

Workflow for modifying an existing feature end-to-end: server changes to existing entities followed by corresponding client changes.

## Prerequisites

Before starting:

**Server:**
1. Identify existing feature namespace and entity
2. Understand what's being modified (field, operation, endpoint)
3. Review existing code patterns

**Client:**
4. Check if translations exist for new UI text
5. Review existing component patterns in the feature

### Decision Tree

```
What are you modifying?

├─ New field (server + client display)
│  └─ Server: Model → Entity → Mapper → Migration
│  └─ Client: Translations → Component update
│
├─ New operation (server + client action)
│  └─ Server: Query → Service → Controller
│  └─ Client: API client → Service → Component
│
├─ New entity in existing feature
│  └─ Use fullstack-entity workflow instead
│
├─ Client-only change (display/UX)
│  └─ Use client-modification workflow only
│
└─ New feature
    └─ Use fullstack-feature workflow instead
```

---

# Part 1: Server

## Adding Fields

### Step 1: Update Model (if API-exposed)

```csharp
// File: Contracts/src/{Namespace}/{Entity}Model.cs
public class {Entity}Model
{
    // ... existing properties ...

    /// <summary>
    /// New field description.
    /// </summary>
    [Display(Name = "New Field")]
    [Required]
    public string NewField { get; set; } = string.Empty;
}
```

### Step 2: Update Entity

```csharp
// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    // ... existing properties ...

    // If field is internal (not in Model), add here only:
    /// <summary>
    /// Internal field description.
    /// </summary>
    [Display(Name = "Internal Field")]
    public string InternalField { get; set; } = string.Empty;
}
```

### Step 3: Update DbContext Configuration

```csharp
// In OnModelCreating
modelBuilder.Entity<{Entity}>(entity =>
{
    // ... existing configuration ...
    entity.Property(e => e.NewField).HasColumnName("new_field").HasMaxLength(100);
});
```

### Step 4: Update Mapper

For **internal fields**:

```csharp
[MapperIgnoreSource(nameof({Entity}.InternalField))]
public static partial {Entity}Model ToModel(this {Entity} source);

[MapperIgnoreTarget(nameof({Entity}.InternalField))]
public static partial {Entity} ToRecord(this {Entity}Model source);
```

For **business fields** (update UpdateFrom):

```csharp
public static void UpdateFrom(this {Entity} record, {Entity}Model model)
{
    // ... existing assignments ...
    record.NewField = model.NewField;
}
```

### Step 5: Create Migration

```bash
cd main/src
dotnet ef migrations add Add{Entity}NewField --project Base2.Data
```

---

## Adding Query Methods

```csharp
// File: Data/src/{Namespace}/{Entity}Query.cs

public Task<{Entity}[]> FindByRelatedIdAsync(long relatedId, CancellationToken ct = default) 
    => DbSet.Where(e => e.RelatedId == relatedId).ToArrayAsync(ct);

public Task<{Entity}[]> FindByStatusAsync(string status, CancellationToken ct = default) 
    => DbSet.Where(e => e.StatusId == status).ToArrayAsync(ct);
```

---

## Adding Service Methods

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs

/// <summary>
/// New operation description.
/// </summary>
public async Task<{Entity}Model?> NewOperationAsync(long id, string parameter, CancellationToken ct = default)
{
    var record = await _query.TrackOrDefaultAsync(id, ct);
    if (record is null) return null;

    // Business logic here
    record.UpdatedAt = DateTime.UtcNow;

    await _dbContext.SaveChangesAsync(ct);
    return record.ToModel();
}
```

---

## Adding Controller Endpoints

```csharp
// File: Web/src/Controllers/{Namespace}/{Entity}Controller.cs

/// <summary>
/// New operation description.
/// </summary>
[HttpPost("{id:long}/action")]
[TenantWrite]
[Produces(typeof({Entity}Model))]
[EndpointDescription("Performs the new operation.")]
public async Task<ActionResult> NewAction(long id, [FromBody] ActionRequest request, CancellationToken ct)
{
    if (id <= 0) return BadRequest();
    var result = await _service.NewOperationAsync(id, request.Parameter, ct);
    return result is null ? NotFound() : Ok(result);
}
```

---

## Server Testing

```csharp
[Fact]
public async Task NewOperation_ValidInput_ReturnsExpectedResult()
{
    var created = await CreateTestEntityAsync();
    var result = await _service.NewOperationAsync(created.Id, "parameter");
    Assert.NotNull(result);
}
```

---

## Part 2: Client

With the server changes complete and tested, update the client to use them.

**Verify before proceeding:**
- [ ] New/updated endpoints return expected data
- [ ] Swagger/OpenAPI shows correct schemas
- [ ] TypeScript types regenerated (if using TypeGen)

---

## Step 6: Client Localization

### i18n Quick Check

Before adding a translation key:
1. **Check `common` namespace**: Edit, Delete, Save, Cancel, Actions, Search
2. **Check `translation` namespace**: Dashboard, Settings, navigation items
3. **Only add to feature namespace** if truly feature-specific

### Add to All 5 Files

```jsonc
// Add to en.jsonc
{
    // ... existing keys ...
    
    "New Field Label": "New Field Label",
    "New Action": "New Action",
    "Operation completed": "Operation completed"
}
```

### Generate Translations for New Keys

Translate the new keys in each non-English file. Mark AI-generated translations for review:

```jsonc
// Add to de.jsonc (and el, es, fr)
{
    // ... existing keys ...
    
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "New Field Label": "Neue Feldbezeichnung",
    "New Action": "Neue Aktion",
    "Operation completed": "Vorgang abgeschlossen"
}
```

> Remove `REVIEW: AI_TRANSLATED` comment after native speaker verification.

### Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

---

## Step 7: Update API Client

```typescript
// In existing api/{entity}Api.ts
export const {entity}Api = {
  // ... existing methods ...

  newOperation: (id: number, data: OperationData): Promise<Result<EntityModel, Response>> =>
    postModel(`/api/{namespace}/{entity}/${id}/action`, data),
};
```

---

## Step 8: Update Service

```typescript
// Add to interface
export interface I{Entity}Service {
  // ... existing methods ...
  newOperation(id: number, data: OperationData): Promise<EntityModel>;
}

// Add to implementation
async newOperation(id: number, data: OperationData): Promise<EntityModel> {
  const result = await {entity}Api.newOperation(id, data);
  if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to perform operation');
  return result.value;
}
```

---

## Step 9: Update Components

### Adding UI Element for New Field

```tsx
// In existing component
import { useTranslation } from 'react-i18next';

const ExistingComponent: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <div>
      {/* Existing content */}
      
      {/* New field display */}
      <div className="mt-4">
        <Label>{t("New Field Label")}</Label>
        <span>{item.newField}</span>
      </div>
    </div>
  );
};
```

### Adding New Action Button

```tsx
const handleNewAction = async () => {
  try {
    setLoading(true);
    await service.newOperation(item.id, { parameter: "value" });
    toast.success(t("Operation completed"));
    await refresh();
  } catch (err) {
    toast.error(t("Error", { ns: "common" }));
  } finally {
    setLoading(false);
  }
};

return (
  <Button onClick={handleNewAction} disabled={loading}>
    {t("New Action")}
  </Button>
);
```

### Adding New Component

```tsx
// components/{entity}/NewComponent.tsx
import { useTranslation } from 'react-i18next';

export const NewComponent: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("New Field Label")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

---

## Step 10: Client Testing

```tsx
describe('ExistingComponent', () => {
  it('displays new field', async () => {
    mockService.get.mockResolvedValue({
      id: 1,
      name: 'Test',
      newField: 'New Value',
    });

    render(
      <TestProviders>
        <ExistingComponent id={1} />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('New Value')).toBeInTheDocument();
    });
  });

  it('handles new action', async () => {
    mockService.newOperation.mockResolvedValue({ id: 1, name: 'Test' });

    render(
      <TestProviders>
        <ExistingComponent id={1} />
      </TestProviders>
    );

    const button = screen.getByRole('button', { name: /new action/i });
    await userEvent.click(button);

    expect(mockService.newOperation).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
```

---

## Part 3: Integration

### Verify Changes Work End-to-End

1. **Test the updated functionality**:
   - [ ] New fields display correctly
   - [ ] New operations work as expected
   - [ ] Error handling works
   - [ ] Loading states display

### Common Integration Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Type mismatch | Stale TypeScript types | Regenerate with update-models.cmd |
| Missing field | Not mapped in API response | Check mapper ignores |
| 404 on new endpoint | Route not registered | Check controller route |
| Translation missing | Key not in locale file | Add to all 5 locale files |

---

## Step 11: Update Tracking Documents

| Document | Location |
|----------|----------|
| User Stories | `doc/prd/11-roadmap/mvp-user-stories.md` |
| GitHub Issues | Via `gh` CLI |

```bash
gh issue comment <number> --body "Added NewField to {Entity}. PR #<pr-number>"
```

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Full Checklist

### Server Changes
- [ ] Updated Model (if field is API-exposed)
- [ ] Updated Entity (if new field/property)
- [ ] Updated DbContext configuration
- [ ] Updated Mapper (ignores/mappings)
- [ ] Updated UpdateFrom method
- [ ] Updated Service (new methods)
- [ ] Updated Controller (new endpoints)
- [ ] Created migration (if schema changed)
- [ ] Updated tests

### Client Changes
- [ ] Checked for existing translation keys
- [ ] Added new keys to all 5 locale files
- [ ] Generated translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Updated API client (new methods)
- [ ] Updated service interface and implementation
- [ ] Updated/created components
- [ ] Ran duplicate checker

### Integration
- [ ] TypeScript types regenerated (if needed)
- [ ] End-to-end flow tested
- [ ] Error handling verified

### Tracking
- [ ] User stories updated in PRD
- [ ] GitHub issues updated/closed

---

## Backlinks for Deep Dives

### Server
- [Server Feature Template](../patterns/server/server-feature-template.md)
- [Mapper Patterns](../patterns/server/mapper-patterns.md)

### Client
- [Client Feature Template](../patterns/client/client-feature-template.md)
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
