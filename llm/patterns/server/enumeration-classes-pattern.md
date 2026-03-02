# Enumeration Classes Pattern

## Overview

This document explains the enumeration classes pattern used in the codebase. This pattern provides a robust alternative to traditional C# enums, offering better type safety, extensibility, and database integration capabilities.

## Why Enumeration Classes?

Traditional C# enums have several limitations:
- **Type safety**: Enum values are just integers under the hood
- **Extensibility**: Cannot add behavior or properties to enum values
- **Database integration**: Limited control over how enums are stored and queried
- **Refactoring**: Changing enum values can break existing data

Enumeration classes solve these problems by:
- Providing strong typing with custom ID types
- Allowing additional properties and behavior
- Offering full control over database mapping
- Supporting ordered collections with custom sorting
- Enabling better debugging with meaningful display values

## Architecture

The enumeration system consists of three main base classes:

### 1. `Enumeration<TId>` - Base Foundation

```csharp
public abstract record Enumeration<TId>(TId Id, string Name) : IComparable<Enumeration<TId>>
    where TId : IComparable
```

**Key Features:**
- Generic ID type for flexibility (int, string, Guid, etc.)
- Implements `IComparable` for sorting
- Reflection-based `GetAll<T>()` method to discover static properties
- Immutable record type for value semantics

**Usage:**
```csharp
public record Status(int Id, string Name) : Enumeration<int>(Id, Name)
{
    public static Status Active => new(1, "Active");
    public static Status Inactive => new(2, "Inactive");
    
    public static IEnumerable<Status> GetAll() => GetAll<Status>();
}
```

### 2. `OrderedEnumeration<TId>` - Ordered Collections

```csharp
public abstract record OrderedEnumeration<TId>(TId Id, string Name, int Ordinal)
    : Enumeration<TId>(Id, Name)
    where TId : IComparable
```

**Key Features:**
- Adds `Ordinal` property for custom ordering
- Overrides `GetAll<T>()` to return items ordered by ordinal
- Includes `DebuggerDisplay` attribute for better debugging experience

**Usage:**
```csharp
public record Priority(int Id, string Name, int Ordinal) : OrderedEnumeration<int>(Id, Name, Ordinal)
{
    public static Priority Low => new(1, "Low", 10);
    public static Priority Medium => new(2, "Medium", 20);
    public static Priority High => new(3, "High", 30);
    
    public static IEnumerable<Priority> GetAll() => GetAll<Priority>();
}
```

### 3. `StringEnumeration` - String-Based Enumerations

```csharp
public abstract record StringEnumeration(string Id, string Name, int Ordinal)
    : OrderedEnumeration<string>(Id, Name, Ordinal)
```

**Key Features:**
- Specialized for string-based IDs
- Combines ordering with string identifiers
- Most commonly used pattern in the codebase

**Usage:**
```csharp
public record GenderTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 1;
    
    public static GenderTypeEnum Male => new(10, "M", "Male");
    public static GenderTypeEnum Female => new(20, "F", "Female");
    public static GenderTypeEnum Other => new(30, "O", "Other");
    
    public static IEnumerable<GenderTypeEnum> GetAll() => GetAll<GenderTypeEnum>();
}
```

## Entity Framework Integration

### EnumerationBuilder Class

The `EnumerationBuilder` class provides Entity Framework integration:

```csharp
public static class EnumerationBuilder
{
    // Generic method for any enumeration type
    public static void OnCreating<T, TId>(this ModelBuilder modelBuilder, IEnumerable<T> items, string? tableName = null)
        where T : Enumeration<TId>
        where TId : IComparable
    
    // Specialized method for string enumerations
    public static void OnStringCreating<T>(this ModelBuilder modelBuilder, IEnumerable<T> items, int? keyLength = null, string? tableName = null) 
        where T : StringEnumeration
}
```

### Database Configuration

**In DbContext:**
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    
    // Configure string enumerations
    EnumerationBuilder.OnStringCreating(modelBuilder, GenderTypeEnum.GetAll(), GenderTypeEnum.KeyLength, "gender_type");
    EnumerationBuilder.OnStringCreating(modelBuilder, CurrencyTypeEnum.GetAll(), CurrencyTypeEnum.KeyLength, "currency_type");
}
```

**Generated Database Schema:**
```sql
CREATE TABLE gender_type (
    id VARCHAR(20) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ordinal INT NOT NULL
);

CREATE TABLE currency_type (
    id VARCHAR(3) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ordinal INT NOT NULL
);
```

**Seed Data:**
```sql
INSERT INTO gender_type (id, name, ordinal) VALUES 
('Male', 'Male', 10),
('Female', 'Female', 20),
('Other', 'Other', 30);

INSERT INTO currency (id, name, ordinal) VALUES 
('usd', 'USD', 1);
```

## Implementation Patterns

### 1. Basic String Enumeration

```csharp
public record GenderTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    // Define maximum length for database column
    public const int KeyLength = 20;
    
    // Define enumeration values
    public static GenderTypeEnum Male => new(10, nameof(GenderType.Male), "Male");
    public static GenderTypeEnum Female => new(20, nameof(GenderType.Female), "Female");
    public static GenderTypeEnum Other => new(30, nameof(GenderType.Other), "Other");
    
    // Provide GetAll method for EF integration
    public static IEnumerable<GenderTypeEnum> GetAll() => GetAll<GenderTypeEnum>();
}
```

### 2. Complex Enumeration with Additional Properties

```csharp
public record CurrencyTypeEnum(int Ordinal, string Id, string Name, int Scale)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 3;
    
    public static CurrencyTypeEnum Usd => new(1, "usd", "USD", 2);
    public static CurrencyTypeEnum Eur => new(2, "eur", "EUR", 2);
    public static CurrencyTypeEnum Jpy => new(3, "jpy", "JPY", 0); // No decimal places
    
    public static IEnumerable<CurrencyTypeEnum> GetAll() => GetAll<CurrencyTypeEnum>();
}
```

### 3. Integer-Based Enumeration

```csharp
public record Status(int Id, string Name) : Enumeration<int>(Id, Name)
{
    public static Status Draft => new(1, "Draft");
    public static Status Published => new(2, "Published");
    public static Status Archived => new(3, "Archived");
    
    public static IEnumerable<Status> GetAll() => GetAll<Status>();
}
```

### 4. String Enumeration tied to C# enum

See the "C# Enum and TypeScript Integration Pattern" section for full details.

```csharp
public enum GenderType
{
    Male = 1,
    Female,
    Other,
}

public record GenderTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    // Define maximum length for database column
    public const int KeyLength = 20;
    
    // Define enumeration values
    public static GenderTypeEnum Male => new(10, nameof(GenderType.Male), "Male");
    public static GenderTypeEnum Female => new(20, nameof(GenderType.Female), "Female");
    public static GenderTypeEnum Other => new(30, nameof(GenderType.Other), "Other");
    
    // Provide GetAll method for EF integration
    public static IEnumerable<GenderTypeEnum> GetAll() => GetAll<GenderTypeEnum>();
}
```

## EF Core configuration

### Approach 1: String Property with StringEnumeration Navigation (Traditional)

This is the standard pattern used throughout the codebase:

```csharp
public class IdentityUserModel
{
    ...
    /// <summary>
    /// The gender ID.
    /// </summary>
    [Display(Name = "Gender ID")]
    public string? GenderId { get; set; }
}

public class IdentityUser : IdentityUserModel
{
    public GenderTypeEnum? GenderTypeEnum { get; set; }

    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        ...
        // Relations

        // Required one-to-many without navigation to dependents
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.GenderTypeEnum)
            .WithMany()
            .HasForeignKey(x => x.GenderId)
            .IsRequired();
    }
}
```

### Approach 2: C# Enum Property with StringEnumeration Navigation (Not Viable)

⚠️ **IMPORTANT: This approach does not work due to EF Core limitations.** See [EF Core Enum FK Limitation](../../notes/2025-12-30_ef-core-enum-fk-limitation.md) for details.

This approach was intended to provide stronger type safety by using a C# enum property directly, but EF Core cannot use an enum property as a foreign key to a string principal key, even with `HasConversion<string>()` configured. EF Core performs type checking on foreign keys **before** applying value converters, resulting in a type mismatch error.

**What we wanted:**

```csharp
public class ContactActivityModel
{
    /// <summary>
    /// The activity type. See <see cref="ActivityType"/>.
    /// </summary>
    [Display(Name = "Activity Type")]
    [Required]
    public ActivityType ActivityType { get; set; }  // ❌ Cannot use as FK
}

public class ContactActivity : ContactActivityModel
{
    public ActivityTypeEnum? ActivityTypeEnum { get; set; }

    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Store enum as string in database
        modelBuilder.Entity<ContactActivity>()
            .Property(e => e.ActivityType)
            .HasConversion<string>();

        // ❌ This fails: enum type != string type
        modelBuilder.Entity<ContactActivity>()
            .HasOne(e => e.ActivityTypeEnum)
            .WithMany()
            .HasForeignKey(e => e.ActivityType)  // Type mismatch error
            .HasPrincipalKey(e => e.Id);
    }
}
```

**Why it fails:**

EF Core sees `ActivityType` (enum) and `ActivityTypeEnum.Id` (string) as incompatible types for the FK relationship, even though a string conversion is configured. The type validation happens before the converter is applied.

**Alternatives:**

1. **Use Approach 1** (string property + navigation) - Recommended when you need FK constraints
2. **Enum without FK constraint** - Acceptable for internal tools where all data access is via C# code
3. **Shadow property pattern** - Too complex, not recommended (see note for details)

**When to use Approach 1:**
- **Always**, when you need database referential integrity
- When you need navigation properties to work correctly
- Production code (recommended pattern throughout this codebase)

## Exporting

1. Converting a C# string type key to a typed enum in TypeScript

```csharp
public class IdentityUserModel
{
    ...
    /// <summary>
    /// The gender ID.
    /// </summary>
    [Display(Name = "Gender ID")]
    public string? GenderId { get; set; }
}

public class AppGenerationSpec : GenerationSpec
{
    public override void OnBeforeGeneration(OnBeforeGenerationArgs args)
    {
        ...
        AddEnum<GenderType>();
        
        AddInterface<IdentityUserModel>()
            .Member(x => nameof(x.GenderId)).Type(nameof(GenderType), "./gender-type");
    }
}
```

## Best Practices

### 1. Naming Conventions
- Use descriptive names: `GenderTypeEnum`, `CurrencyTypeEnum`, `OrderStatus`
- End with `Enum` suffix for clarity
- Use PascalCase for all identifiers

### 2. Ordinal Values
- Use meaningful gaps (10, 20, 30) to allow future insertions
- Keep ordinals consistent across related enumerations
- Document the ordering logic

### 3. Key Length Constants
- Always define `KeyLength` constant for string enumerations
- Use appropriate lengths based on expected values
- Consider database performance implications

### 4. Type Aliases
- Use `using TEnumeration = YourEnum;` for cleaner code
- Reduces repetition in static property definitions

### 5. Database Integration
- Always call `GetAll()` in EF configuration
- Use descriptive table names
- Consider indexing strategies for frequently queried enumerations

## Usage Examples

### Querying Enumerations
```csharp
// Get all values
var allGenders = GenderTypeEnum.GetAll();

// Find by ID
var male = allGenders.FirstOrDefault(g => g.Id == "Male");

// Filter by ordinal
var highPriority = Priority.GetAll().Where(p => p.Ordinal >= 20);
```

### Using in Entity Models
```csharp
public class User
{
    public string Id { get; set; }
    public string? GenderId { get; set; }
    public string? CurrencyId { get; set; }
    
    // Navigation properties (if needed)
    public GenderTypeEnum? Gender => GenderTypeEnum.GetAll().FirstOrDefault(g => g.Id == GenderId);
    public CurrencyTypeEnum? CurrencyTypeEnum => CurrencyTypeEnum.GetAll().FirstOrDefault(c => c.Id == CurrencyId);
}
```

### API Serialization
```csharp
[HttpGet("genders")]
public IActionResult GetGenders()
{
    var genders = GenderTypeEnum.GetAll()
        .Select(g => new { g.Id, g.Name, g.Ordinal });
    
    return Ok(genders);
}
```

## Migration from Traditional Enums

### Before (Traditional Enum)
```csharp
public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}
```

### After (Enumeration Class)
```csharp
public record GenderTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;
    
    public static GenderTypeEnum Male => new(10, "Male", "Male");
    public static GenderTypeEnum Female => new(20, "Female", "Female");
    public static GenderTypeEnum Other => new(30, "Other", "Other");
    
    public static IEnumerable<GenderTypeEnum> GetAll() => GetAll<GenderTypeEnum>();
}
```

## Benefits

1. **Type Safety**: Strong typing prevents invalid values
2. **Extensibility**: Easy to add properties and behavior
3. **Database Control**: Full control over storage and querying
4. **Ordering**: Built-in support for custom ordering
5. **Debugging**: Better debugging experience with meaningful display values
6. **Refactoring**: Safer refactoring with compile-time checks
7. **API Integration**: Better serialization and deserialization support

## C# Enum and TypeScript Integration Pattern

### Overview

For maximum type safety and developer experience across the full stack, enumeration classes can be tied to both C# enums and TypeScript string literal unions. This pattern provides:

- **C# Enum**: Compile-time type safety and IntelliSense in server code
- **Enumeration Class**: Database integration and additional properties
- **TypeScript String Literal Union**: Type safety in client code

### Implementation Pattern

#### 1. C# Enum Definition

Create a traditional C# enum with values that match the enumeration class IDs:

```csharp
/// <summary>
/// Learning item type.
/// </summary>
public enum LearningItemType
{
    lexeme = 10,
    phrase = 20,
    sentence = 30,
    grammar_rule = 40,
}
```

#### 2. Enumeration Class with nameof Integration

Use `nameof()` to tie the enumeration class to the C# enum:

```csharp
/// <summary>
/// Learning item type enumeration class.
/// </summary>
public record LearningItemTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static LearningItemTypeEnum Lexeme => new(10, nameof(LearningItemType.lexeme), "Lexeme");
    public static LearningItemTypeEnum Phrase => new(20, nameof(LearningItemType.phrase), "Phrase");
    public static LearningItemTypeEnum Sentence => new(30, nameof(LearningItemType.sentence), "Sentence");
    public static LearningItemTypeEnum GrammarRule => new(40, nameof(LearningItemType.grammar_rule), "Grammar Rule");

    public static IEnumerable<LearningItemTypeEnum> GetAll() => GetAll<LearningItemTypeEnum>();
}
```

#### 3. TypeScript String Literal Union

Create a manually constructed TypeScript file with string literal unions:

```typescript
/**
 * Learning item type.
 */
export type LearningItemType
  = 'lexeme'
  | 'phrase'
  | 'sentence'
  | 'grammar_rule'
  ;
```

#### 4. TypeGen Configuration

Configure TypeGen to map the enumeration class to the TypeScript type:

```csharp
// In AppGenerationSpec.cs
AddInterface<LearningItemStateModel>(learningPath)
    .Member(x => nameof(x.Status)).Type(nameof(LearningItemType), "./learning-item-type");
```

#### 5. EF Core Configuration (optional)

If the enumeration's `Id` is a string type, and we're using C# enums to connect those values (e.g., using `nameof`), then we may also use the C# enum as the property's type.
We configure EF Core to store the enum value as a string.

```csharp
public class LearningItem
{
    public string Id { get; set; }
    public LearningItemType? LearningItemTypeId { get; set; }
    ...
    
    // Navigation properties (if needed)
    public LearningItemTypeEnum? LearningItemType => GenderTypeEnum.GetAll().FirstOrDefault(g => g.Id == (int)LearningItemTypeId);

    public static void OnModelCreating(ModelBuilder modelBuilder, bool isSqlite)
    {
        // Table
        modelBuilder.Entity<TRecord>().ToTable("learning_item");

        // Column names (snake_case)
        modelBuilder.Entity<TRecord>().Property(x => x.Id).HasColumnName("id");
        modelBuilder.Entity<TRecord>().Property(x => x.LearningItemTypeId).HasColumnName("learning_item_type").HasConversion<string>();
        ...
    }
}
```

Changing the property's type to an enum has the added benefit of serializing as a string instead of an integer at the API level.
This is achieved in `Program.cs` as follows:

```csharp
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
```

### Benefits of This Pattern

1. **Full-Stack Type Safety**: Type safety from database to client
2. **Refactoring Safety**: Changes to enum values are caught at compile time across all layers
3. **IntelliSense Support**: Rich IntelliSense in both C# and TypeScript
4. **Database Integrity**: Foreign key constraints prevent invalid data
5. **API Consistency**: Clear contracts between client and server
6. **Developer Experience**: Familiar enum syntax in both languages

### Usage Examples

#### Server-Side Usage

```csharp
// Using the C# enum for type safety
public void ProcessItem(LearningItemType itemType)
{
    switch (itemType)
    {
        case LearningItemType.lexeme:
            // Handle lexeme
            break;
        case LearningItemType.phrase:
            // Handle phrase
            break;
        // ... other cases
    }
}

// Using the enumeration class for database operations
var itemType = LearningItemTypeEnum.GetAll()
    .FirstOrDefault(t => t.Id == nameof(LearningItemType.lexeme));
```

#### Client-Side Usage

```typescript
// Type-safe function parameters
function processItem(itemType: LearningItemType): void {
    switch (itemType) {
        case 'lexeme':
            // Handle lexeme
            break;
        case 'phrase':
            // Handle phrase
            break;
        // ... other cases
    }
}

// Type-safe object properties
interface LearningItem {
    type: LearningItemType;
    // ... other properties
}
```

### Migration Strategy

1. **Create C# enum** with desired values
2. **Create enumeration class** using `nameof()` references
3. **Create TypeScript string literal union** manually
4. **Update TypeGen configuration** to map the types
5. **Update database schema** with enumeration tables
6. **Gradually migrate** string properties to use the new types

### Best Practices

1. **Consistent Naming**: Use the same base name for enum, enumeration class, and TypeScript type
2. **Ordinal Alignment**: Keep ordinals consistent between C# enum and enumeration class
3. **Documentation**: Document the relationship between the three representations
4. **Testing**: Test the integration across all layers
5. **Validation**: Add validation to ensure consistency between representations

## Key selection

* May be based of the string representation of a C# enum member, allows tying a C# enum to the enumeration values
* May be a single character (upper or lowercase), which is common in some database designs
* Are represented as strings in C# but may be exported as TypeScript enums
* Casing can be an issue, especially through serialization transforms (e.g., Pascal to camel), so snake case may be useful

## References

- [Microsoft DDD Patterns - Enumeration Classes](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/enumeration-classes-over-enum-types)
- [String Enums in C# - Everything You Need to Know](https://josipmisko.com/posts/string-enums-in-c-sharp-everything-you-need-to-know)
