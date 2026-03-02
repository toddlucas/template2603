# JSONB Properties and the isSqlite Flag

> **Module**: Patterns / Server  
> **Domain**: Data layer — special property types  
> **Token target**: 200-300

## Purpose

Documents how to map JSONB properties in EF Core entities, supporting PostgreSQL in production and SQLite in tests via `PropertyBuilderExtensions`.

## The isSqlite Flag

PostgreSQL supports the `jsonb` column type natively. SQLite does not, so the codebase uses value converters to serialize to `TEXT` instead. The `isSqlite` flag threads from the DbContext down to each entity's `OnModelCreating` method to select the right mapping.

**DbContext passes the flag:**

```csharp
// File: Data/src/{DbContext}.cs
public class {DbContext}(DbContextOptions<{DbContext}> options, bool isSqlite = false) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        {Entity}.OnModelCreating(modelBuilder, isSqlite);
    }
}
```

**Entity accepts the flag:**

```csharp
using Record = {Entity};

public static void OnModelCreating(ModelBuilder modelBuilder, bool isSqlite)
{
    // ...column mappings...
    modelBuilder.Entity<Record>().Property(e => e.Payload).HasColumnName("payload").HasJsonbOrDefault(isSqlite);
}
```

## Extension Methods

Both methods live in `Data/src/Extensions/PropertyBuilderExtensions.cs`:

| Method | Property type | Use when |
|---|---|---|
| `HasJsonb(defaultValue, isSqlite)` | Non-nullable `T` | Value is required; provide a default for deserialization |
| `HasJsonbOrDefault(isSqlite)` | Nullable `T?` | Value is optional |

```csharp
// Required JSONB (non-nullable) — provide a default value
modelBuilder.Entity<Record>().Property(e => e.Config)
    .HasColumnName("config")
    .HasJsonb(new {Entity}Config(), isSqlite);

// Optional JSONB (nullable)
modelBuilder.Entity<Record>().Property(e => e.Metadata)
    .HasColumnName("metadata")
    .HasJsonbOrDefault(isSqlite);
```

**Key points:**
- Only add `isSqlite` to the `OnModelCreating` signature when the entity has at least one JSONB property
- Entities without JSONB properties keep the simpler `OnModelCreating(ModelBuilder modelBuilder)` signature
- Always use `Record` (via `using Record = {Entity};`) throughout the method body — see [Model Troika Module](./model-troika.md)

## Backlink

- [Model Troika Module](./model-troika.md) - Entity and DbContext structure
