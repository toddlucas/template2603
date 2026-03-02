# Server Mappers

> **Module**: Patterns / Server  
> **Domain**: Data transformation  
> **Token target**: 300-500

## Purpose

Defines Mapperly mapper patterns for converting between Model, Entity, and DetailModel.

## Content to Include

### Mapper Class Structure

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

### Mapping Rules Summary

| Direction | Ignore |
|-----------|--------|
| Entity → Model | TenantId, GroupId, Temporal, Navigation |
| Entity → DetailModel | TenantId, GroupId, DeletedAt, Enum navigations |
| Model → Entity | TenantId, GroupId, Temporal, Navigation |

### Adding to Existing Mapper

When adding new fields:

1. **New business field**: Usually auto-mapped, no changes needed
2. **New internal field**: Add `[MapperIgnoreSource]` and `[MapperIgnoreTarget]`
3. **New navigation**: Add `[MapperIgnoreSource]` for ToModel, add private mapper if needed for ToDetailModel
4. **Update UpdateFrom**: Add the new field assignment

## Backlink

- [Mapper Patterns](../../../patterns/server/mapper-patterns.md) - Complex scenarios, private mappers
