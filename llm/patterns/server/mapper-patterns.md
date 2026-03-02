# Mapper Patterns

## Overview

This document outlines the patterns and best practices for using Mapperly in the Lexy server components. Mapperly provides compile-time mapping between entities and models with high performance and type safety.

## Core Patterns

### 1. Basic Model Mapping
```csharp
[MapperIgnoreSource(nameof(Record.NavigationProperties))]
[MapperIgnoreSource(nameof(Record.CreatedAt))]
[MapperIgnoreSource(nameof(Record.UpdatedAt))]
[MapperIgnoreSource(nameof(Record.DeletedAt))]
public static partial Model ToModel(this Record source);
```

**Key Points:**
- Always ignore navigation properties in basic models
- Always ignore temporal fields (CreatedAt, UpdatedAt, DeletedAt)
- Basic models should only contain direct properties

### 2. Detail Model Mapping
```csharp
[MapperIgnoreSource(nameof(Record.DeletedAt))] // Only ignore DeletedAt
public static partial DetailModel ToDetailModel(this Record source);
```

**Key Points:**
- **DO NOT** ignore navigation properties in DetailModels
- **DO NOT** ignore CreatedAt and UpdatedAt (they should be mapped)
- Only ignore DeletedAt (internal-only field)
- DetailModels should include related entities for comprehensive views

### 3. Entity Mapping (Model to Entity)
```csharp
[MapperIgnoreTarget(nameof(Record.NavigationProperties))]
[MapperIgnoreTarget(nameof(Record.CreatedAt))]
[MapperIgnoreTarget(nameof(Record.UpdatedAt))]
[MapperIgnoreTarget(nameof(Record.DeletedAt))]
public static partial Record ToRecord(this Model source);
```

**Key Points:**
- Always ignore navigation properties when mapping to entities
- Always ignore temporal fields (they're set by services)
- Entities should only receive direct property values

### 4. Update Mapping
```csharp
public static void UpdateFrom(this Record record, Model model)
{
    record.Property1 = model.Property1;
    record.Property2 = model.Property2;
    // Only updateable properties, not temporal fields
}
```

**Key Points:**
- Only update direct properties
- Never update temporal fields (CreatedAt, UpdatedAt, DeletedAt)
- Never update navigation properties
- Services handle temporal field management

## Temporal Field Patterns

### Entity Temporal Fields
- **CreatedAt**: Set by service on create
- **UpdatedAt**: Set by service on update  
- **DeletedAt**: Internal-only, never exposed via API

### Model Temporal Fields
- **Basic Models**: No temporal fields (not exposed via API)
- **Detail Models**: Include CreatedAt and UpdatedAt (exposed via API)
- **DeletedAt**: Never included in any model (internal-only)

## Navigation Property Patterns

### Basic Models
- **Never include** navigation properties
- Use `[MapperIgnoreSource]` to exclude them
- Keep models lightweight for API responses

### Detail Models
- **Include** navigation properties for comprehensive views
- **DO NOT** use `[MapperIgnoreTarget]` for navigation properties
- Use base models for related entities (not detail models)
- Prevents circular references and endless nesting

## Common Mapperly Attributes

### Source Ignoring
```csharp
[MapperIgnoreSource(nameof(Record.PropertyName))]
[MapperIgnoreSource(nameof(Record.NavigationProperty))]
[MapperIgnoreSource(nameof(Record.CreatedAt))]
[MapperIgnoreSource(nameof(Record.UpdatedAt))]
[MapperIgnoreSource(nameof(Record.DeletedAt))]
```

### Target Ignoring
```csharp
[MapperIgnoreTarget(nameof(Record.PropertyName))]
[MapperIgnoreTarget(nameof(Record.NavigationProperty))]
[MapperIgnoreTarget(nameof(Record.CreatedAt))]
[MapperIgnoreTarget(nameof(Record.UpdatedAt))]
[MapperIgnoreTarget(nameof(Record.DeletedAt))]
```

## Private Mappers for Related Entities

When mapping DetailModels that include navigation properties, Mapperly needs to know how to map those related entities. Private mapper methods tell Mapperly how to convert navigation properties to their corresponding models.

### Why Private Mappers Are Needed

When you have a DetailModel mapping like this:
```csharp
[MapperIgnoreSource(nameof(Record.DeletedAt))]
public static partial DetailModel ToDetailModel(this Record source);
```

And the entity has navigation properties like `Parent` or `Children`, Mapperly will look for a way to map those. Private mappers provide that mapping.

### Pattern: Delegation to Canonical Mappers (Preferred)

The preferred approach is to delegate to the canonical mapper for each related entity type. This ensures consistent mapping behavior across your codebase.

```csharp
// Private mappers for related entities
private static ParentModel MapToParentModel(Parent source) => ParentMapper.ToModel(source);
private static ChildModel MapToChildModel(Child source) => ChildMapper.ToModel(source);
private static RelatedEntityModel MapToRelatedEntityModel(RelatedEntity source) => RelatedEntityMapper.ToModel(source);
```

**Key Points:**
- Method name follows `MapTo{ModelName}` convention
- Parameter is the related entity type
- Delegates to the canonical mapper's `ToModel()` method
- Returns the base model (not detail model) to prevent circular references

### Pattern: Inline Partial Methods (Alternative)

If no canonical mapper exists or you need custom mapping for this specific context, use an inline partial method:

```csharp
// Private mappers for related entities
[MapperIgnoreSource(nameof(RelatedEntity.NavigationProperties))]
[MapperIgnoreSource(nameof(RelatedEntity.CreatedAt))]
[MapperIgnoreSource(nameof(RelatedEntity.UpdatedAt))]
[MapperIgnoreSource(nameof(RelatedEntity.DeletedAt))]
private static partial RelatedEntityModel MapToRelatedEntityModel(RelatedEntity source);
```

### Example

```csharp
[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class EntityMapper
{
    // ... public mapping methods ...

    // Private mappers for related entities
    private static ParentModel MapToParentModel(Parent source) => ParentMapper.ToModel(source);
    private static ChildModel MapToChildModel(Child source) => ChildMapper.ToModel(source);
    private static CategoryModel MapToCategoryModel(Category source) => CategoryMapper.ToModel(source);
}
```

### When to Add Private Mappers

Add a private mapper when:
1. Your DetailModel includes navigation properties
2. Mapperly cannot automatically find a mapping for a related type
3. You want to ensure related entities map to base models (not detail models)

### Naming Convention

| Related Entity Type | Private Mapper Name | Return Type |
|---------------------|---------------------|-------------|
| `Parent` | `MapToParentModel` | `ParentModel` |
| `Child` | `MapToChildModel` | `ChildModel` |
| `Category` | `MapToCategoryModel` | `CategoryModel` |

---

## Complete Mapper Template

```csharp
namespace Base2.{Namespace};

using Record = {Entity};
using Model = {Entity}Model;
using DetailModel = {Entity}DetailModel;

[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class {Entity}Mapper
{
    // Basic Model Mapping
    [MapperIgnoreSource(nameof(Record.NavigationProperties))]
    [MapperIgnoreSource(nameof(Record.CreatedAt))]
    [MapperIgnoreSource(nameof(Record.UpdatedAt))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    public static partial Model ToModel(this Record source);

    // Detail Model Mapping
    [MapperIgnoreSource(nameof(Record.DeletedAt))] // Only ignore DeletedAt
    public static partial DetailModel ToDetailModel(this Record source);

    // Collection Mappings
    public static partial Model[] ToModels(this IEnumerable<Record> source);
    
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    public static partial DetailModel[] ToDetailModels(this IEnumerable<Record> source);

    // Entity Mapping
    [MapperIgnoreTarget(nameof(Record.NavigationProperties))]
    [MapperIgnoreTarget(nameof(Record.CreatedAt))]
    [MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    [MapperIgnoreTarget(nameof(Record.DeletedAt))]
    public static partial Record ToRecord(this Model source);

    // Update Mapping
    public static void UpdateFrom(this Record record, Model model)
    {
        record.Property1 = model.Property1;
        record.Property2 = model.Property2;
        // Only updateable properties
    }

    // Private mappers for related entities (delegation pattern - preferred)
    private static RelatedEntityModel MapToRelatedEntityModel(RelatedEntity source) 
        => RelatedEntityMapper.ToModel(source);
    private static AnotherEntityModel MapToAnotherEntityModel(AnotherEntity source) 
        => AnotherEntityMapper.ToModel(source);
}
```

### Using Aliases Convention

Always define using aliases at the top of mapper files:

```csharp
using Record = {Entity};        // The entity/database record type
using Model = {Entity}Model;    // The basic API model
using DetailModel = {Entity}DetailModel;  // The detailed API model with related data
```

**Benefits:**
- **Consistency**: All mappers use the same `Record`, `Model`, `DetailModel` terminology
- **Maintainability**: Rename the entity type in one place if needed
- **Readability**: Method signatures are cleaner and more generic
- **Pattern recognition**: Easy to identify the mapper pattern at a glance

## Troubleshooting

### Common Issues

1. **RMG020 Warnings**: Navigation properties not mapped
   - **Solution**: Remove `[MapperIgnoreTarget]` for navigation properties in DetailModel mappings
   - **DetailModels should include navigation properties**

2. **Circular Reference Errors**: Endless nesting in DetailModels
   - **Solution**: Use base models for related entities, not detail models
   - **Example**: `List<RelatedEntityModel>` not `List<RelatedEntityDetailModel>`

3. **Temporal Field Issues**: CreatedAt/UpdatedAt not mapping
   - **Solution**: Only ignore DeletedAt in DetailModel mappings
   - **CreatedAt and UpdatedAt should be mapped in DetailModels**

4. **Performance Issues**: Deep cloning overhead
   - **Solution**: Use `UseDeepCloning = true` only when necessary
   - **Consider shallow copying for simple models**

5. **Missing Private Mapper Errors**: Mapperly can't find mapping for navigation property
   - **Solution**: Add a private mapper method for the related entity type
   - **Use delegation pattern**: `private static RelatedModel MapToRelatedModel(Related source) => RelatedMapper.ToModel(source);`
   - **Check naming**: Mapperly looks for methods named `MapTo{TypeName}`

6. **Inconsistent Related Entity Mapping**: Different mappers produce different results for same entity
   - **Solution**: Always delegate to canonical mappers instead of inline partial methods
   - **Ensures consistency**: All mappers use the same mapping logic for related entities

## Best Practices

1. **Consistency**: Use the same patterns across all mappers
2. **Performance**: Use compile-time mapping (Mapperly) over runtime mapping
3. **Type Safety**: Leverage Mapperly's compile-time validation
4. **Clarity**: Use explicit ignore attributes rather than implicit behavior
5. **Documentation**: Include XML documentation for all mapping methods
6. **Testing**: Test mapping behavior in unit tests
7. **Validation**: Verify mappings work correctly with sample data

## Related Patterns

- **Entity Pattern**: `doc/patterns/server/entity-patterns.md`
- **Model Pattern**: `doc/patterns/server/model-patterns.md`
- **Service Pattern**: `doc/patterns/server/service-patterns.md`
- **Architecture Overview**: `doc/patterns/server/server-architecture-patterns.md`
