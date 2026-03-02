# EF Core Enum Foreign Key Limitation

**Date:** December 30, 2025  
**Context:** Attempting to implement Approach 2 from enumeration-classes-pattern.md

## The Problem

When trying to use a C# enum property with `HasConversion<string>()` as a foreign key to a `StringEnumeration` lookup table, EF Core throws the following error:

```
The types of the properties specified for the foreign key {'ActivityType' : ActivityType} 
on entity type 'ContactActivity' do not match the types of the properties in the principal 
key {'Id' : string} on entity type 'ActivityTypeEnum'. Provide properties that use the 
same types in the same order.
```

## Root Cause

**EF Core performs foreign key type checking before applying value converters.** This is a fundamental limitation in EF Core's relationship configuration system.

When you configure:

```csharp
// This seems like it should work...
modelBuilder.Entity<ContactActivity>()
    .Property(e => e.ActivityType)
    .HasColumnName("activity_type")
    .HasConversion<string>();  // Converts enum to string

modelBuilder.Entity<ContactActivity>()
    .HasOne(e => e.ActivityTypeEnum)
    .WithMany()
    .HasForeignKey(e => e.ActivityType)  // ❌ EF sees ActivityType (enum) != Id (string)
    .HasPrincipalKey(e => e.Id);
```

EF Core sees:
- **Foreign Key Type:** `ActivityType` (C# enum)
- **Principal Key Type:** `string` (ActivityTypeEnum.Id)
- **Result:** Type mismatch error

Even though the conversion is configured, EF Core's FK type validation happens **before** the conversion is considered.

## Why This Matters

The goal of Approach 2 was to get:
- ✅ Strong typing in C# code (use `ActivityType` enum directly)
- ✅ String storage in database (readable values)
- ✅ Database FK constraint (referential integrity)
- ✅ Lookup table with additional properties (via `StringEnumeration`)

Unfortunately, EF Core's architecture prevents this combination from working.

## Attempted Solutions

### Solution 1: Shadow Property (Too Complex)

Using a shadow property for the FK while keeping the enum property:

```csharp
// Ignore the enum property for persistence
modelBuilder.Entity<ContactActivity>().Ignore(e => e.ActivityType);

// Shadow property for DB storage
modelBuilder.Entity<ContactActivity>()
    .Property<string>("ActivityTypeId")
    .HasColumnName("activity_type")
    .IsRequired();

// FK uses shadow property
modelBuilder.Entity<ContactActivity>()
    .HasOne(e => e.ActivityTypeEnum)
    .WithMany()
    .HasForeignKey("ActivityTypeId")
    .HasPrincipalKey(e => e.Id);
```

**Issues:**
- Need to manually sync enum property with shadow property
- Requires reflection or EF Core change tracking access
- Error-prone and complex
- Difficult to maintain

### Solution 2: Remove FK Constraint (Current Implementation)

Simply don't create the FK relationship:

```csharp
modelBuilder.Entity<ContactActivity>()
    .Property(e => e.ActivityType)
    .HasColumnName("activity_type")
    .HasConversion<string>();

// No FK relationship configured
```

**Trade-offs:**
- ✅ Clean, simple code
- ✅ Enum provides compile-time type safety
- ✅ String storage in database
- ❌ No database FK constraint
- ❌ Direct SQL could insert invalid values
- ❌ Navigation property to `ActivityTypeEnum` doesn't work

### Solution 3: Revert to Approach 1 (Recommended)

Use a string property with a navigation property to the enumeration:

```csharp
public class ContactActivityModel
{
    [StringLength(25)]
    public string ActivityTypeId { get; set; } = null!;
}

public class ContactActivity : ContactActivityModel
{
    public ActivityTypeEnum ActivityTypeEnum { get; set; } = null!;
}

// Configuration
modelBuilder.Entity<ContactActivity>()
    .HasOne(e => e.ActivityTypeEnum)
    .WithMany()
    .HasForeignKey(e => e.ActivityTypeId)
    .HasPrincipalKey(e => e.Id);
```

**Trade-offs:**
- ✅ Full database integrity with FK constraint
- ✅ Navigation property works
- ✅ Proven pattern used throughout codebase
- ❌ String property instead of enum
- ❌ Less type-safe in C# (strings can be any value)

## Recommendation

**For production code requiring database integrity:** Use Approach 1 (string property + navigation).

**For internal tools where all access is via C#:** Solution 2 (enum without FK) is acceptable.

**Never use:** Shadow property pattern (Solution 1) - complexity outweighs benefits.

## Impact on Codebase

The `ContactActivity` entity was the first attempt to implement Approach 2. Based on this limitation, we've reverted to not using a FK constraint. If database integrity becomes important, we should migrate to Approach 1.

## EF Core Issue Tracking

This is a known limitation in EF Core. Related issues:
- [EF Core GitHub Issue #10784](https://github.com/dotnet/efcore/issues/10784) - Foreign key with value converter
- [EF Core GitHub Issue #12947](https://github.com/dotnet/efcore/issues/12947) - FK type checking before conversion

No fix is planned as it would require significant architectural changes to EF Core's relationship building system.

## Conclusion

**Approach 2 as described in the pattern document is not viable with EF Core's current architecture.** The pattern document should be updated to clarify this limitation and recommend Approach 1 for any scenario requiring database FK constraints.

