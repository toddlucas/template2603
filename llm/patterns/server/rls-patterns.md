# Row-Level Security (RLS) Patterns

## Overview

This document describes patterns for implementing multi-tenant Row-Level Security (RLS) in the Base2 server using PostgreSQL RLS policies and the Guard Pattern.

**Note**: For multi-database RLS usage (AppDbContext + WarehouseDbContext), see:
- [Multi-Database RLS Usage](../../guides/server/multi-database-rls-usage.md) - Practical usage patterns
- [Multi-Database RLS Design](../../plans/server/2025-12-06_multi-database-rls-design.md) - Architecture and design decisions

## Core Concepts

### Automatic Tenant Isolation

**Philosophy**: Tenant isolation happens automatically at the database layer via PostgreSQL RLS policies. You never manually add `WHERE tenant_id = @tenantId` to your queries.

**How it works**:
1. Request arrives with authenticated user (tenant ID in claims)
2. `IRequestDbGuard` sets PostgreSQL session variable: `set_config('app.tenant_id', @tenantId, true)`
3. PostgreSQL RLS policies automatically filter all queries: `USING (tenant_id = current_setting('app.tenant_id')::bigint)`
4. Application code queries without tenant filters—database enforces isolation

### RLS Responsibilities by Layer

RLS enforcement happens at **two levels** across **three layers**:

```
┌──────────────────────────────────────────────────────────┐
│ Controller Layer                                          │
│ ✅ Sets RLS context (via [TenantRead]/[TenantWrite])    │
│ ✅ Ensures guard is called before service operations     │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│ Service Layer                                             │
│ ✅ Sets TenantId on new entities (writes)                │
│ ✅ Business logic and orchestration                       │
│ ❌ Does NOT filter by tenant (RLS handles it)            │
│ ❌ Does NOT inject IRequestDbGuard                        │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│ Query Layer (Data)                                        │
│ ✅ Pure data access - completely tenant-agnostic         │
│ ❌ No tenant awareness or filtering                       │
│ ❌ No WHERE tenant_id = @tenantId clauses                 │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│ PostgreSQL RLS                                            │
│ ✅ Automatically filters ALL queries by tenant            │
│ ✅ Uses current_setting('app.tenant_id')                 │
└──────────────────────────────────────────────────────────┘
```

**Key Insight**: Query classes remain "dumb" and reusable. They have zero tenant awareness. RLS is a **cross-cutting concern** handled at the infrastructure level (guard + database).

### The Guard Pattern

**`IRequestDbGuard`** manages transaction lifecycle and RLS context:

```csharp
public interface IRequestDbGuard
{
    Task EnsureReadAsync(CancellationToken cancellationToken = default);
    Task EnsureWriteAsync(CancellationToken cancellationToken = default);
}
```

**Key behaviors**:
- Lazy transaction creation (only when needed)
- Read-only optimization (`SET TRANSACTION READ ONLY`)
- Automatic RLS context setting on transaction start
- Read-to-write promotion (closes read transaction, opens write transaction, re-sets RLS context)
- Automatic disposal at end of request scope

## Implementation Patterns

### Pattern 1: Attribute-Based (Preferred for Controllers)

Use `[TenantRead]` or `[TenantWrite]` attributes for simple, clear operations.

#### Simple Read Operation

```csharp
[HttpGet("{id:long}")]
[TenantRead]  // ✅ Automatically calls guard.EnsureReadAsync()
public async Task<ActionResult> Get(long id)
{
    // No manual guard call needed!
    var result = await _service.ReadOrDefaultAsync(id);
    return result is null ? NotFound() : Ok(result);
}
```

#### Simple Write Operation

```csharp
[HttpPost]
[TenantWrite]  // ✅ Automatically calls guard.EnsureWriteAsync()
public async Task<ActionResult> Post(OrganizationModel model)
{
    // No manual guard call needed!
    var result = await _service.CreateAsync(model);
    return Ok(result);
}
```

#### List Operation with Pagination

```csharp
[HttpGet]
[TenantRead]  // ✅ Read-only, use TenantRead
public async Task<ActionResult> List([FromQuery] PagedQuery query)
{
    // RLS automatically filters to current tenant
    var result = await _service.PageAsync(query);
    return Ok(result);
}
```

**When to use attributes:**
- ✅ Simple CRUD operations
- ✅ Clear read-only or write-only boundaries
- ✅ **Default choice for most controller actions**
- ✅ Clean, declarative code

### Pattern 2: Manual Calls (For Complex Logic)

Use manual `await _guard.EnsureReadAsync()` / `EnsureWriteAsync()` for complex operations.

#### Read-Then-Write (Promotion Pattern)

```csharp
[HttpPut]
public async Task<ActionResult> Put(OrganizationModel model)
{
    // Read first to check if exists
    await _guard.EnsureReadAsync();
    
    var record = await _dbContext.Organizations.FindAsync(model.Id);
    if (record is null)
        return NotFound();
    
    // Promote to write transaction for update
    await _guard.EnsureWriteAsync();
    
    record.UpdateFrom(model);
    await _dbContext.SaveChangesAsync();
    
    return Ok(record.ToModel());
}
```

**Why manual?** Need to read first (check existence), then conditionally write. Attributes can't handle this mixed pattern.

#### Conditional Write with Validation

```csharp
[HttpPost]
public async Task<ActionResult> Post(OrganizationModel model)
{
    // Read first for validation
    await _guard.EnsureReadAsync();
    
    // Check if name already exists in tenant
    bool exists = await _dbContext.Organizations
        .AnyAsync(o => o.Name == model.Name);
    
    if (exists)
        return Conflict("Organization name already exists");
    
    // Promote to write
    await _guard.EnsureWriteAsync();
    
    var record = model.ToRecord();
    _dbContext.Organizations.Add(record);
    await _dbContext.SaveChangesAsync();
    
    return Ok(record.ToModel());
}
```

#### Multi-Step Transaction

```csharp
[HttpPost]
public async Task<ActionResult> CreateWithInvoice(OrderModel model)
{
    // Start write transaction once
    await _guard.EnsureWriteAsync();
    
    // All operations use guard's transaction
    var order = model.ToRecord();
    _dbContext.Orders.Add(order);
    await _dbContext.SaveChangesAsync();
    
    // Create invoice in same transaction
    var invoice = new Invoice { OrderId = order.Id, Amount = order.Total };
    _dbContext.Invoices.Add(invoice);
    await _dbContext.SaveChangesAsync();
    
    // Transaction commits when guard is disposed (end of request scope)
    return Ok(order.ToModel());
}
```

**When to use manual calls:**
- ✅ Read-then-write operations (promotion pattern)
- ✅ Conditional logic between read and write
- ✅ Multi-step transactions
- ✅ Complex validation requiring database queries
- ✅ Service layer (below controllers)

### Pattern 3: Service Layer (No Guard Injection!)

Services **do not inject `IRequestDbGuard`**. The guard is called at the controller level before calling service methods.

**Services are responsible for**:
- ✅ Setting `TenantId` on new entities (writes)
- ✅ Business logic and validation
- ✅ Using Query classes for data access
- ❌ NOT calling the guard (controller does this)
- ❌ NOT filtering by tenant (RLS does this)

**Typical service pattern (guard handled at controller level)**:

```csharp
public class OrganizationService
{
    private readonly AppDbContext _dbContext;
    private readonly OrganizationQuery _query;
    private readonly TenantContext<Guid> _tenantContext;
    
    // Note: Does NOT inject IRequestDbGuard!
    public OrganizationService(
        AppDbContext dbContext, 
        ILogger<OrganizationService> logger,
        TenantContext<Guid> tenantContext)
    {
        _dbContext = dbContext;
        _query = new OrganizationQuery(dbContext.Organizations, logger);
        _tenantContext = tenantContext;
    }
    
    // READ - No guard call, relies on RLS filtering
    public async Task<OrganizationModel?> ReadOrDefaultAsync(long id)
    {
        // Query has no tenant filter - RLS handles it automatically
        var record = await _query.SingleOrDefaultAsync(id);
        return record?.ToModel();
    }
    
    // WRITE - Explicitly sets TenantId on new record
    public async Task<OrganizationModel> CreateAsync(OrganizationModel model)
    {
        var record = model.ToRecord();
        
        // Service responsibility: Set tenant on writes
        record.TenantId = _tenantContext.TenantId;
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;
        
        _dbContext.Organizations.Add(record);
        await _dbContext.SaveChangesAsync();
        
        return record.ToModel();
    }
    
    // UPDATE - No guard call, RLS enforces read, service sets UpdatedAt
    public async Task<OrganizationModel?> UpdateAsync(OrganizationModel model)
    {
        // No guard - controller already called it
        var record = await _query.TrackOrDefaultAsync(model.Id);
        if (record is null)
            return null;
        
        record.UpdateFrom(model);
        record.UpdatedAt = DateTime.UtcNow;
        
        await _dbContext.SaveChangesAsync();
        
        return record.ToModel();
    }
}
```

**Exception: Services that need explicit control**

In rare cases where a service needs explicit read-write promotion (complex transactions), it can inject `IRequestDbGuard`:

```csharp
public class ComplexOrderService
{
    private readonly IRequestDbGuard _guard;  // ← Only for complex cases
    
    public async Task<Order> CreateOrderWithInvoice(OrderDto dto)
    {
        // Start write transaction for multi-step operation
        await _guard.EnsureWriteAsync();
        
        var order = new Order { Total = dto.Total };
        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();
        
        var invoice = new Invoice { OrderId = order.Id };
        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync();
        
        return order;
    }
}
```

**Use this pattern only when**:
- ✅ Multi-step transactions within service
- ✅ Need explicit read-write promotion in service
- ✅ Complex validation requiring database reads before writes

**Default pattern**: Services don't inject guard—controllers handle it.

## Decision Matrix

| Scenario | Use | Reason |
|----------|-----|--------|
| Simple GET endpoint | `[TenantRead]` | Clean, declarative |
| Simple POST/PUT/DELETE | `[TenantWrite]` | Clean, declarative |
| List/pagination endpoint | `[TenantRead]` | Read-only operation |
| Need to read, then write | Manual calls | Promotion pattern |
| Conditional write | Manual calls | Read for validation, then write |
| Multi-step transaction | Manual calls | Explicit transaction control |
| Service layer | Manual calls | Flexibility for complex logic |
| Complex business logic | Manual calls | Better control and clarity |

## Query Pattern and RLS

### Query Classes Are Tenant-Agnostic (By Design)

Query classes at the Data layer have **zero tenant awareness**:

```csharp
// OrganizationQuery.cs - No tenant filtering!
public record OrganizationQuery(DbSet<Record> DbSet, ILogger logger)
{
    // ✅ Pure query - no WHERE tenant_id = @tenantId
    public Task<Record?> SingleOrDefaultAsync(long id, ...) => 
        DbSet.Where(e => e.Id == id).SingleOrDefaultAsync(...);
        
    // ✅ List all - RLS filters automatically
    public Task<Record[]> ListAsync(...) => 
        DbSet.ToArrayAsync(...);
        
    // ✅ Search by name - RLS adds tenant filter behind the scenes
    public Task<Record[]> FindByNameAsync(string name, ...) => 
        DbSet.Where(e => e.Name.Contains(name)).ToArrayAsync(...);
}
```

**Why queries stay "dumb":**

| Aspect | Tenant-Agnostic Queries (Current) | If Queries Were Tenant-Aware |
|--------|-----------------------------------|------------------------------|
| **Separation of concerns** | ✅ Queries focus on data access | ❌ Queries mixed with security |
| **Reusability** | ✅ Same query works in any tenant context | ❌ Queries coupled to multi-tenancy |
| **Maintainability** | ✅ One place to update query logic | ❌ Every query has tenant boilerplate |
| **Safety** | ✅ Impossible to forget filter (DB enforces) | ❌ Easy to forget `WHERE tenant_id` in one query |
| **Testability** | ✅ Test queries without tenant setup | ❌ Every test needs tenant context |
| **Consistency** | ✅ RLS enforced uniformly | ❌ Manual filtering varies |

### How RLS Works With Queries

```csharp
// 1. Controller sets RLS context
[HttpGet]
[TenantRead]  // Sets: set_config('app.tenant_id', '123', true)
public async Task<ActionResult> List()
{
    // 2. Service calls query
    var orgs = await _service.ListAsync();
    return Ok(orgs);
}

// 3. Service uses query (no tenant filtering)
public async Task<OrganizationModel[]> ListAsync()
{
    // Query has no tenant filter!
    var records = await _query.ListAsync();
    return records.ToModels();
}

// 4. Query executes raw SQL
public Task<Record[]> ListAsync() => 
    DbSet.ToArrayAsync();  // SELECT * FROM organization

// 5. PostgreSQL RLS adds filter automatically
// Actual SQL executed:
// SELECT * FROM organization 
// WHERE tenant_id = current_setting('app.tenant_id')::bigint
//       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//       This is added by RLS policy, not application code!
```

### When Queries Need Tenant Context (Rare)

In very rare cases, a query might need explicit tenant context for **writes or validation**, but this is handled at the **service layer**, not the query layer:

```csharp
// Service sets tenant on writes (not query)
public async Task<OrganizationModel> CreateAsync(OrganizationModel model)
{
    var record = model.ToRecord();
    
    // Service responsibility: Set tenant for new entity
    record.TenantId = _tenantContext.TenantId;  // ← Service sets this
    
    _dbContext.Organizations.Add(record);
    await _dbContext.SaveChangesAsync();
    
    return record.ToModel();
}
```

**Key principle**: Queries read data (RLS filters), services write data (services set `TenantId`).

## Best Practices

### DO ✅

- **Use attributes by default** for controller actions (90% of cases)
- **Use manual calls** when you need read-then-write pattern
- **Call guard at controller level**, not service level (separation of concerns)
- **Keep queries tenant-agnostic** - no tenant filtering in Query classes
- **Set TenantId in services** when creating new entities
- **Call `EnsureWriteAsync()` once** at the start of complex transactions
- **Let the guard manage transactions** (don't use `BeginTransaction()` manually)
- **Trust RLS** - Never add manual `WHERE tenant_id = @tenantId` filters
- **Test RLS** with PostgreSQL (use `[Trait("Category", "Npgsql")]`)

### DON'T ❌

- **Don't mix guard pattern with manual transactions** (`BeginTransaction()`)
- **Don't call `EnsureWriteAsync()` multiple times** in same method (once is enough)
- **Don't inject `IRequestDbGuard` in services** unless complex transaction needed
- **Don't add tenant filtering to Query classes** - keep them tenant-agnostic
- **Don't forget to set `TenantId` on new entities** in service CreateAsync methods
- **Don't test RLS with SQLite** (SQLite doesn't support RLS policies)
- **Don't add manual tenant filters** to queries (RLS handles it)
- **Don't use attributes for read-then-write operations** (use manual calls)

## Common Patterns by Operation Type

### GET Operations

```csharp
// Simple read
[HttpGet("{id:long}")]
[TenantRead]
public async Task<ActionResult> Get(long id) { ... }

// List with pagination
[HttpGet]
[TenantRead]
public async Task<ActionResult> List([FromQuery] PagedQuery query) { ... }

// Detail with includes
[HttpGet("{id:long}/detail")]
[TenantRead]
public async Task<ActionResult> GetDetail(long id) { ... }
```

### POST Operations

```csharp
// Simple create
[HttpPost]
[TenantWrite]
public async Task<ActionResult> Post(OrganizationModel model) { ... }

// Create with validation (manual)
[HttpPost]
public async Task<ActionResult> PostWithValidation(OrganizationModel model)
{
    await _guard.EnsureReadAsync();  // Check validation
    // ...validation logic...
    await _guard.EnsureWriteAsync(); // Create
    // ...create logic...
}

// Bulk create
[HttpPost("bulk")]
[TenantWrite]
public async Task<ActionResult> BulkCreate(OrganizationModel[] models) { ... }
```

### PUT Operations

```csharp
// Simple update (if you don't need to read first)
[HttpPut]
[TenantWrite]
public async Task<ActionResult> Put(OrganizationModel model) { ... }

// Update with read-first (manual - common pattern)
[HttpPut]
public async Task<ActionResult> PutSafe(OrganizationModel model)
{
    await _guard.EnsureReadAsync();
    var record = await _dbContext.Organizations.FindAsync(model.Id);
    if (record is null) return NotFound();
    
    await _guard.EnsureWriteAsync();
    record.UpdateFrom(model);
    await _dbContext.SaveChangesAsync();
    return Ok(record.ToModel());
}
```

### DELETE Operations

```csharp
// Simple delete
[HttpDelete("{id:long}")]
[TenantWrite]
public async Task<ActionResult> Delete(long id) { ... }

// Soft delete with read-first (manual)
[HttpDelete("{id:long}")]
public async Task<ActionResult> SoftDelete(long id)
{
    await _guard.EnsureReadAsync();
    var record = await _dbContext.Organizations.FindAsync(id);
    if (record is null) return NotFound();
    
    await _guard.EnsureWriteAsync();
    record.DeletedAt = DateTime.UtcNow;
    await _dbContext.SaveChangesAsync();
    return NoContent();
}
```

## Testing RLS

### Unit Tests (With Data.Mock)

**Note**: SQLite doesn't support RLS. Use Data.Mock for fast tests, but RLS won't be enforced.

```csharp
[Fact]
[Trait("Database", "Sqlite")]
public async Task Create_ShouldWorkWithDataMock()
{
    // RLS not enforced in SQLite, but test business logic
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    using var scope = container.BeginScope();
    var db = scope.App;
    
    var org = new Organization { Name = "Test", TenantId = 1 };
    db.Organizations.Add(org);
    await db.SaveChangesAsync();
    
    org.Id.Should().BeGreaterThan(0);
}
```

### Integration Tests (With PostgreSQL)

**Required** for RLS policy testing:

```csharp
[Fact]
[Trait("Category", "Integration")]
[Trait("Database", "Npgsql")]
public async Task Query_WithRls_ShouldFilterByTenant()
{
    // Arrange - Setup with real PostgreSQL
    var config = new ConfigurationBuilder()
        .AddJsonFile("appsettings.Npgsql.json")
        .Build();
    
    var services = new ServiceCollection();
    services.AddDatabases(config);
    services.AddTenantServices();
    var sp = services.BuildServiceProvider();
    
    // Create as Tenant 1
    await using (var scope = sp.CreateAsyncScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var guard = GetRequestGuard(scope.ServiceProvider, tenantId: 1);
        await guard.EnsureWriteAsync();
        
        var org = new Organization { TenantId = 1, Name = "Tenant 1 Org" };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
    }
    
    // Try to read as Tenant 2
    await using (var scope = sp.CreateAsyncScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var guard = GetRequestGuard(scope.ServiceProvider, tenantId: 2);
        await guard.EnsureReadAsync();
        
        // Act
        var orgs = await db.Organizations.ToListAsync();
        
        // Assert - RLS filters out Tenant 1's data
        orgs.Should().BeEmpty();
    }
}
```

**Key test categories:**
- `[Trait("Category", "Unit")]` - Fast tests with Data.Mock (no RLS)
- `[Trait("Category", "Integration")]` + `[Trait("Database", "Npgsql")]` - RLS tests

## Troubleshooting

### Issue: "RLS context not set" errors

**Cause**: Manual transaction created without guard
**Solution**: Use `await _guard.EnsureWriteAsync()` instead of `BeginTransaction()`

### Issue: Queries bypass tenant isolation

**Cause**: No RLS policies on table, or guard not called
**Solution**: 
1. Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'your_table'`
2. Ensure guard is called before queries
3. Check middleware order (`UseAmbientGuardMiddleware` after authentication)

### Issue: Tests fail with RLS errors

**Cause**: Testing with SQLite instead of PostgreSQL
**Solution**: Use `[Trait("Database", "Npgsql")]` and real PostgreSQL connection

### Issue: Read-write operations fail

**Cause**: Trying to write in read transaction
**Solution**: Call `await _guard.EnsureWriteAsync()` before `SaveChangesAsync()`

## Migration Checklist

When adding RLS to a new table:

- [ ] Add `tenant_id` column to table
- [ ] Add foreign key: `ALTER TABLE your_table ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id)`
- [ ] Enable RLS: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY`
- [ ] Create policy: `CREATE POLICY tenant_isolation ON your_table USING (tenant_id = current_setting('app.tenant_id')::bigint)`
- [ ] Add table to `RlsPolicyManager.TablesWithTenantOnly` array
- [ ] Update entity with `public long TenantId { get; set; }`
- [ ] Test with PostgreSQL (`[Trait("Database", "Npgsql")]`)

## Related Documentation

- [Server Testing Strategy](../../overview/server/testing-strategy.md) - Testing approach
- [Database Testing Pattern](./database-testing-pattern.md) - Data.Mock vs PostgreSQL
- [Testing Patterns](./testing-patterns.md) - RLS testing examples
- [Server Architecture Patterns](./server-architecture-patterns.md) - Layered architecture

## Further Reading

- [Base2.Core.Identity.Data README](../../../src/server/Base2.Identity.Data/src/README.md) - Deep dive on guard pattern
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team

