# Keyed Services Injection Guide

## Overview

With the multi-database RLS implementation, `IRequestDbGuard` is now registered as a **keyed service**. This means you must specify which database's guard you want when injecting it into controllers or services.

## Quick Reference

### Database Keys

| Database | Key | Use For |
|----------|-----|---------|
| **AppDbContext** | `nameof(AppDbContext)` | Users, tenants, organizations, access control |
| **WarehouseDbContext** | `nameof(WarehouseDbContext)` | Contacts, sequences, campaigns, domain entities |

### Injection Syntax

```csharp
// ✅ Correct - Keyed service injection
public MyController(
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
{ }

// ❌ Incorrect - Non-keyed injection (will fail)
public MyController(IRequestDbGuard guard)
{ }
```

## When to Inject IRequestDbGuard

### ⚠️ Important: Prefer Attributes Over Manual Injection

**Most of the time, you should NOT inject `IRequestDbGuard` directly.** Instead, use the `[TenantRead]` and `[TenantWrite]` attributes:

```csharp
// ✅ Preferred: Use attributes
[HttpGet]
[TenantRead(nameof(AppDbContext))]
public async Task<ActionResult> GetOrganization(long id)
{
    // Guard is automatically called by the attribute
    var org = await _service.ReadAsync(id);
    return Ok(org);
}

// ❌ Avoid: Manual injection and guard calls
[HttpGet]
public async Task<ActionResult> GetOrganization(long id)
{
    await _guard.EnsureReadAsync();  // Unnecessary boilerplate
    var org = await _service.ReadAsync(id);
    return Ok(org);
}
```

### When Manual Injection IS Appropriate

Inject `IRequestDbGuard` only when you need **dynamic control** over transactions:

1. **Read-then-write patterns** (check existence, then update)
2. **Conditional writes** (write only if validation passes)
3. **Complex multi-step operations** with transaction control

## Injection Examples

### Controllers

#### Example 1: Control Plane Controller (AppDbContext)

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Base2.Data.Identity;
using Base2.Data;

[ApiController]
[Route("api/organizations")]
public class OrganizationController(
    ILogger<OrganizationController> logger,
    OrganizationService service,
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly OrganizationService _service = service;
    private readonly IRequestDbGuard _guard = guard;

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(long id, OrganizationModel model)
    {
        // Read first to check existence
        await _guard.EnsureReadAsync();
        var existing = await _service.ReadAsync(id);
        if (existing == null)
            return NotFound();

        // Promote to write
        await _guard.EnsureWriteAsync();
        var updated = await _service.UpdateAsync(id, model);
        return Ok(updated);
    }
}
```

#### Example 2: Data Plane Controller (WarehouseDbContext)

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Base2.Data.Identity;
using Base2.Data;

[ApiController]
[Route("api/contacts")]
public class ContactController(
    ILogger<ContactController> logger,
    ContactService service,
    [FromKeyedServices(nameof(WarehouseDbContext))] IRequestDbGuard guard) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly ContactService _service = service;
    private readonly IRequestDbGuard _guard = guard;

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(Guid id, ContactModel model)
    {
        // Read-then-write pattern
        await _guard.EnsureReadAsync();
        var existing = await _service.ReadAsync(id);
        if (existing == null)
            return NotFound();

        await _guard.EnsureWriteAsync();
        var updated = await _service.UpdateAsync(id, model);
        return Ok(updated);
    }
}
```

#### Example 3: Multi-Database Controller

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Base2.Core.Data.Identity;
using Base2.Data;

[ApiController]
[Route("api/contacts")]
public class ContactController(
    ILogger<ContactController> logger,
    ContactService contactService,
    UserService userService,
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard appGuard,
    [FromKeyedServices(nameof(WarehouseDbContext))] IRequestDbGuard warehouseGuard) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly ContactService _contactService = contactService;
    private readonly UserService _userService = userService;
    private readonly IRequestDbGuard _appGuard = appGuard;
    private readonly IRequestDbGuard _warehouseGuard = warehouseGuard;

    [HttpPost("assign-owner")]
    public async Task<ActionResult> AssignOwner(Guid contactId, Guid ownerId)
    {
        // Validate owner exists in AppDbContext
        await _appGuard.EnsureReadAsync();
        var owner = await _userService.ReadAsync(ownerId);
        if (owner == null)
            return BadRequest("Owner not found");

        // Update contact in WarehouseDbContext
        await _warehouseGuard.EnsureWriteAsync();
        await _contactService.AssignOwnerAsync(contactId, ownerId);

        return NoContent();
    }
}
```

### Services

Services typically **should NOT** inject `IRequestDbGuard`. The guard is a **controller-level concern** for managing request-scoped transactions.

#### ❌ Anti-Pattern: Guard in Service

```csharp
// ❌ Don't do this
public class ContactService
{
    private readonly WarehouseDbContext _db;
    private readonly IRequestDbGuard _guard;  // ❌ Services shouldn't manage guards

    public ContactService(
        WarehouseDbContext db,
        [FromKeyedServices(nameof(WarehouseDbContext))] IRequestDbGuard guard)
    {
        _db = db;
        _guard = guard;
    }

    public async Task<Contact> ReadAsync(Guid id)
    {
        await _guard.EnsureReadAsync();  // ❌ Controller should handle this
        return await _db.Contacts.FindAsync(id);
    }
}
```

#### ✅ Correct Pattern: Guard in Controller

```csharp
// ✅ Controller manages guard
[HttpGet("{id}")]
[TenantRead(nameof(WarehouseDbContext))]  // ✅ Attribute handles guard
public async Task<ActionResult> GetContact(Guid id)
{
    var contact = await _contactService.ReadAsync(id);  // Service is pure data access
    return Ok(contact);
}

// ✅ Service is pure data access
public class ContactService
{
    private readonly WarehouseDbContext _db;

    public ContactService(WarehouseDbContext db)
    {
        _db = db;
    }

    public async Task<Contact> ReadAsync(Guid id)
    {
        return await _db.Contacts.FindAsync(id);  // No guard needed
    }
}
```

## Migration Checklist

### Step 1: Find All IRequestDbGuard Injections

```bash
# Search for IRequestDbGuard constructor parameters
grep -r "IRequestDbGuard" --include="*.cs" src/server
```

### Step 2: Update Each Injection

For each occurrence, determine which database it uses:

**Uses AppDbContext?**
- Works with: Users, Tenants, Organizations, Roles, Permissions
- Update to: `[FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard`

**Uses WarehouseDbContext?**
- Works with: Contacts, Sequences, Campaigns, Templates, Activities
- Update to: `[FromKeyedServices(nameof(WarehouseDbContext))] IRequestDbGuard guard`

### Step 3: Add Required Usings

```csharp
using Microsoft.Extensions.DependencyInjection;  // For [FromKeyedServices]
using Base2.Data;                      // For nameof(AppDbContext) / nameof(WarehouseDbContext)
```

### Step 4: Consider Removing Guard Injection

Ask yourself: **Can I use `[TenantRead]` or `[TenantWrite]` instead?**

If yes, remove the guard injection and use attributes:

```csharp
// Before
public MyController(
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
{
    _guard = guard;
}

[HttpGet]
public async Task<ActionResult> Get()
{
    await _guard.EnsureReadAsync();
    // ...
}

// After
public MyController()  // No guard injection needed
{
}

[HttpGet]
[TenantRead(nameof(AppDbContext))]  // Attribute handles it
public async Task<ActionResult> Get()
{
    // No guard call needed
    // ...
}
```

## Common Errors

### Error 1: Missing [FromKeyedServices]

```csharp
// ❌ Error: Cannot resolve IRequestDbGuard
public MyController(IRequestDbGuard guard)

// ✅ Fix: Add [FromKeyedServices]
public MyController(
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
```

### Error 2: Wrong Database Key

```csharp
// ❌ Error: Using AppDbContext guard for Warehouse operations
[FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard

// Works with Contacts (WarehouseDbContext)
await _contactService.ReadAsync(id);  // ⚠️ Wrong guard!

// ✅ Fix: Use correct database key
[FromKeyedServices(nameof(WarehouseDbContext))] IRequestDbGuard guard
```

### Error 3: String Literal Instead of nameof()

```csharp
// ❌ Not type-safe
[FromKeyedServices("AppDbContext")] IRequestDbGuard guard

// ✅ Type-safe with nameof()
[FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard
```

### Error 4: Guard in Service Layer

```csharp
// ❌ Services shouldn't manage guards
public class MyService
{
    public MyService([FromKeyedServices(...)] IRequestDbGuard guard) { }
}

// ✅ Use attributes in controller instead
[TenantRead(nameof(AppDbContext))]
public async Task<ActionResult> Get() { ... }
```

## Testing with Keyed Services

### Unit Tests

When testing controllers that inject keyed guards:

```csharp
[Fact]
public async Task GetOrganization_ShouldReturnOrganization()
{
    // Arrange
    var mockGuard = new Mock<IRequestDbGuard>();
    var mockService = new Mock<OrganizationService>();
    
    // Use keyed service provider
    var services = new ServiceCollection();
    services.AddKeyedScoped<IRequestDbGuard>(
        nameof(AppDbContext),
        (sp, key) => mockGuard.Object
    );
    
    var serviceProvider = services.BuildServiceProvider();
    var controller = ActivatorUtilities.CreateInstance<OrganizationController>(
        serviceProvider
    );
    
    // Act
    var result = await controller.GetOrganization(1);
    
    // Assert
    result.Should().BeOfType<OkObjectResult>();
}
```

### Integration Tests

```csharp
[Fact]
public async Task GetContact_WithRls_ShouldIsolateTenants()
{
    // Arrange
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);
    
    // Guards are automatically registered by the container
    var appGuard = container.GetKeyedService<IRequestDbGuard>(nameof(AppDbContext));
    var warehouseGuard = container.GetKeyedService<IRequestDbGuard>(nameof(WarehouseDbContext));
    
    // Act & Assert
    appGuard.Should().NotBeNull();
    warehouseGuard.Should().NotBeNull();
}
```

## Related Documentation

- [Multi-Database RLS Usage](./multi-database-rls-usage.md) - Usage patterns
- [RLS Patterns](../../patterns/server/rls-patterns.md) - RLS fundamentals

---

**Last Updated**: 2025-12-06  
**Status**: Active  
**Author**: Engineering Team

