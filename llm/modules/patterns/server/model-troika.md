# Model Troika: Model, Entity, Query

> **Module**: Patterns / Server  
> **Domain**: Data layer fundamentals  
> **Token target**: 400-500

## Purpose

Defines the three core classes for any server entity and how they relate.

## Content to Include

### 1. Model (Contracts Layer)

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

### 2. Entity (Data Layer)

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

### 3. DbContext Registration

Add a static `OnModelCreating` method directly on the entity class to colocate EF Core configuration with the entity definition. The DbContext calls it.

**Part 1 — static method on the entity class:**

```csharp
using Record = {Entity};

// File: Data/src/{Namespace}/{Entity}.cs
public class {Entity} : {Entity}Model, ITemporalRecord
{
    // ... properties ...

    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Record>().ToTable("{entity}");  // snake_case table name
        modelBuilder.Entity<Record>().HasKey(e => e.Id);

        // Column mappings (snake_case)
        modelBuilder.Entity<Record>().Property(e => e.Id).HasColumnName("id");
#if RESELLER
        modelBuilder.Entity<Record>().Property(e => e.GroupId).HasColumnName("group_id").IsRequired();
#endif
        modelBuilder.Entity<Record>().Property(e => e.TenantId).HasColumnName("tenant_id").IsRequired();
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

        // HasIndex and other entity-specific config also belongs here

        // Global query filter for soft delete
        modelBuilder.Entity<Record>().HasQueryFilter(e => e.DeletedAt == null);
    }
}
```

**Part 2 — DbContext calls the static method:**

```csharp
// File: Data/src/{DbContext}.cs

// Add DbSet property
public DbSet<{Entity}> {Entities} { get; set; } = null!;

// In OnModelCreating, call the entity's static configuration method
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing entity configurations ...
    {Entity}.OnModelCreating(modelBuilder);
}
```

**Key points:**
- Configuration is colocated with the entity class, not in DbContext
- DbContext calls the entity's static method
- DbSet property uses PascalCase plural (`{Entities}`)
- Table name uses snake_case singular (`{entity}`)
- Column names use snake_case
- `HasIndex` and other entity-specific config belongs in the same static method
- `HasQueryFilter` for soft delete is always included
- Always add `using Record = {Entity};` at the top of the file and use `Record` throughout the method body
- For JSONB properties, add a `bool isSqlite` parameter to the signature — see [JSONB Module](./jsonb.md)

### 4. Query Class (Data Layer)

```csharp
using Record = {Entity};

// File: Data/src/{Namespace}/{Entity}Query.cs
public record {Entity}Query(DbSet<{Entity}> DbSet, ILogger logger)
{
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken ct = default) 
        => DbSet.AsTracking().Where(e => e.Id == id).SingleOrDefaultAsync(ct);

    public Task<Record[]> ListAsync(CancellationToken ct = default) 
        => DbSet.ToArrayAsync(ct);

    // Additional methods: SingleDetailOrDefaultAsync, GetPagedAsync, FindBy{Field}Async
}
```

**See [Queries Module](./queries.md)** for full patterns including:
- Detail queries with includes
- Simple pagination
- Find by field patterns
- Search patterns

## Backlink

- [Queries Module](./queries.md) - Full query patterns
- [JSONB Module](./jsonb.md) - JSONB properties, isSqlite flag, Record alias
- [Server Feature Template](../../../patterns/server/server-feature-template.md) - Full examples
