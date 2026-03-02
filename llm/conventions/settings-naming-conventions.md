# Settings Naming Conventions

**Status**: Recommended Convention  
**Last Updated**: 2025-12-10  
**Related**: [Development Artifacts](./development-artifacts.md)

---

## Problem Statement

We have two types of "settings" in the codebase:

1. **Application Configuration** - Static config from `appsettings.json` (server-side only)
2. **User/Tenant Settings** - Dynamic, database-persisted preferences (server + client)

Without clear naming conventions, these concepts can be confused, leading to inconsistent code.

---

## Naming Conventions

### 1. Application Configuration (appsettings.json)

**Purpose**: Static configuration bound from `appsettings.json` at application startup.

**Naming**: Use `Settings` suffix (not `Options`)

**Location**: `Base2.Contracts/src/{Namespace}/{Name}Settings.cs`

**Pattern**:

```csharp
namespace Base2.{Namespace};

/// <summary>
/// Configuration settings for {feature}. Bound from appsettings.json.
/// </summary>
public class {Name}Settings
{
    /// <summary>
    /// The configuration section name.
    /// </summary>
    public const string SectionName = nameof({Name}Settings);
    
    // Configuration properties...
    public string SomeProperty { get; set; } = "default";
}
```

**appsettings.json**:

```json
{
  "{Name}Settings": {
    "SomeProperty": "value"
  }
}
```

**Binding in Program.cs**:

```csharp
// Bind settings
builder.Services.Configure<{Name}Settings>(
    builder.Configuration.GetSection({Name}Settings.SectionName));

// Or for immediate access during configuration:
var settings = new {Name}Settings();
builder.Configuration.GetSection({Name}Settings.SectionName).Bind(settings);
```

**Examples**:
- `AISettings` ✅
- `EmailProviderSettings` ✅
- `EnrichmentSettings` ✅

**Anti-patterns**:
- `AppRateLimitOptions` ❌ (should be `AppRateLimitSettings`)
- `AuthSendGridOptions` ❌ (should be `AuthSendGridSettings`)

---

### 2. Database-Persisted Settings (User/Tenant Preferences)

**Purpose**: Dynamic settings stored in database, configurable by users/admins.

**Naming**: Use **Model Troika** pattern (no suffix on entity, `Model` suffix on DTOs)

**Locations**:
- **Entity**: `Base2.Data/src/{Namespace}/{Name}.cs`
- **Model**: `Base2.Contracts/src/{Namespace}/{Name}Model.cs`
- **DetailModel**: `Base2.Contracts/src/{Namespace}/{Name}DetailModel.cs`
- **Mapper**: `Base2.Data/src/{Namespace}/{Name}Mapper.cs`
- **Service**: `Base2.Services/src/{Namespace}/{Name}Service.cs`

**Pattern**:

```csharp
// Entity (Data layer) - no suffix
namespace Base2.{Namespace};

using TRecord = {Name};

/// <summary>
/// {Description} entity for database persistence.
/// </summary>
public class {Name} : {Name}Model
{
    // Internal properties (not exposed via API)
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    
    // Temporal
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TRecord>().ToTable("{table_name}");
        // ... column mappings
    }
}

// Model (Contracts layer) - Model suffix
namespace Base2.{Namespace};

/// <summary>
/// Model for {description}.
/// </summary>
public class {Name}Model
{
    public long Id { get; set; }
    
    // User-configurable properties...
    public bool SomeSetting { get; set; } = true;
}

/// <summary>
/// Detailed {description} model with temporal tracking.
/// </summary>
public class {Name}DetailModel : {Name}Model, ITemporal
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Examples**:
- `AIAutonomy` (entity) → `AIAutonomyModel` (DTO) ✅
- `UserAIProfile` (entity) → `UserAIProfileModel` (DTO) ✅
- `MailboxAIProfile` (entity) → `MailboxAIProfileModel` (DTO) ✅

**Client-side (TypeScript)**:

Auto-generated from C# models via TypeGen:

```typescript
// client/common/src/models/{namespace}/{name}-model.ts
export interface {Name}Model {
  id: number;
  someSetting: boolean;
}

export interface {Name}DetailModel extends {Name}Model {
  createdAt: string;
  updatedAt: string;
}
```

---

## Decision Matrix

Use this to determine which pattern to use:

| Question | Answer | Pattern |
|----------|--------|---------|
| Is this configured in `appsettings.json`? | Yes | `{Name}Settings` |
| Is this stored in the database? | Yes | `{Name}` (entity) + `{Name}Model` (DTO) |
| Is this per-user or per-tenant? | Yes | Database-persisted (Model Troika) |
| Is this static app configuration? | Yes | Application Configuration (Settings) |
| Does the user/admin configure this in UI? | Yes | Database-persisted (Model Troika) |
| Is this only set at deployment time? | Yes | Application Configuration (Settings) |

---

## Examples from Codebase

### Application Configuration (appsettings.json)

**Good Example**: `AISettings`

```csharp
// Base2.Contracts/src/AI/AISettings.cs
public class AISettings
{
    public const string SectionName = nameof(AISettings);
    
    public string Provider { get; set; } = "OpenAI";
    public OpenAISettings OpenAI { get; set; } = new();
    public AIRateLimitSettings RateLimiting { get; set; } = new();
}
```

```json
// appsettings.json
{
  "AISettings": {
    "Provider": "OpenAI",
    "OpenAI": {
      "ApiKey": "***SECRET***",
      "Model": "gpt-4o"
    }
  }
}
```

**Needs Refactoring**: `AppRateLimitOptions`

```csharp
// Current (inconsistent)
public class AppRateLimitOptions
{
    public const string AppRateLimit = nameof(AppRateLimit);
    public int PermitLimit { get; set; } = 100;
}

// Should be
public class AppRateLimitSettings
{
    public const string SectionName = nameof(AppRateLimitSettings);
    public int PermitLimit { get; set; } = 100;
}
```

### Database-Persisted Settings

**Good Example**: `AIAutonomy`

```csharp
// Entity (Data layer)
public class AIAutonomy : AIAutonomyModel
{
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Model (Contracts layer)
public class AIAutonomyModel
{
    public long Id { get; set; }
    public bool AutoClassifyReplies { get; set; } = true;
    public bool AutoHandleOutOfOffice { get; set; } = true;
}

// DetailModel (Contracts layer)
public class AIAutonomyDetailModel : AIAutonomyModel, ITemporal
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

**Client-side (TypeScript)**:

```typescript
// Auto-generated from C# models
export interface AIAutonomyModel {
  id: number;
  autoClassifyReplies: boolean;
  autoHandleOutOfOffice: boolean;
}

export interface AIAutonomyDetailModel extends AIAutonomyModel {
  createdAt: string;
  updatedAt: string;
}
```

---

## Migration Plan

### Immediate (P0)

No breaking changes needed for MVP. Current patterns work:
- `AISettings` ✅ (already correct)
- `AIAutonomy` / `AIAutonomyModel` ✅ (already correct)
- `UserAIProfile` / `UserAIProfileModel` ✅ (already correct)

### Post-MVP (P1)

Refactor inconsistent names:

1. **`AppRateLimitOptions` → `AppRateLimitSettings`**
   - Update class name
   - Update `SectionName` constant
   - Update `appsettings.json` section name
   - Update DI registration in `Program.cs`

2. **`AuthSendGridOptions` → `AuthSendGridSettings`**
   - Same refactoring steps

**Note**: These are low-priority cosmetic changes. Only refactor if touching those files for other reasons.

---

## Key Principles

1. **`Settings` suffix = appsettings.json binding** (static, deployment-time config)
2. **Model Troika = database-persisted** (dynamic, user-configurable)
3. **No `Options` suffix** (avoid confusion with .NET's `IOptions<T>` pattern)
4. **Always include `SectionName` constant** for appsettings.json classes
5. **Client types are auto-generated** from server models (via TypeGen)

---

## Rationale

### Why `Settings` instead of `Options`?

- **Clarity**: "Settings" clearly indicates configuration
- **Consistency**: Matches our domain language ("AI Settings", "Email Settings")
- **Avoids confusion**: .NET's `IOptions<T>` is an implementation detail, not a naming convention

### Why Model Troika for database settings?

- **Consistency**: Matches our existing entity/model pattern
- **Separation**: Entity has DB concerns (FK, temporal), Model is clean DTO
- **Type safety**: Client and server share the same conceptual model
- **Auto-generation**: TypeGen creates TypeScript types from C# models

### Why not use `Settings` suffix for both?

- **Ambiguity**: `AISettings` (appsettings.json) vs. `AIAutonomySettings` (database) - which is which?
- **Clarity**: Different suffixes make the distinction obvious
- **Tooling**: Model Troika enables auto-generation for client

---

## Related Documentation

- [Server Feature Template](../patterns/server/server-feature-template.md) - Entity/Model patterns
- [Development Artifacts](./development-artifacts.md) - File naming conventions
- [Understanding the Codebase](../start/understanding-codebase.md) - Architecture overview

---

## Summary

| Type | Suffix | Example | Location |
|------|--------|---------|----------|
| **appsettings.json binding** | `Settings` | `AISettings` | `Contracts/src/{Namespace}/` |
| **Database entity** | _(none)_ | `AIAutonomy` | `Data/src/{Namespace}/` |
| **Database DTO** | `Model` | `AIAutonomyModel` | `Contracts/src/{Namespace}/` |
| **Database detail DTO** | `DetailModel` | `AIAutonomyDetailModel` | `Contracts/src/{Namespace}/` |
| **Client type** | `Model` | `AIAutonomyModel` | _(auto-generated)_ |

**Golden Rule**: If it's in `appsettings.json`, use `Settings`. If it's in the database, use Model Troika (no suffix on entity, `Model` suffix on DTO).

