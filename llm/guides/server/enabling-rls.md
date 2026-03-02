# Enabling RLS for AppDbContext

## Overview

This guide walks through enabling Row-Level Security (RLS) for the AppDbContext when you start adding domain entities (Contacts, Sequences, Campaigns, etc.).

## Current State

✅ **Ready for RLS:**
- ✅ Guard registered with keyed services: `nameof(AppDbContext)`
- ✅ Middleware resolves AppDbContext guard
- ✅ Attributes support `[TenantRead(nameof(AppDbContext))]`
- ✅ RlsPolicyManager structure in place
- ✅ Infrastructure fully implemented

⏸️ **Not Yet Enabled:**
- ⏸️ No Product Name entities exist yet (AppDbContext is empty)
- ⏸️ No tables registered in RlsPolicyManager
- ⏸️ Tenant interceptor disabled for AppDbContext
- ⏸️ No RLS migration created yet

## Step-by-Step Enablement

### Step 1: Create Your First Product Name Entity

When you create your first Product Name entity (e.g., Contact), ensure it has `TenantId`:

```csharp
// In Base2.Prospecting namespace
public class Contact
{
    public Guid Id { get; set; }
    
    // ✅ Required: Multi-tenant isolation
    public Guid TenantId { get; set; }
    
    // ✅ Cross-database reference to control plane
    public Guid OrganizationId { get; set; }
    public Guid OwnerId { get; set; }  // References AppDbContext.Users
    
    // Domain properties
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    // Temporal tracking
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Soft delete
    public DateTime? DeletedAt { get; set; }
}
```

**Key Requirements:**
- ✅ Must have `Guid TenantId { get; set; }` property
- ✅ Should have `Guid OrganizationId { get; set; }` for cross-database references
- ✅ Use snake_case table names via `modelBuilder.Snakeify()`

### Step 2: Add DbSet to AppDbContext

```csharp
public class AppDbContext : DbContext
{
    // ✅ Add your entity
    public DbSet<Contact> Contacts { get; set; } = null!;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        if (IsUsingSqliteProvider)
            modelBuilder.AddSqliteDateTimeOffset();
        
        // ✅ Configure your entity
        Contact.OnModelCreating(modelBuilder);
        
        modelBuilder.Snakeify();
    }
}
```

### Step 3: Create Migration

```bash
# Navigate to the correct project
cd src/server/Base2.Data.Npgsql

# Create migration
dotnet ef migrations add AddContactEntity --context AppDbContext
```

### Step 4: Register Table in RlsPolicyManager

Update `RlsPolicyManager.cs`:

```csharp
private static readonly string[] TablesWithTenantOnly = new[]
{
    // Control Plane (AppDbContext)
    "person",
    "organization",
    "organization_member",
    
    // Data Plane (AppDbContext)
    "contact",  // ✅ Add your table
};
```

**Database Naming Convention:**
- Entity: `Contact` (PascalCase)
- DbSet: `Contacts` (plural)
- Table: `contact` (snake_case, singular via Snakeify)

### Step 5: Create RLS Migration

Create a new migration specifically for RLS:

```bash
cd src/server/Base2.Data.Npgsql

dotnet ef migrations add EnableRlsForApp --context AppDbContext
```

Update the generated migration:

```csharp
using Microsoft.EntityFrameworkCore.Migrations;
using Base2.Data;

public partial class EnableRlsForApp : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Skip RLS for SQLite (only for PostgreSQL)
        if (migrationBuilder.ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            return;

        // Enable RLS for all registered tables
        RlsPolicyManager.EnableRls(migrationBuilder);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        if (migrationBuilder.ActiveProvider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            return;

        RlsPolicyManager.DisableRls(migrationBuilder);
    }
}
```

### Step 6: Enable Tenant Guard

In `IServiceCollectionExtensions.cs`, update `AddAppDbConfiguration`:

```csharp
public static IServiceCollection AddAppDbConfiguration(
    this IServiceCollection services, 
    IConfiguration configuration)
{
    string provider = configuration.GetDatabaseProvider("AppDb", "Npgsql");
    bool addTenantGuard = configuration.IsTenantGuardEnabled();

    // Register the guard with keyed service
    if (addTenantGuard && provider == "Npgsql")
    {
        services.AddKeyedScoped<IRequestDbGuard>(
            nameof(AppDbContext),
            (serviceProvider, key) =>
            {
                var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
                var tenantContext = serviceProvider.GetRequiredService<TenantContext<Guid>>();
                return new RequestDbGuard<AppDbContext>(dbContext, tenantContext);
            });
    }
    else
    {
        services.AddKeyedScoped<IRequestDbGuard>(
            nameof(AppDbContext),
            (serviceProvider, key) => new PassthroughRequestDbGuard());
    }

    // ✅ Enable interceptor for AppDbContext
    if (addTenantInterceptor)
    {
        // Note: WriteGuardInterceptor is already registered by AddAppDbConfiguration
        // It works across all DbContexts, so no additional registration needed
    }

    // ✅ Pass addTenantInterceptor: true
    return services.AddProviderDbContext<AppDbContext>(
        configuration, 
        "AppDb", 
        "Npgsql", 
        addTenantInterceptor: addTenantInterceptor  // ✅ Enable for PostgreSQL
    );
}
```

### Step 7: Run Migrations

```bash
# Apply migrations to your database
cd src/server/Base2.Web

# For development (SQLite - RLS will be skipped)
dotnet ef database update --context AppDbContext

# For production (PostgreSQL - RLS will be enabled)
# Set connection string to PostgreSQL and run:
dotnet ef database update --context AppDbContext
```

### Step 8: Use RLS in Controllers

Now you can use RLS-protected endpoints:

```csharp
using Microsoft.AspNetCore.Mvc;
using Base2.Data;

[ApiController]
[Route("api/contacts")]
public class ContactController(
    ILogger<ContactController> logger,
    ContactService contactService) : ControllerBase
{
    // ✅ RLS automatically filters by tenant
    [HttpGet]
    [TenantRead(nameof(AppDbContext))]
    public async Task<ActionResult<ContactModel[]>> List()
    {
        var contacts = await _contactService.ListAsync();
        return Ok(contacts);
    }
    
    // ✅ RLS ensures user can only access their tenant's data
    [HttpGet("{id}")]
    [TenantRead(nameof(AppDbContext))]
    public async Task<ActionResult<ContactModel>> Get(Guid id)
    {
        var contact = await _contactService.ReadAsync(id);
        if (contact == null)
            return NotFound();
        return Ok(contact);
    }
    
    // ✅ RLS + explicit TenantId assignment
    [HttpPost]
    [TenantWrite(nameof(AppDbContext))]
    public async Task<ActionResult<ContactModel>> Create(ContactModel model)
    {
        var contact = await _contactService.CreateAsync(model);
        return CreatedAtAction(nameof(Get), new { id = contact.Id }, contact);
    }
}
```

### Step 9: Implement Service with TenantId Assignment

```csharp
public class ContactService
{
    private readonly AppDbContext _db;
    private readonly TenantContext<Guid> _tenantContext;
    private readonly ContactQuery _query;

    public ContactService(
        AppDbContext db,
        TenantContext<Guid> tenantContext,
        ILogger<ContactService> logger)
    {
        _db = db;
        _tenantContext = tenantContext;
        _query = new ContactQuery(db.Contacts, logger);
    }

    // ✅ Reads: RLS filters automatically
    public async Task<ContactModel?> ReadAsync(Guid id)
    {
        var record = await _query.SingleOrDefaultAsync(id);
        return record?.ToModel();
    }

    // ✅ Writes: Explicitly set TenantId
    public async Task<ContactModel> CreateAsync(ContactModel model)
    {
        var record = model.ToRecord();
        
        // ✅ CRITICAL: Explicitly set TenantId for new records
        record.TenantId = _tenantContext.TenantId;
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;
        
        _db.Contacts.Add(record);
        await _db.SaveChangesAsync();
        
        return record.ToModel();
    }
}
```

### Step 10: Write Tests

```csharp
[Fact]
public async Task Contact_ShouldBeIsolatedByTenant()
{
    // Arrange
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);
    
    Guid tenant1Id, tenant2Id;
    
    // Create two tenants
    using (var scope = container.BeginScope())
    {
        var tenant1 = new ApplicationTenant { Name = "Tenant 1" };
        var tenant2 = new ApplicationTenant { Name = "Tenant 2" };
        scope.Base2.Tenants.AddRange(tenant1, tenant2);
        await scope.Base2.SaveChangesAsync();
        
        tenant1Id = tenant1.Id;
        tenant2Id = tenant2.Id;
    }
    
    // Create contacts for each tenant
    using (var scope = container.BeginScope())
    {
        scope.Base2.Contacts.AddRange(
            new Contact { TenantId = tenant1Id, Email = "user1@tenant1.com" },
            new Contact { TenantId = tenant2Id, Email = "user1@tenant2.com" }
        );
        await scope.Base2.SaveChangesAsync();
    }
    
    // Verify isolation (without RLS - we see all)
    using (var scope = container.BeginScope())
    {
        var allContacts = await scope.Base2.Contacts.ToArrayAsync();
        allContacts.Should().HaveCount(2);
        
        var tenant1Contacts = allContacts.Where(c => c.TenantId == tenant1Id).ToArray();
        var tenant2Contacts = allContacts.Where(c => c.TenantId == tenant2Id).ToArray();
        
        tenant1Contacts.Should().HaveCount(1);
        tenant2Contacts.Should().HaveCount(1);
    }
}

// For RLS integration tests with PostgreSQL
[Fact]
[Trait("Category", "PostgreSQL")]
[Trait("Category", "RLS")]
public async Task Contact_WithRls_ShouldFilterByTenant()
{
    // Use PostgreSQL test database with RLS enabled
    // Set tenant context and verify filtering
}
```

## Quick Checklist

When adding a new Product Name entity with RLS:

- [ ] Entity has `Guid TenantId { get; set; }` property
- [ ] Entity has `Guid OrganizationId { get; set; }` property
- [ ] DbSet added to AppDbContext
- [ ] Entity configuration in `OnModelCreating`
- [ ] Create EF migration for entity
- [ ] Add table name (snake_case) to `RlsPolicyManager.TablesWithTenantOnly`
- [ ] Create RLS migration with `RlsPolicyManager.EnableRls()`
- [ ] Verify tenant interceptor is enabled in `IServiceCollectionExtensions`
- [ ] Controller uses `[TenantRead(nameof(AppDbContext))]` or `[TenantWrite(nameof(AppDbContext))]`
- [ ] Service explicitly sets `TenantId` for new records
- [ ] Query remains tenant-agnostic (no manual filtering)
- [ ] Write unit tests
- [ ] Write RLS integration tests (PostgreSQL)

## Common Patterns

### Pattern 1: Single Entity with RLS

```csharp
// Entity
public class Sequence
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }  // ✅ RLS
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
}

// Controller
[TenantRead(nameof(AppDbContext))]
public async Task<ActionResult> GetSequence(Guid id) { ... }

// Service
record.TenantId = _tenantContext.TenantId;  // ✅ Explicit assignment
```

### Pattern 2: Cross-Database with RLS

```csharp
// Both databases
[HttpGet("{contactId}/with-owner")]
[TenantRead(nameof(AppDbContext), nameof(AppDbContext))]
public async Task<ActionResult> GetContactWithOwner(Guid contactId)
{
    // RLS active on both databases
    var contact = await _contactService.ReadAsync(contactId);  // AppDb
    var owner = await _userService.ReadAsync(contact.OwnerId);  // WarehouseDb
    return Ok(new { contact, owner });
}
```

### Pattern 3: Bulk Operations with RLS

```csharp
[HttpPost("bulk")]
[TenantWrite(nameof(AppDbContext))]
public async Task<ActionResult> BulkCreate(ContactModel[] models)
{
    // RLS ensures all records get correct TenantId
    foreach (var model in models)
    {
        var record = model.ToRecord();
        record.TenantId = _tenantContext.TenantId;  // ✅ Set for each record
        _db.Contacts.Add(record);
    }
    
    await _db.SaveChangesAsync();
    return Ok();
}
```

## Troubleshooting

### Issue 1: RLS Not Filtering Data

**Symptom**: Can see data from other tenants

**Causes**:
1. Tenant interceptor not enabled
2. RLS migration not run
3. Table not registered in RlsPolicyManager
4. Using SQLite (RLS only works on PostgreSQL)

**Fix**:
```bash
# Verify table is registered
grep "contact" src/server/Base2.Data/src/Security/RlsPolicyManager.cs

# Verify migration was applied
dotnet ef migrations list --context AppDbContext

# Check database provider
# RLS only works with PostgreSQL, not SQLite
```

### Issue 2: Can't Insert Records

**Symptom**: Insert fails with RLS policy violation

**Cause**: TenantId not set before insert

**Fix**:
```csharp
// ❌ Wrong
var contact = model.ToRecord();
_db.Contacts.Add(contact);  // TenantId is default(Guid) = Guid.Empty

// ✅ Correct
var contact = model.ToRecord();
contact.TenantId = _tenantContext.TenantId;  // ✅ Set explicitly
_db.Contacts.Add(contact);
```

### Issue 3: Migration Fails on SQLite

**Symptom**: RLS migration fails in development (SQLite)

**Fix**: RLS migration should check provider:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // ✅ Skip for SQLite
    if (migrationBuilder.ActiveProvider.Contains("Sqlite"))
        return;
        
    RlsPolicyManager.EnableRls(migrationBuilder);
}
```

## Related Documentation

- [Multi-Database RLS Usage](./multi-database-rls-usage.md) - Usage patterns
- [RLS Patterns](../../patterns/server/rls-patterns.md) - RLS fundamentals  
- [Database Architecture](../../patterns/server/database-architecture.md) - Control vs data plane
- [Keyed Services Injection Guide](./keyed-services-injection-guide.md) - Guard injection

---

**Last Updated**: 2025-12-06  
**Status**: Ready to Enable  
**Author**: Engineering Team

