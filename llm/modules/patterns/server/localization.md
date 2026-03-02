# Server Localization for User-Facing Messages

> **Module**: Patterns / Server  
> **Domain**: Localization  
> **Token target**: 400-500

## Purpose

Defines the pattern for adding localized, user-facing messages (exception messages, validation errors, etc.) to services. **Does not apply to logging** - logs remain in English.

## Content to Include

### 1. When to Localize

**Localize:**
- ✅ Exception messages thrown to users
- ✅ Validation error messages
- ✅ Business rule violations
- ✅ User-facing status messages

**Do NOT localize:**
- ❌ Log messages (`_logger.LogInformation`, etc.)
- ❌ Debug/trace output
- ❌ Internal system messages
- ❌ Developer-facing errors

### 2. Injecting IStringLocalizer

Add `IStringLocalizer<T>` to the service constructor, where `T` is the shared resource marker class for your namespace:

```csharp
using Microsoft.Extensions.Localization;
using Base2.Localization;

namespace Base2.{Namespace};

public class {Entity}Service(
    WarehouseDbContext dbContext,
    IStringLocalizer<{Namespace}ServiceResource> localizer,
    ILogger<{Entity}Service> logger)
{
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly IStringLocalizer _localizer = localizer;
    private readonly ILogger _logger = logger;
}
```

**Key Points:**
- Use shared resource marker class: `IStringLocalizer<{Namespace}ServiceResource>`
- Common marker classes: `OrchestrationServiceResource`, `ProspectingServiceResource`, `AccessServiceResource`
- Store as `IStringLocalizer` (non-generic) field for convenience
- Multiple services in the same namespace share the same marker class

### 3. Using Localizer for Exception Messages

Replace hardcoded exception messages with localized strings:

```csharp
// Before (hardcoded - not localized)
if (firstStep == null)
{
    throw new InvalidOperationException("Sequence has no steps. Add at least one step before enrolling contacts.");
}

// After (localized)
if (firstStep == null)
{
    string message = _localizer["Sequence has no steps. Add at least one step before enrolling contacts."];
    throw new InvalidOperationException(message);
}
```

**Pattern:**
1. Use the English text as the resource key (indexer parameter)
2. Store the result in a variable (optional but recommended for readability)
3. Pass the localized string to the exception constructor

### 4. Multiple Localized Messages

```csharp
if (sequence is null)
{
    string message = _localizer["Sequence not found."];
    throw new InvalidOperationException(message);
}

if (sequence.StatusId == nameof(SequenceStatus.stopped))
{
    string message = _localizer["Cannot enroll contacts in a stopped sequence. Clone it to create a new one."];
    throw new InvalidOperationException(message);
}
```

### 5. Resource File Expectations

**Do NOT create resource files yourself** - they will be created by the localization team or in a separate step. Your responsibility is only to:

1. Inject `IStringLocalizer<MarkerClass>` in the service
2. Use `_localizer["English text"]` for user-facing messages
3. Continue using `_logger` for logging (no localization)

The resource files will be created in `Resources/Localization/{MarkerClass}.{culture}.resx` with translations for all supported languages (en-US, fr, de, el, es).

**If one doesn't exist** and you're creating a new namespace, you can pause and ask the user to help.
Alternatively, you can copy a file from a parallel namespace.
You'll need to create the associated marker class too.

### 6. Marker Class Reference

If adding localization to a new namespace, check if a marker class exists:

```csharp
// File: Services/src/Localization/{Namespace}ServiceResource.cs
namespace Base2.Localization;

/// <summary>
/// Marker class for shared {namespace} service resources.
/// This class is never instantiated - it's only used for resource discovery.
/// </summary>
internal class {Namespace}ServiceResource
{
}
```

**If the marker class doesn't exist:**
- Create it following the pattern above
- Place in `Services/src/Localization/`
- Use `{Namespace}ServiceResource` naming convention
- Mark as `internal` - only used for DI and resource discovery

### 7. Complete Example

```csharp
using Microsoft.Extensions.Localization;
using Base2.Localization;

namespace Base2.Orchestration;

public class SequenceEnrollmentService(
    WarehouseDbContext dbContext,
    IStringLocalizer<OrchestrationServiceResource> localizer,
    ILogger<SequenceEnrollmentService> logger)
{
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly IStringLocalizer _localizer = localizer;
    private readonly ILogger _logger = logger;

    public async Task<EnrollmentResult> EnrollContactsAsync(
        Guid tenantId, Guid groupId, long sequenceId, long[] contactIds)
    {
        var sequence = await _dbContext.Sequences
            .Include(s => s.Steps)
            .Where(s => s.Id == sequenceId)
            .SingleOrDefaultAsync();

        if (sequence is null)
        {
            // User-facing message - localized
            string message = _localizer["Sequence not found."];
            throw new InvalidOperationException(message);
        }

        var firstStep = sequence.Steps
            .OrderBy(s => s.StepNumber)
            .FirstOrDefault();

        if (firstStep == null)
        {
            // User-facing message - localized
            string message = _localizer["Sequence has no steps. Add at least one step before enrolling contacts."];
            throw new InvalidOperationException(message);
        }

        // Log message - NOT localized (remains English)
        _logger.LogInformation("Enrolling {Count} contacts in sequence {SequenceId}.", 
            contactIds.Length, sequenceId);

        // ... rest of method
    }
}
```

### 8. Supported Languages

All localized strings must eventually have translations for:
- `en-US` (English - default)
- `fr` (French)
- `de` (German)
- `el` (Greek)
- `es` (Spanish)

The system automatically selects the appropriate translation based on the request's `Accept-Language` header.

## Checklist

When adding localized messages to a service:

- [ ] Identified marker class for namespace (e.g., `OrchestrationServiceResource`)
- [ ] Injected `IStringLocalizer<MarkerClass>` in service constructor
- [ ] Replaced hardcoded exception messages with `_localizer["..."]`
- [ ] Used English text as the resource key
- [ ] Left log messages in English (no localization)
- [ ] Noted all localized strings for resource file creation

## Backlinks

- [Localization Pattern](../../../patterns/server/localization-pattern.md) - Comprehensive reference including resource file creation
- [Server Feature Workflow](../../../workflows/server-feature.md) - Feature implementation including localization
- [Services Module](./services.md) - Service patterns and structure
