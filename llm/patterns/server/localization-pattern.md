# Server Localization Pattern

## Overview

This document describes how to add internationalization (i18n) support to server-side code using ASP.NET Core's built-in localization system with embedded resource files (.resx). This pattern enables exception messages, validation errors, and other user-facing strings to be localized based on the request's culture.

**Primary Approach**: Use shared resources via marker classes to minimize file proliferation (recommended).  
**Alternative Approach**: Use per-class resources for complete service isolation.

**Supported Languages**: `en-US`, `fr`, `de`, `el`, `es`

## Key Concepts

- **Resource Files (.resx)**: Embedded XML resource files that contain translations
- **IStringLocalizer<T>**: Service that provides localized strings based on the current culture
- **Two Approaches**:
  - **Shared Resources (Recommended)**: Use marker classes to create consolidated resource files shared across multiple services - reduces file proliferation
  - **Per-Class Resources**: Create separate resource files for each service class - provides isolation but creates more files
- **Resource Location**: Resource files are placed in the `Resources` folder
- **Namespace Matching**: Resource files are automatically discovered based on the class or marker class namespace

---

## Step 1: Configure Localization Services

### 1.1 Web Application (Program.cs)

**File**: `Base2.Web/src/Program.cs`

Add localization services and configure supported cultures:

```csharp
builder.Services.AddLocalization();

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en-US", "fr", "de", "el", "es" };
    options.SetDefaultCulture(supportedCultures[0])
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);
});
```

Add the localization middleware in the request pipeline (after `UseHttpsRedirection`, before `UseRouting`):

```csharp
app.UseHttpsRedirection();
app.UseRequestLocalization();
app.UseRouting();
```

### 1.2 Background Services (Program.cs)

**File**: `Base2.Background/src/Program.cs`

Background services also need localization services registered (but don't need middleware):

```csharp
builder.Services.AddLocalization();
builder.Services.AddServices();
```

**Note**: Background services don't use `UseRequestLocalization()` middleware since they don't process HTTP requests. Culture defaults to the default culture (`en-US`) unless explicitly set.

---

## Step 2: Create Shared Resource Marker Class (Recommended Approach)

**File**: `Base2.Services/src/Localization/OrchestrationServiceResource.cs`

Create a marker class (empty class) to group shared resources. This class is never called - it's only used as a type parameter for `IStringLocalizer<T>`:

```csharp
namespace Base2.Localization;

/// <summary>
/// Marker class for shared orchestration service resources.
/// This class is never instantiated - it's only used for resource discovery.
/// </summary>
internal class OrchestrationServiceResource
{
}
```

**Key Points**:
- **Marker class**: Empty class used only for resource discovery
- **Namespace**: Place in a `Localization` namespace (or appropriate namespace)
- **Visibility**: Can be `internal` - only used for DI and resource discovery
- **Naming**: Use descriptive name like `{Feature}ServiceResource` or `{Namespace}Resource`

---

## Step 3: Inject IStringLocalizer in Service

**File**: `Base2.Services/src/Orchestration/SequenceEnrollmentService.cs`

Inject `IStringLocalizer<T>` where `T` is the shared resource marker class:

```csharp
using Microsoft.Extensions.Localization;

using Base2.Localization;

namespace Base2.Orchestration;

public class SequenceEnrollmentService(
    ILogger<SequenceEnrollmentService> logger,
    IStringLocalizer<OrchestrationServiceResource> localizer,
    WarehouseDbContext dbContext,
    IMailboxRotationService mailboxRotationService)
{
    private readonly ILogger _logger = logger;
    private readonly IStringLocalizer _localizer = localizer;
    // ... other fields
}
```

**Key Points**:
- Use `IStringLocalizer<OrchestrationServiceResource>` - the generic type parameter matches the marker class
- Multiple services can share the same resource file by using the same marker class
- Store as `IStringLocalizer` (non-generic) field for convenience
- Inject via primary constructor (preferred) or traditional constructor

---

## Step 4: Use Localizer for Exception Messages

Replace hardcoded exception messages with localized strings:

```csharp
// Before (hardcoded)
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

**Pattern**:
1. Use the English text as the resource key (indexer parameter)
2. Store the result in a variable
3. Pass to the exception constructor

**Why store in a variable?**: This makes the code more readable and allows for potential formatting or additional processing if needed. This is optional.

---

## Step 5: Create Shared Resource Files

### 5.1 File Location and Naming

Resource files are placed in the `Resources` folder and named after the marker class:

```
Base2.Services/src/Resources/Localization
├── OrchestrationServiceResource.en-US.resx    # English (default)
├── OrchestrationServiceResource.fr.resx        # French
├── OrchestrationServiceResource.de.resx        # German
├── OrchestrationServiceResource.el.resx        # Greek
└── OrchestrationServiceResource.es.resx        # Spanish
```

**Critical Rules**:
- **Location**: Place all resource files in the `Resources` folder (with subfolder matching the namespace under the root namespace)
- **Naming**: `{MarkerClassName}.{culture}.resx` (e.g., `OrchestrationServiceResource.fr.resx`)
- **Default culture**: Use `en-US` for the default English file (not just `en`)
- **Shared across services**: Multiple services can use the same resource file by injecting `IStringLocalizer<MarkerClass>`

### 5.2 Resource File Structure

**File**: `OrchestrationServiceResource.en-US.resx` (English - default)

This boilerplate can be generated by Visual Studio. The file contains all localized strings for services that use `OrchestrationServiceResource`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <!-- ... schema comments ... -->
  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <!-- ... schema definition ... -->
  </xsd:schema>
  <resheader name="resmimetype">
    <value>text/microsoft-resx</value>
  </resheader>
  <resheader name="version">
    <value>1.3</value>
  </resheader>
  <resheader name="reader">
    <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=2.0.3500.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
  <resheader name="writer">
    <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=2.0.3500.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
  <data name="Sequence has no steps. Add at least one step before enrolling contacts." xml:space="preserve">
    <value>Sequence has no steps. Add at least one step before enrolling contacts.</value>
  </data>
  <!-- Add more entries for other services in the same namespace -->
</root>
```

**File**: `OrchestrationServiceResource.fr.resx` (French)

```xml
<?xml version="1.0" encoding="utf-8"?>
<root>
  <!-- ... same schema ... -->
  <data name="Sequence has no steps. Add at least one step before enrolling contacts." xml:space="preserve">
    <value>La séquence n'a pas d'étapes. Ajoutez au moins une étape avant d'inscrire des contacts.</value>
  </data>
  <!-- Same keys as en-US file, with translated values -->
</root>
```

### 5.3 Resource Key Rules

- **Key = English text**: Use the English version as the resource key
- **xml:space="preserve"**: Always include this attribute to preserve whitespace
- **Same key across all files**: The `<data name="...">` must be identical in all language files
- **Consolidated entries**: All strings for services using the same marker class go in the same resource file

### 5.4 Creating Resource Files

**Option 1: Visual Studio**
1. Right-click the `Resources` folder
2. Add → New Item → Resources File
3. Name it `{MarkerClassName}.{culture}.resx` (e.g., `OrchestrationServiceResource.en-US.resx`)
4. Add entries using the designer

**Option 2: Manual Creation**
1. Copy an existing `.resx` file
2. Rename to match the pattern `{MarkerClassName}.{culture}.resx`
3. Update the `<value>` elements with translations
4. Keep the `<data name="...">` keys identical across all language files

**Benefits of Shared Resources**:
- **Reduced file proliferation**: One set of resource files per feature area instead of per service
- **Easier maintenance**: Update translations in one place
- **Consistent translations**: Shared strings are guaranteed to be consistent across services

---

## Alternative Approach: Per-Class Resources

While the shared resource approach (Steps 2-5 above) is recommended to minimize file proliferation, you can also use per-class resources where each service has its own resource files.

### When to Use Per-Class Resources

- Service has many unique strings not shared with other services
- You want complete isolation of translations per service
- Team prefers explicit per-service organization

### Per-Class Implementation

**Step A: Inject IStringLocalizer with Service Class**

Instead of using a marker class, inject `IStringLocalizer<T>` where `T` is the service class itself:

```csharp
using Microsoft.Extensions.Localization;

namespace Base2.Orchestration;

public class SequenceEnrollmentService(
    ILogger<SequenceEnrollmentService> logger,
    IStringLocalizer<SequenceEnrollmentService> localizer,  // <-- Service class as type parameter
    WarehouseDbContext dbContext)
{
    private readonly ILogger _logger = logger;
    private readonly IStringLocalizer _localizer = localizer;
    // ... other fields
}
```

**Step B: Create Per-Class Resource Files**

Place resource files in the `Resources` folder, in a subfolder matching the namespace:

```
Base2.Services/src/Resources/
└── Orchestration/                                    # Matches namespace
    ├── SequenceEnrollmentService.en-US.resx         # One service
    ├── SequenceEnrollmentService.fr.resx
    ├── SequenceEnrollmentService.de.resx
    ├── SequenceEnrollmentService.el.resx
    ├── SequenceEnrollmentService.es.resx
    ├── SequenceService.en-US.resx                   # Another service
    ├── SequenceService.fr.resx
    └── ...                                           # More services = more files
```

**File Naming Rules**:
- `{ServiceClassName}.{culture}.resx`
- Must be in `Resources/{Namespace}/` folder structure
- Namespace path must match the service's namespace (e.g., `Orchestration` for `Base2.Orchestration`)

**Trade-offs**:
- **Pros**: Complete isolation per service, explicit organization
- **Cons**: File proliferation (5 files per service), duplicate translations, harder maintenance

### Per-Class Resource Discovery

The system discovers resources based on:

1. **Service class namespace**: `Base2.Orchestration.SequenceEnrollmentService`
2. **Resource file location**: `Resources/Orchestration/` folder
3. **Resource name**: `SequenceEnrollmentService.{culture}.resx`

The folder structure under `Resources` must match the namespace structure.

---

## Step 6: How Resource Discovery Works (Shared Resources)

The localization system automatically discovers resources based on:

1. **Marker class namespace**: `Base2.Localization.OrchestrationServiceResource`
2. **Resource file location**: Files in `Resources/` folder
3. **Resource name**: `Base2.Localization.OrchestrationServiceResource.{culture}`

**How it works**:
- When you inject `IStringLocalizer<OrchestrationServiceResource>`, the system looks for resource files named `OrchestrationServiceResource.{culture}.resx`
- The resource files must be in the `Resources` folder
- The marker class namespace determines the fully qualified resource name
- Multiple services can inject `IStringLocalizer<OrchestrationServiceResource>` to share the same resource file

**Important**: The resource file name must match the marker class name exactly, and the marker class namespace determines where the system looks for resources.

---

## Step 7: Testing Localization

### 7.1 Setting Culture in HTTP Requests

For web applications, set the `Accept-Language` header:

```http
GET /api/orchestration/sequence-enrollment
Accept-Language: fr
```

Or use query string (if configured):

```
GET /api/orchestration/sequence-enrollment?culture=fr
```

### 7.2 Verifying Translations

1. **Default (English)**: Don't set `Accept-Language` or set to `en-US`
2. **French**: Set `Accept-Language: fr`
3. **Other languages**: Set appropriate culture code

The exception message should reflect the selected culture.

---

## Common Patterns

### Pattern 1: Simple Exception Message

```csharp
if (condition)
{
    string message = _localizer["Resource key text"];
    throw new InvalidOperationException(message);
}
```

### Pattern 2: Multiple Localized Messages

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

### Pattern 3: Formatted Messages (Future Enhancement)

For messages with parameters, use string formatting:

```csharp
// In resource file: "Cannot enroll {0} contacts. Maximum is {1}."
string message = _localizer["Cannot enroll {0} contacts. Maximum is {1}.", count, max];
throw new InvalidOperationException(message);
```

**Note**: This pattern requires updating resource files to use placeholders. For now, prefer simple string keys.

---

## Troubleshooting

### Issue: "Unable to resolve service for type IStringLocalizer"

**Solution**: Ensure `AddLocalization()` is called before `AddServices()` in `Program.cs`:

```csharp
builder.Services.AddLocalization();  // Must be before services that use it
builder.Services.AddServices();
```

### Issue: Resources not found / English text returned

**Possible Causes**:
1. **Wrong file location**: Resource files must be in the `Resources` folder
2. **Wrong naming**: Files must be named `{MarkerClassName}.{culture}.resx`
3. **Namespace mismatch**: Marker class namespace doesn't match resource file location
4. **Missing resource entry**: The key doesn't exist in the resource file
5. **Wrong marker class**: Service is injecting `IStringLocalizer<WrongClass>`

**Solution**: 
- Verify resource files are in the `Resources` folder
- Check file naming matches marker class name exactly (e.g., `OrchestrationServiceResource.en-US.resx`)
- Ensure marker class namespace matches where resources are expected
- Verify service is injecting `IStringLocalizer<MarkerClass>` not `IStringLocalizer<ServiceClass>`
- Ensure resource key exists in all language files
- Rebuild the project to ensure resources are embedded

### Issue: Resources work in Web but not Background service

**Solution**: Background services also need `AddLocalization()`:

```csharp
builder.Services.AddLocalization();  // Required for background services too
builder.Services.AddServices();
```

### Issue: Culture not being detected

**For Web Applications**:
- Ensure `UseRequestLocalization()` middleware is in the pipeline
- Check `Accept-Language` header is being sent
- Verify culture is in the supported cultures list

**For Background Services**:
- Background services default to the default culture (`en-US`)
- To use a different culture, set it explicitly in code or configuration

---

## Best Practices

1. **Always create all language files**: Even if initially copying from English, create all 5 language files
2. **Use English as the key**: The resource key should be the English text
3. **Keep keys consistent**: Use the same key across all language files
4. **Use shared resources**: Create marker classes to consolidate resources and reduce file proliferation
5. **Group by feature area**: Use one marker class per feature area/namespace (e.g., `OrchestrationServiceResource`, `ProspectingServiceResource`)
6. **Place files correctly**: Resource files must be in the `Resources` folder
7. **Test all languages**: Verify translations work for all supported cultures
8. **Use meaningful keys**: The key (English text) should be descriptive and clear
9. **Default culture naming**: Use `en-US` (not just `en`) for the default English resource file

---

## File Structure Example

For services in the `Orchestration` namespace using shared resources:

```
Base2.Services/src/
├── Localization/
│   └── OrchestrationServiceResource.cs    # Marker class
├── Orchestration/
│   ├── SequenceEnrollmentService.cs       # Uses IStringLocalizer<OrchestrationServiceResource>
│   ├── SequenceService.cs                  # Also uses IStringLocalizer<OrchestrationServiceResource>
│   └── SequenceExecutionService.cs         # Also uses IStringLocalizer<OrchestrationServiceResource>
└── Resources/
    ├── OrchestrationServiceResource.en-US.resx    # Shared resource file
    ├── OrchestrationServiceResource.fr.resx
    ├── OrchestrationServiceResource.de.resx
    ├── OrchestrationServiceResource.el.resx
    └── OrchestrationServiceResource.es.resx
```

**Benefits**: All orchestration services share the same resource files, reducing duplication and making maintenance easier.

---

## Complete Example

### Marker Class

**File**: `Base2.Services/src/Localization/OrchestrationServiceResource.cs`

```csharp
namespace Base2.Localization;

/// <summary>
/// Marker class for shared orchestration service resources.
/// This class is never instantiated - it's only used for resource discovery.
/// </summary>
internal class OrchestrationServiceResource
{
}
```

### Service Class

**File**: `Base2.Services/src/Orchestration/SequenceEnrollmentService.cs`

```csharp
using Microsoft.Extensions.Localization;

using Base2.Localization;

namespace Base2.Orchestration;

public class SequenceEnrollmentService(
    ILogger<SequenceEnrollmentService> logger,
    IStringLocalizer<OrchestrationServiceResource> localizer,
    WarehouseDbContext dbContext)
{
    private readonly ILogger _logger = logger;
    private readonly IStringLocalizer _localizer = localizer;
    private readonly WarehouseDbContext _dbContext = dbContext;

    public async Task<EnrollmentResult> EnrollContactsAsync(
        Guid tenantId, Guid groupId, long sequenceId, long[] contactIds)
    {
        var sequence = await _dbContext.Sequences
            .Include(s => s.Steps)
            .Where(s => s.Id == sequenceId)
            .SingleOrDefaultAsync();

        if (sequence is null)
        {
            throw new InvalidOperationException("Sequence not found.");
        }

        var firstStep = sequence.Steps
            .OrderBy(s => s.StepNumber)
            .FirstOrDefault();

        if (firstStep == null)
        {
            string message = _localizer["Sequence has no steps. Add at least one step before enrolling contacts."];
            throw new InvalidOperationException(message);
        }

        // ... rest of method
    }
}
```

### Resource File (English)

**File**: `Base2.Services/src/Resources/OrchestrationServiceResource.en-US.resx`

```xml
<data name="Sequence has no steps. Add at least one step before enrolling contacts." xml:space="preserve">
  <value>Sequence has no steps. Add at least one step before enrolling contacts.</value>
</data>
```

### Resource File (French)

**File**: `Base2.Services/src/Resources/OrchestrationServiceResource.fr.resx`

```xml
<data name="Sequence has no steps. Add at least one step before enrolling contacts." xml:space="preserve">
  <value>La séquence n'a pas d'étapes. Ajoutez au moins une étape avant d'inscrire des contacts.</value>
</data>
```

**Note**: Other services in the `Orchestration` namespace can inject `IStringLocalizer<OrchestrationServiceResource>` to use the same resource file.

---

## Choosing Between Approaches

| Aspect | Shared Resources (Recommended) | Per-Class Resources |
|--------|-------------------------------|---------------------|
| **File Count** | 5 files per feature area | 5 files × number of services |
| **Maintenance** | Easier - one place to update | Harder - multiple files to update |
| **Duplication** | Minimal - shared translations | High - duplicate translations |
| **Isolation** | Services share resources | Complete per-service isolation |
| **Use When** | Multiple services in same namespace | Service needs unique resources |
| **Best For** | Most scenarios | Rare cases requiring isolation |

**Recommendation**: Use shared resources unless you have a specific need for per-service isolation.

---

## Related Documentation

### Internal Documentation

- [Client i18n Localization Pattern](../client/i18n-localization-pattern.md) - Client-side localization
- [Server Feature Template](./server-feature-template.md) - Complete feature development guide

### Microsoft Documentation

- [Make an ASP.NET Core app's content localizable](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization/make-content-localizable?view=aspnetcore-10.0) - Official guide for using `IStringLocalizer` and resource files
- [Shared resources](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization/make-content-localizable?view=aspnetcore-10.0#shared-resources) - Using marker classes to create shared resource files (this pattern)
- [How to create user-defined exceptions with localized exception messages](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/how-to-create-localized-exception-messages) - Guide for creating localized exception messages using satellite assemblies

---

## Summary Checklist

### Common Steps (Both Approaches)

- [ ] Added `AddLocalization()` to `Program.cs` (Web and Background)
- [ ] Added `UseRequestLocalization()` middleware (Web only)
- [ ] Configured `RequestLocalizationOptions` with supported cultures
- [ ] Added resource entries with English text as key
- [ ] Created all 5 language files (en-US, fr, de, el, es)
- [ ] Replaced hardcoded exception messages with localized strings
- [ ] Tested with different cultures

### Shared Resources Approach (Recommended)

- [ ] Created marker class for shared resources (e.g., `OrchestrationServiceResource`)
- [ ] Injected `IStringLocalizer<MarkerClass>` in service classes
- [ ] Created resource files in `Resources` folder
- [ ] Named files `{MarkerClassName}.{culture}.resx`

### Per-Class Resources Approach (Alternative)

- [ ] Injected `IStringLocalizer<ServiceClass>` in service class
- [ ] Created resource files in `Resources/{Namespace}/` folder
- [ ] Named files `{ServiceClassName}.{culture}.resx`

---

**Last Updated**: 2025-01-18  
**Maintained By**: Engineering Team
