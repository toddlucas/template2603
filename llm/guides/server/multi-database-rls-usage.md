# Multi-Database RLS Usage Guide

## Overview

The RLS system now supports multiple database contexts per request. This guide shows how to use the multi-database RLS attributes in your controllers.

## Database Keys

Guards are registered using `nameof()` for type safety:

| Database | Key | Purpose |
|----------|-----|---------|
| **AppDbContext** | `nameof(AppDbContext)` | Control plane (users, tenants, organizations) |
| **WarehouseDbContext** | `nameof(WarehouseDbContext)` | Data plane (contacts, sequences, campaigns) |

## Attribute Syntax

Both `[TenantRead]` and `[TenantWrite]` accept a `params string[]` of database keys:

```csharp
// Single database (default: AppDbContext)
[TenantRead]

// Explicit single database
[TenantRead(nameof(WarehouseDbContext))]

// Multiple databases
[TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
```

## Usage Patterns

### Pattern 1: Default (Control Plane Only)

Most endpoints that work with users, organizations, or tenants use AppDbContext by default.

```csharp
[HttpGet("{id}")]
[TenantRead]  // Defaults to AppDbContext
public async Task<ActionResult<OrganizationModel>> GetOrganization(long id)
{
    var org = await _organizationService.ReadOrDefaultAsync(id);
    if (org == null)
        return NotFound();
    return Ok(org);
}

[HttpPost]
[TenantWrite]  // Defaults to AppDbContext
public async Task<ActionResult<OrganizationModel>> CreateOrganization(OrganizationModel model)
{
    var org = await _organizationService.CreateAsync(model);
    return CreatedAtAction(nameof(GetOrganization), new { id = org.Id }, org);
}
```

### Pattern 2: Data Plane Only

Endpoints that work exclusively with Warehouse domain entities use WarehouseDbContext.

```csharp
[HttpGet("{id}")]
[TenantRead(nameof(WarehouseDbContext))]
public async Task<ActionResult<ContactModel>> GetContact(Guid id)
{
    var contact = await _contactService.ReadOrDefaultAsync(id);
    if (contact == null)
        return NotFound();
    return Ok(contact);
}

[HttpPost]
[TenantWrite(nameof(WarehouseDbContext))]
public async Task<ActionResult<ContactModel>> CreateContact(ContactModel model)
{
    var contact = await _contactService.CreateAsync(model);
    return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
}

[HttpDelete("{id}")]
[TenantWrite(nameof(WarehouseDbContext))]
public async Task<ActionResult> DeleteContact(Guid id)
{
    await _contactService.DeleteAsync(id);
    return NoContent();
}
```

### Pattern 3: Multiple Databases (Read-Only)

When you need to read from both databases, specify both in the attribute.

```csharp
[HttpGet("{contactId}/with-owner")]
[TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
public async Task<ActionResult<ContactWithOwnerDto>> GetContactWithOwner(Guid contactId)
{
    // Both guards have been called by the attribute
    
    // Read from WarehouseDbContext
    var contact = await _contactService.ReadOrDefaultAsync(contactId);
    if (contact == null)
        return NotFound();
    
    // Read from AppDbContext
    var owner = await _userService.ReadOrDefaultAsync(contact.OwnerId);
    
    return Ok(new ContactWithOwnerDto
    {
        Contact = contact,
        Owner = owner
    });
}

[HttpGet("dashboard")]
[TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
public async Task<ActionResult<DashboardDto>> GetDashboard()
{
    var user = await _userService.GetCurrentUserAsync();
    var organization = await _organizationService.ReadOrDefaultAsync(user.OrganizationId);
    var contactCount = await _contactService.GetCountAsync();
    var activeSequences = await _sequenceService.GetActiveAsync();
    
    return Ok(new DashboardDto
    {
        User = user,
        Organization = organization,
        ContactCount = contactCount,
        ActiveSequences = activeSequences
    });
}
```

### Pattern 4: Multiple Databases (Mixed Read/Write)

For complex operations that write to multiple databases, you have two options:

#### Option A: Use Multiple Write Attributes (Recommended)

```csharp
[HttpPost("contacts/import-from-organization")]
[TenantWrite(nameof(AppDbContext), nameof(WarehouseDbContext))]
public async Task<ActionResult<ImportResultDto>> ImportContactsFromOrganization(ImportRequestDto request)
{
    // Both write guards are active
    
    // Create audit record in AppDbContext
    var auditRecord = await _auditService.CreateAsync(new AuditModel
    {
        Action = "ContactImport",
        UserId = User.GetNameIdentifier()
    });
    
    // Import contacts in WarehouseDbContext
    var contacts = await _contactService.BulkCreateAsync(request.Contacts);
    
    return Ok(new ImportResultDto
    {
        AuditRecordId = auditRecord.Id,
        ContactsImported = contacts.Count
    });
}
```

#### Option B: Manual Guard Access for Complex Scenarios

```csharp
[HttpPost("contacts/with-user")]
[TenantRead(nameof(AppDbContext))]  // Start with read to check permissions
public async Task<ActionResult<ContactModel>> CreateContactWithUserCheck(ContactModel model)
{
    // AppDb read transaction is active (from attribute)
    
    // Check if user has permission in AppDbContext
    var user = await _userService.GetCurrentUserAsync();
    if (!user.CanCreateContacts)
        return Forbid();
    
    // Now we need to write to WarehouseDbContext
    var warehouseGuard = AmbientRequestGuard.Get(nameof(WarehouseDbContext));
    await warehouseGuard.EnsureWriteAsync();
    
    var contact = await _contactService.CreateAsync(model);
    return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
}
```

### Pattern 5: Mixing Attributes (Class-Level + Method-Level)

You can apply attributes at both class and method levels. Method-level attributes take precedence.

```csharp
[ApiController]
[Route("api/contacts")]
[TenantRead(nameof(WarehouseDbContext))]  // Default for all read operations
public class ContactController : ControllerBase
{
    // Uses class-level [TenantRead] → WarehouseDbContext read
    [HttpGet]
    public async Task<ActionResult<ContactModel[]>> List()
    {
        var contacts = await _contactService.ListAsync();
        return Ok(contacts);
    }
    
    // Uses class-level [TenantRead] → WarehouseDbContext read
    [HttpGet("{id}")]
    public async Task<ActionResult<ContactModel>> Get(Guid id)
    {
        var contact = await _contactService.ReadOrDefaultAsync(id);
        return Ok(contact);
    }
    
    // Override with method-level attribute
    [HttpGet("{id}/with-owner")]
    [TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
    public async Task<ActionResult<ContactWithOwnerDto>> GetWithOwner(Guid id)
    {
        var contact = await _contactService.ReadOrDefaultAsync(id);
        var owner = await _userService.ReadOrDefaultAsync(contact.OwnerId);
        return Ok(new ContactWithOwnerDto { Contact = contact, Owner = owner });
    }
    
    // Writes need explicit attribute (class-level is read-only)
    [HttpPost]
    [TenantWrite(nameof(WarehouseDbContext))]
    public async Task<ActionResult<ContactModel>> Create(ContactModel model)
    {
        var contact = await _contactService.CreateAsync(model);
        return CreatedAtAction(nameof(Get), new { id = contact.Id }, contact);
    }
}
```

## Common Scenarios

### Scenario 1: Create Domain Entity with Audit Log

```csharp
[HttpPost]
[TenantWrite(nameof(AppDbContext), nameof(WarehouseDbContext))]
public async Task<ActionResult<ContactModel>> CreateContactWithAudit(ContactModel model)
{
    // Both write transactions are active
    
    // Create contact in WarehouseDbContext
    var contact = await _contactService.CreateAsync(model);
    
    // Log in AppDbContext
    await _auditService.LogAsync($"Created contact {contact.Id}");
    
    return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, contact);
}
```

### Scenario 2: Read-Then-Write Pattern

```csharp
[HttpPut("{id}")]
[TenantRead(nameof(WarehouseDbContext))]  // Start with read
public async Task<ActionResult<ContactModel>> UpdateContact(Guid id, ContactModel model)
{
    // Read transaction is active
    var existing = await _contactService.ReadOrDefaultAsync(id);
    if (existing == null)
        return NotFound();
    
    // Manually promote to write
    var guard = AmbientRequestGuard.Get(nameof(WarehouseDbContext));
    await guard.EnsureWriteAsync();
    
    // Now update
    var updated = await _contactService.UpdateAsync(id, model);
    return Ok(updated);
}
```

### Scenario 3: Cross-Database Validation

```csharp
[HttpPost("contacts/assign-owner")]
[TenantRead(nameof(AppDbContext))]
[TenantWrite(nameof(WarehouseDbContext))]
public async Task<ActionResult> AssignContactOwner(Guid contactId, Guid ownerId)
{
    // Validate owner exists in AppDbContext (read)
    var owner = await _userService.ReadOrDefaultAsync(ownerId);
    if (owner == null)
        return BadRequest("Owner not found");
    
    // Update contact in WarehouseDbContext (write)
    await _contactService.AssignOwnerAsync(contactId, ownerId);
    
    return NoContent();
}
```

## Best Practices

### ✅ DO:

1. **Use `nameof()` for database keys**
   ```csharp
   [TenantRead(nameof(WarehouseDbContext))]  // ✅ Type-safe
   ```

2. **Default to AppDbContext for infrastructure endpoints**
   ```csharp
   [TenantRead]  // ✅ Defaults to AppDbContext
   ```

3. **Specify WarehouseDbContext explicitly for domain operations**
   ```csharp
   [TenantRead(nameof(WarehouseDbContext))]  // ✅ Clear intent
   ```

4. **Use multiple databases when you need both**
   ```csharp
   [TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]  // ✅ Explicit
   ```

5. **Start with read, manually promote to write for read-then-write patterns**
   ```csharp
   [TenantRead(nameof(WarehouseDbContext))]
   public async Task<ActionResult> Update(...)
   {
       // Read first
       var existing = await _service.ReadAsync(...);
       
       // Promote to write
       var guard = AmbientRequestGuard.Get(nameof(WarehouseDbContext));
       await guard.EnsureWriteAsync();
       
       // Now write
       await _service.UpdateAsync(...);
   }
   ```

### ❌ DON'T:

1. **Don't use string literals for database keys**
   ```csharp
   [TenantRead("WarehouseDbContext")]  // ❌ Not type-safe
   ```

2. **Don't mix databases unnecessarily**
   ```csharp
   [TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
   public async Task<ActionResult> GetOrganization(...)  // ❌ Only needs AppDbContext
   ```

3. **Don't forget to specify database for Warehouse operations**
   ```csharp
   [TenantRead]  // ❌ This will use AppDbContext, not WarehouseDbContext!
   public async Task<ActionResult> GetContact(...) { ... }
   ```

4. **Don't skip guards for multi-database write operations**
   ```csharp
   [HttpPost]
   [TenantWrite(nameof(WarehouseDbContext))]  // ❌ Missing AppDbContext
   public async Task<ActionResult> CreateContactWithAudit(...)
   {
       await _contactService.CreateAsync(...);
       await _auditService.LogAsync(...);  // ⚠️ Will fail without AppDbContext write guard
   }
   ```

## Testing Multi-Database RLS

### Unit Test Example

```csharp
[Fact]
public async Task CreateContact_WithAudit_ShouldUseBothDatabases()
{
    // Arrange
    using var container = new TestDbContextContainer();
    await container.CreateAsync(
        DatabaseNames.App, 
        DatabaseNames.Warehouse
    );
    
    using var scope = container.BeginScope();
    var appDb = scope.App;
    var warehouseDb = scope.Warehouse;
    
    // Create tenant and user in control plane
    var tenant = new ApplicationTenant { Name = "Test Tenant" };
    appDb.Tenants.Add(tenant);
    await appDb.SaveChangesAsync();
    
    // Create contact in data plane
    var contact = new Contact 
    { 
        TenantId = tenant.Id,
        Email = "test@example.com"
    };
    warehouseDb.Contacts.Add(contact);
    await warehouseDb.SaveChangesAsync();
    
    // Assert
    var savedContact = await warehouseDb.Contacts.FindAsync(contact.Id);
    savedContact.Should().NotBeNull();
    savedContact!.TenantId.Should().Be(tenant.Id);
}
```

## Related Documentation

- [Database Architecture](../../patterns/server/database-architecture.md) - Control plane vs data plane
- [RLS Patterns](../../patterns/server/rls-patterns.md) - Row-Level Security fundamentals

---

**Last Updated**: 2025-12-06  
**Status**: Implemented  
**Author**: Engineering Team

