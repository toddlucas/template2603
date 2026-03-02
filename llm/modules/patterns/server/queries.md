# Server Queries

> **Module**: Patterns / Server  
> **Domain**: Data access encapsulation  
> **Token target**: 300-400

## Purpose

Defines query class patterns for encapsulating database operations with EF Core.

## Content to Include

### Query Class Structure

> **Note:** Generate XML doc comments (`/// <summary>`) for all public methods.

```csharp
// File: Data/src/{Namespace}/{Entity}Query.cs
public record {Entity}Query(DbSet<{Entity}> DbSet, ILogger logger)
{
    /// <summary>
    /// Gets a single entity by ID (read-only, no tracking).
    /// </summary>
    public Task<{Entity}?> SingleOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID (with change tracking for updates).
    /// </summary>
    public Task<{Entity}?> TrackOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID with related entities (read-only).
    /// </summary>
    public Task<{Entity}?> SingleDetailOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Include(e => e.Related).Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets a single entity by ID with related entities (with tracking).
    /// </summary>
    public Task<{Entity}?> TrackDetailOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Include(e => e.Related).AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    /// <summary>
    /// Gets all entities.
    /// </summary>
    public Task<{Entity}[]> ListAsync(CancellationToken ct = default) 
        => DbSet.ToArrayAsync(ct);

    /// <summary>
    /// Gets entities with simple pagination.
    /// </summary>
    /// <remarks>
    /// For full PagedQuery with search/sort, use Service.GetPagedAsync instead.
    /// </remarks>
    public Task<{Entity}[]> GetPagedAsync(int skip, int take, CancellationToken ct = default) 
        => DbSet.OrderByDescending(e => e.CreatedAt).Skip(skip).Take(take).ToArrayAsync(ct);

    /// <summary>
    /// Finds entity by unique field (case-insensitive).
    /// </summary>
    public Task<{Entity}?> FindByEmailAsync(string email, CancellationToken ct = default) 
        => DbSet.Where(e => e.Email.ToLower() == email.ToLower()).SingleOrDefaultAsync(ct);
}
```

### Key Patterns

| Method Pattern | Use Case | Returns |
|----------------|----------|---------|
| `SingleOrDefaultAsync` | Read by ID | Single or null |
| `TrackOrDefaultAsync` | Update by ID | Single with tracking |
| `SingleDetailOrDefaultAsync` | Read with includes | Single with related |
| `TrackDetailOrDefaultAsync` | Update with includes | Single with tracking + related |
| `ListAsync` | Get all | Array |
| `GetPagedAsync` | Simple pagination | Array |
| `FindBy{Field}Async` | Lookup by unique field | Single or null |

### Design Principles

1. **Record with primary constructor** - Immutable, concise
2. **No tenant filtering** - RLS handles isolation automatically
3. **Read vs Track separation** - Explicit about EF change tracking
4. **Simple pagination here** - Full `PagedQuery` with search/sort belongs in Service

### Adding Query Methods

When adding new query methods:

```csharp
// Find by foreign key (returns array)
public Task<{Entity}[]> FindByRelatedIdAsync(long relatedId, CancellationToken ct = default) 
    => DbSet.Where(e => e.RelatedId == relatedId).ToArrayAsync(ct);

// Find by status/enum
public Task<{Entity}[]> FindByStatusAsync(string status, CancellationToken ct = default) 
    => DbSet.Where(e => e.StatusId == status).ToArrayAsync(ct);

// Search across fields
public Task<{Entity}[]> SearchAsync(string term, CancellationToken ct = default)
{
    var lower = term.ToLower();
    return DbSet
        .Where(e => e.Name.ToLower().Contains(lower) ||
                    e.Email.ToLower().Contains(lower))
        .ToArrayAsync(ct);
}

// Include soft-deleted (bypass query filter)
public Task<{Entity}?> FindByEmailIncludingDeletedAsync(string email, CancellationToken ct = default) 
    => DbSet.IgnoreQueryFilters()
        .Where(e => e.Email.ToLower() == email.ToLower())
        .SingleOrDefaultAsync(ct);
```

## Backlink

- [Server Feature Template](../../../patterns/server/server-feature-template.md) - Full examples
