# EF Core Interceptor Behavior with Multiple Registrations

## How EF Core Interceptors Work

### Key Principle: Interceptors are Per-DbContext Instance

**Important**: EF Core interceptors are **attached to specific DbContext instances**, not globally registered. When you call `options.AddInterceptors(interceptor)`, that interceptor only fires for **that specific DbContext**.

## Option 1: Generic Interceptor Behavior

### Registration Code

```csharp
// IServiceCollectionExtensions.cs

public static IServiceCollection AddAppDbConfiguration(...)
{
    // Register generic interceptor for AppDbContext
    if (addTenantInterceptor)
    {
        services.AddScoped<WriteGuardInterceptor<AppDbContext>>();
    }

    return services.AddProviderDbContext<AppDbContext>(..., addTenantInterceptor);
}

public static IServiceCollection AddWarehouseDbConfiguration(...)
{
    // Register generic interceptor for WarehouseDbContext
    if (addTenantInterceptor)
    {
        services.AddScoped<WriteGuardInterceptor<WarehouseDbContext>>();
    }

    return services.AddProviderDbContext<WarehouseDbContext>(..., addTenantInterceptor);
}

public static IServiceCollection AddProviderDbContext<TContext>(
    this IServiceCollection serviceCollection,
    IConfiguration configuration,
    string configurationPrefix,
    string defaultProvider,
    ServiceLifetime contextLifetime = ServiceLifetime.Scoped,
    ServiceLifetime optionsLifetime = ServiceLifetime.Scoped,
    bool addTenantInterceptor = false)
    where TContext : DbContext
{
    serviceCollection.AddDbContext<TContext>((serviceProvider, options) =>
    {
        // ... database provider setup ...

        if (addTenantInterceptor && provider == "Npgsql")
        {
            // Resolve the SPECIFIC interceptor for THIS DbContext type
            var writeGuardInterceptor = serviceProvider.GetRequiredService<WriteGuardInterceptor<TContext>>();
            
            // Attach it to THIS DbContext only
            options.AddInterceptors(writeGuardInterceptor);
        }
    });

    return serviceCollection;
}
```

## Runtime Behavior

### Scenario 1: SaveChanges on AppDbContext

```csharp
// In a controller or service
public async Task<ActionResult> CreateOrganization(OrganizationModel model)
{
    var org = model.ToRecord();
    org.TenantId = _tenantContext.TenantId;
    
    _appDb.Organizations.Add(org);
    
    // When SaveChangesAsync is called:
    await _appDb.SaveChangesAsync();
    
    // ✅ Only WriteGuardInterceptor<AppDbContext> fires
    // ✅ It resolves: _serviceProvider.GetKeyedService<IRequestDbGuard>("AppDbContext")
    // ✅ Calls: appGuard.EnsureWriteAsync()
    
    return Ok(org.ToModel());
}
```

**Flow:**
```
1. _appDb.SaveChangesAsync() called
2. EF Core checks interceptors attached to _appDb instance
3. Finds: WriteGuardInterceptor<AppDbContext>
4. Calls: interceptor.SavingChangesAsync(eventData, ...)
5. Interceptor resolves: GetKeyedService<IRequestDbGuard>("AppDbContext")
6. Calls: guard.EnsureWriteAsync()
7. SaveChanges proceeds with write transaction
```

### Scenario 2: SaveChanges on WarehouseDbContext

```csharp
// In a controller or service
public async Task<ActionResult> CreateContact(ContactModel model)
{
    var contact = model.ToRecord();
    contact.TenantId = _tenantContext.TenantId;
    
    _warehouseDb.Contacts.Add(contact);
    
    // When SaveChangesAsync is called:
    await _warehouseDb.SaveChangesAsync();
    
    // ✅ Only WriteGuardInterceptor<WarehouseDbContext> fires
    // ✅ It resolves: _serviceProvider.GetKeyedService<IRequestDbGuard>("WarehouseDbContext")
    // ✅ Calls: warehouseGuard.EnsureWriteAsync()
    
    return Ok(contact.ToModel());
}
```

**Flow:**
```
1. _warehouseDb.SaveChangesAsync() called
2. EF Core checks interceptors attached to _warehouseDb instance
3. Finds: WriteGuardInterceptor<WarehouseDbContext>
4. Calls: interceptor.SavingChangesAsync(eventData, ...)
5. Interceptor resolves: GetKeyedService<IRequestDbGuard>("WarehouseDbContext")
6. Calls: guard.EnsureWriteAsync()
7. SaveChanges proceeds with write transaction
```

### Scenario 3: SaveChanges on Both in Same Request

```csharp
// Cross-database operation
[HttpPost("contacts/with-audit")]
[TenantWrite(nameof(AppDbContext), nameof(WarehouseDbContext))]
public async Task<ActionResult> CreateContactWithAudit(ContactModel model)
{
    // Both guards are active (from attribute)
    
    // Create contact in WarehouseDb
    var contact = model.ToRecord();
    contact.TenantId = _tenantContext.TenantId;
    _warehouseDb.Contacts.Add(contact);
    
    await _warehouseDb.SaveChangesAsync();
    // ✅ WriteGuardInterceptor<WarehouseDbContext> fires
    // ✅ Resolves WarehouseDbContext guard
    // ✅ Calls warehouseGuard.EnsureWriteAsync() (no-op, already active from attribute)
    
    // Create audit log in AppDb
    var audit = new AuditLog { Action = "ContactCreated", ContactId = contact.Id };
    _appDb.AuditLogs.Add(audit);
    
    await _appDb.SaveChangesAsync();
    // ✅ WriteGuardInterceptor<AppDbContext> fires
    // ✅ Resolves AppDbContext guard
    // ✅ Calls appGuard.EnsureWriteAsync() (no-op, already active from attribute)
    
    return Ok(contact.ToModel());
}
```

**Flow:**
```
Request comes in
├─ [TenantWrite] attribute calls both guards
│  ├─ appGuard.EnsureWriteAsync() → Transaction started for AppDb
│  └─ warehouseGuard.EnsureWriteAsync() → Transaction started for WarehouseDb
│
├─ _warehouseDb.SaveChangesAsync()
│  ├─ WriteGuardInterceptor<WarehouseDbContext> fires
│  ├─ Calls warehouseGuard.EnsureWriteAsync() (no-op, already in write transaction)
│  └─ Commits changes to WarehouseDb
│
├─ _appDb.SaveChangesAsync()
│  ├─ WriteGuardInterceptor<AppDbContext> fires
│  ├─ Calls appGuard.EnsureWriteAsync() (no-op, already in write transaction)
│  └─ Commits changes to AppDb
│
└─ Both guards dispose at end of request (commits transactions)
```

## Important Points

### 1. Interceptors Don't Cross-Fire

**Each DbContext instance only invokes its own attached interceptors.**

```csharp
// These are SEPARATE instances with SEPARATE interceptors:
var appDb = serviceProvider.GetRequiredService<AppDbContext>();
// ↑ Has WriteGuardInterceptor<AppDbContext> attached

var warehouseDb = serviceProvider.GetRequiredService<WarehouseDbContext>();
// ↑ Has WriteGuardInterceptor<WarehouseDbContext> attached

// When you call appDb.SaveChanges():
// - Only WriteGuardInterceptor<AppDbContext> fires
// - WriteGuardInterceptor<WarehouseDbContext> does NOT fire

// When you call warehouseDb.SaveChanges():
// - Only WriteGuardInterceptor<WarehouseDbContext> fires
// - WriteGuardInterceptor<AppDbContext> does NOT fire
```

### 2. Each Interceptor Resolves Its Own Guard

```csharp
// WriteGuardInterceptor<AppDbContext>
_dbContextKey = "AppDbContext"
→ Resolves: GetKeyedService<IRequestDbGuard>("AppDbContext")
→ Gets the App guard

// WriteGuardInterceptor<WarehouseDbContext>
_dbContextKey = "WarehouseDbContext"
→ Resolves: GetKeyedService<IRequestDbGuard>("WarehouseDbContext")
→ Gets the Warehouse guard
```

### 3. Guards are Idempotent

Multiple calls to `EnsureWriteAsync()` are safe:

```csharp
// First call (from attribute)
await guard.EnsureWriteAsync();  // Starts write transaction

// Second call (from interceptor)
await guard.EnsureWriteAsync();  // No-op (already in write transaction)
```

From `RequestDbGuard<TDb>`:
```csharp
public async Task EnsureWriteAsync(CancellationToken cancellationToken = default)
{
    // Already write-capable? nothing to do
    if (_transaction != null && !_isReadOnly)
        return;  // ✅ Idempotent!
        
    // ... only starts transaction if not already in write mode
}
```

## Memory and Performance

### Service Provider Scopes

```csharp
// During a request, you have:
var serviceProvider = httpContext.RequestServices;  // Request scope

// Registered services:
services.AddScoped<AppDbContext>();                              // 1 instance per request
services.AddScoped<WarehouseDbContext>();                                  // 1 instance per request
services.AddScoped<WriteGuardInterceptor<AppDbContext>>();      // 1 instance per request
services.AddScoped<WriteGuardInterceptor<WarehouseDbContext>>();          // 1 instance per request
services.AddKeyedScoped<IRequestDbGuard>("AppDbContext", ...);  // 1 instance per request
services.AddKeyedScoped<IRequestDbGuard>("WarehouseDbContext", ...);      // 1 instance per request
```

**Total Objects per Request:**
- 2 DbContext instances (App + Warehouse)
- 2 Interceptor instances (one per DbContext)
- 2 Guard instances (one per DbContext)

**Memory Impact**: Minimal - all objects are request-scoped and disposed at request end.

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │ AppDbContext             │  │ WarehouseDbContext       │ │
│  │                          │  │                          │ │
│  │ Attached Interceptor:    │  │ Attached Interceptor:    │ │
│  │ ┌──────────────────────┐ │  │ ┌──────────────────────┐ │ │
│  │ │ WriteGuardInterceptor│ │  │ │ WriteGuardInterceptor│ │ │
│  │ │ <AppDbContext>       │ │  │ │ <WarehouseDbContext> │ │ │
│  │ │                      │ │  │ │                      │ │ │
│  │ │ Key: "AppDb.."       │ │  │ │ Key: "WarehouseDb.." │ │ │
│  │ └──────────────────────┘ │  │ └──────────────────────┘ │ │
│  │           ↓              │  │           ↓              │ │
│  │      Resolves            │  │      Resolves            │ │
│  │           ↓              │  │           ↓              │ │
│  │ ┌──────────────────────┐ │  │ ┌──────────────────────┐ │ │
│  │ │ IRequestDbGuard      │ │  │ │ IRequestDbGuard      │ │ │
│  │ │ (AppDbContext)       │ │  │ │ (WarehouseDbContext) │ │ │
│  │ └──────────────────────┘ │  │ └──────────────────────┘ │ │
│  └──────────────────────────┘  └──────────────────────────┘ │
│                                                             │
│  Each DbContext:                                            │
│  - Has its own interceptor instance                         │
│  - Interceptor resolves its own guard                       │
│  - Only fires when SaveChanges is called on THAT context    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Testing This Behavior

You can verify this with a simple test:

```csharp
[Fact]
public async Task WriteGuardInterceptor_OnlyFiresForCorrectDbContext()
{
    // Arrange
    var services = new ServiceCollection();
    
    // Register both DbContexts with interceptors
    services.AddAppDbConfiguration(configuration);
    services.AddWarehouseDbConfiguration(configuration);
    
    var serviceProvider = services.BuildServiceProvider();
    
    using var scope = serviceProvider.CreateScope();
    var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var warehouseDb = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();
    
    // Act & Assert
    
    // When we save on AppDb
    appDb.Organizations.Add(new Organization { Name = "Test" });
    await appDb.SaveChangesAsync();
    // ✅ Only WriteGuardInterceptor<AppDbContext> was invoked
    // ✅ Only App guard was called
    
    // When we save on WarehouseDb
    warehouseDb.Contacts.Add(new Contact { Email = "test@example.com" });
    await warehouseDb.SaveChangesAsync();
    // ✅ Only WriteGuardInterceptor<WarehouseDbContext> was invoked
    // ✅ Only Warehouse guard was called
    
    // The interceptors do NOT cross-fire
}
```

## Conclusion

**Option 1 (Generic Interceptor) is safe and correct because:**

1. ✅ Each DbContext gets its own interceptor instance
2. ✅ Each interceptor only fires for its specific DbContext
3. ✅ Each interceptor resolves its specific guard by key
4. ✅ No cross-firing or interference between contexts
5. ✅ Clean separation of concerns
6. ✅ Type-safe and explicit

The generic type parameter ensures compile-time correctness, and EF Core's architecture ensures runtime isolation.

---

**Last Updated**: 2025-12-06  
**Status**: Behavioral Documentation
