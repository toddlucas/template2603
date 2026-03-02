# Server Services

> **Module**: Patterns / Server  
> **Domain**: Business logic layer  
> **Token target**: 500-700

## Purpose

Defines service layer patterns for CRUD operations, including identity context handling.

## Content to Include

### Service Class Structure

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

### Parameter Ordering Convention

For methods needing identity context:

1. `userId` - User performing operation (for ownership)
2. `tenantId` - Tenant context (create only)
3. `groupId` - Group context (create only)
4. `...data` - Model/parameters

**When to include each:**
- `userId`: Creating entities with ownership, audit logging
- `tenantId`: Create operations only (RLS handles read/update/delete)
- `groupId`: Create operations only (reseller mode)

### DI Registration

```csharp
// File: Services/src/Extensions/IServiceCollectionExtensions.cs
services.AddScoped<{Entity}Service>();
```

### Adding Operations

When adding new service methods:

1. Add query method if needed (in Query class)
2. Add service method following existing patterns
3. Use `_query` for data access
4. Use mapper for transformations
5. Log significant operations
6. Add method XML documentation comments

## Backlink

- [Server Feature Template](../../../patterns/server/server-feature-template.md) - Complete examples
