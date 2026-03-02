# Multi-Database RLS Design

## Problem Statement

The current RLS implementation assumes a **single database** per request. However, we have two databases:
- **AppDbContext** (OLTP)
- **WarehouseDbContext** (OLAP)

Controllers may need to access **both databases** in a single request, each with its own transaction and RLS context.

## Current Implementation Issues

### Issue 1: Single Guard Registration

**Current Code** (`IServiceCollectionExtensions.cs`):
```csharp
// Only ONE IRequestDbGuard registered for AppDbContext
services.AddScoped<IRequestDbGuard>(serviceProvider =>
{
    var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
    var tenantContext = serviceProvider.GetRequiredService<TenantContext<Guid>>();
    return new RequestDbGuard<AppDbContext>(dbContext, tenantContext);
});

// WarehouseDbContext has NO guard registered!
```

**Problem**: When we try to register a second guard for WarehouseDbContext, it will conflict:
```csharp
// ❌ This overwrites the AppDbContext guard!
services.AddScoped<IRequestDbGuard>(sp => 
    new RequestDbGuard<WarehouseDbContext>(...));
```

### Issue 2: Ambient Guard Stores Only One Guard

**Current Code** (`AmbientRequestGuard.cs`):
```csharp
public static class AmbientRequestGuard
{
    // ❌ Only stores ONE guard per request
    private static readonly AsyncLocal<IRequestDbGuard?> _current = new();
    
    public static IRequestDbGuard Current => _current.Value ?? throw ...;
}
```

**Problem**: No way to store multiple guards (one per DbContext).

### Issue 3: Middleware Resolves Single Guard

**Current Code** (`AmbientGuardMiddleware.cs`):
```csharp
public async Task InvokeAsync(HttpContext context)
{
    // ❌ Only resolves ONE guard
    var guard = context.RequestServices.GetRequiredService<IRequestDbGuard>();
    
    using (AmbientRequestGuard.Use(guard))
    {
        await _next(context);
    }
}
```

**Problem**: Can't set multiple guards for different DbContexts.

### Issue 4: Attributes Can't Specify Database

**Current Code** (`TenantReadAttribute.cs`):
```csharp
[TenantRead]  // ❌ Which database?
public async Task<ActionResult> GetUser(Guid id)
{
    // Uses AppDbContext? WarehouseDbContext?
}
```

**Problem**: No way to specify which database the attribute should operate on.

## Design Options

### Option 1: Keyed Services (Recommended ✅)

**Use .NET 8's Keyed Services to register multiple guards.**

#### Changes Required:

**1. Register Guards by Key:**
```csharp
// In IServiceCollectionExtensions.cs
public static IServiceCollection AddAppDbConfiguration(...)
{
    // Register guard with key
    services.AddKeyedScoped<IRequestDbGuard, RequestDbGuard<AppDbContext>>(
        "AppDb",
        (sp, key) => new RequestDbGuard<AppDbContext>(
            sp.GetRequiredService<AppDbContext>(),
            sp.GetRequiredService<TenantContext<Guid>>()
        )
    );
    
    // Also register as default for backwards compatibility
    services.AddScoped<IRequestDbGuard>(sp => 
        sp.GetRequiredKeyedService<IRequestDbGuard>("AppDb"));
}

public static IServiceCollection AddWarehouseDbConfiguration(...)
{
    services.AddKeyedScoped<IRequestDbGuard, RequestDbGuard<WarehouseDbContext>>(
        "WarehouseDb",
        (sp, key) => new RequestDbGuard<WarehouseDbContext>(
            sp.GetRequiredService<WarehouseDbContext>(),
            sp.GetRequiredService<TenantContext<Guid>>()
        )
    );
}
```

**2. Update AmbientRequestGuard to Store Multiple Guards:**
```csharp
public static class AmbientRequestGuard
{
    // Store multiple guards keyed by name
    private static readonly AsyncLocal<Dictionary<string, IRequestDbGuard>?> _guards = new();

    /// <summary>
    /// Gets the guard for the default database (AppDb).
    /// </summary>
    public static IRequestDbGuard Current => Get("AppDb");
    
    /// <summary>
    /// Gets the guard for a specific database by key.
    /// </summary>
    public static IRequestDbGuard Get(string key)
    {
        if (_guards.Value == null || !_guards.Value.TryGetValue(key, out var guard))
            throw new InvalidOperationException($"No IRequestDbGuard available for '{key}'");
        return guard;
    }
    
    /// <summary>
    /// Sets multiple guards for the current request.
    /// </summary>
    public static IDisposable UseMultiple(Dictionary<string, IRequestDbGuard> guards)
    {
        var previous = _guards.Value;
        _guards.Value = guards;
        return new GuardScope(previous);
    }
    
    /// <summary>
    /// Checks if a guard is available for the specified key.
    /// </summary>
    public static bool IsAvailable(string key) => 
        _guards.Value?.ContainsKey(key) ?? false;
    
    private sealed class GuardScope : IDisposable
    {
        private readonly Dictionary<string, IRequestDbGuard>? _previous;
        
        public GuardScope(Dictionary<string, IRequestDbGuard>? previous)
        {
            _previous = previous;
        }
        
        public void Dispose()
        {
            _guards.Value = _previous;
        }
    }
}
```

**3. Update Middleware to Resolve All Guards:**
```csharp
public sealed class AmbientGuardMiddleware
{
    private readonly RequestDelegate _next;
    
    public AmbientGuardMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Resolve all registered guards by key
        var guards = new Dictionary<string, IRequestDbGuard>();
        
        // Try to resolve each known database guard
        var appGuard = context.RequestServices.GetKeyedService<IRequestDbGuard>("AppDb");
        if (appGuard != null)
            guards["AppDb"] = appGuard;
        
        var warehouseGuard = context.RequestServices.GetKeyedService<IRequestDbGuard>("WarehouseDb");
        if (warehouseGuard != null)
            guards["WarehouseDb"] = warehouseGuard;
        
        // Set all guards as ambient
        using (AmbientRequestGuard.UseMultiple(guards))
        {
            await _next(context);
        }
    }
}
```

**4. Update Attributes to Accept Database Key:**
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class TenantReadAttribute : OverrideMethodAspect
{
    /// <summary>
    /// The database key. Defaults to "AppDb".
    /// </summary>
    public string DatabaseKey { get; set; } = "AppDb";
    
    public override async Task<dynamic?> OverrideAsyncMethod()
    {
        // Get the guard for the specified database
        var guard = AmbientRequestGuard.Get(DatabaseKey);
        await guard.EnsureReadAsync();
        
        return await meta.ProceedAsync();
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class TenantWriteAttribute : OverrideMethodAspect
{
    /// <summary>
    /// The database key. Defaults to "AppDb".
    /// </summary>
    public string DatabaseKey { get; set; } = "AppDb";
    
    public override async Task<dynamic?> OverrideAsyncMethod()
    {
        var guard = AmbientRequestGuard.Get(DatabaseKey);
        await guard.EnsureWriteAsync();
        
        return await meta.ProceedAsync();
    }
}
```

**5. Usage Examples:**

```csharp
// Default: Uses AppDb
[HttpGet]
[TenantRead]
public async Task<ActionResult> GetOrganization(long id)
{
    var org = await _appService.GetOrganizationAsync(id);
    return Ok(org);
}

// Explicit: Uses WarehouseDb
[HttpGet]
[TenantRead(DatabaseKey = "WarehouseDb")]
public async Task<ActionResult> GetContact(Guid id)
{
    var contact = await _warehouseService.GetContactAsync(id);
    return Ok(contact);
}

// Multiple databases in one request
[HttpGet]
[TenantRead(DatabaseKey = "AppDb")]  // Sets up AppDb transaction
public async Task<ActionResult> GetContactWithOwner(Guid contactId)
{
    // This uses AppDb (from attribute)
    var user = await _userService.GetUserAsync(...);
    
    // This needs WarehouseDb - manually ensure transaction
    var warehouseGuard = AmbientRequestGuard.Get("WarehouseDb");
    await warehouseGuard.EnsureReadAsync();
    var contact = await _contactService.GetContactAsync(contactId);
    
    return Ok(new { contact, owner = user });
}
```

#### Pros:
- ✅ Clean separation of concerns
- ✅ Backwards compatible (default key for existing code)
- ✅ Type-safe with compile-time checking
- ✅ Uses .NET 8 built-in features

#### Cons:
- ⚠️ Requires .NET 8+ (we're already on it)
- ⚠️ String keys are not type-safe (but constants help)
- ⚠️ Manual coordination when using multiple databases in one request

---

### Option 2: Generic IRequestDbGuard Interface

**Make the interface generic to avoid conflicts.**

#### Changes Required:

**1. Create Generic Interface:**
```csharp
public interface IRequestDbGuard<TDb> : IAsyncDisposable where TDb : DbContext
{
    Task EnsureReadAsync(CancellationToken cancellationToken = default);
    Task EnsureWriteAsync(CancellationToken cancellationToken = default);
}

// Keep non-generic for backwards compatibility
public interface IRequestDbGuard : IAsyncDisposable
{
    Task EnsureReadAsync(CancellationToken cancellationToken = default);
    Task EnsureWriteAsync(CancellationToken cancellationToken = default);
}
```

**2. Update Implementation:**
```csharp
public sealed class RequestDbGuard<TDb> : IRequestDbGuard<TDb>, IRequestDbGuard 
    where TDb : DbContext
{
    // ... existing implementation
}
```

**3. Register Both:**
```csharp
services.AddScoped<IRequestDbGuard<AppDbContext>>(sp => 
    new RequestDbGuard<AppDbContext>(...));

services.AddScoped<IRequestDbGuard<WarehouseDbContext>>(sp => 
    new RequestDbGuard<WarehouseDbContext>(...));

// Default to App for non-generic interface
services.AddScoped<IRequestDbGuard>(sp => 
    sp.GetRequiredService<IRequestDbGuard<AppDbContext>>());
```

**4. Attributes:**
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class TenantReadAttribute<TDb> : OverrideMethodAspect where TDb : DbContext
{
    public override async Task<dynamic?> OverrideAsyncMethod()
    {
        var guard = meta.Target.Method.DeclaringType
            .GetServiceProvider()
            .GetRequiredService<IRequestDbGuard<TDb>>();
        await guard.EnsureReadAsync();
        return await meta.ProceedAsync();
    }
}
```

**5. Usage:**
```csharp
[HttpGet]
[TenantRead<AppDbContext>]
public async Task<ActionResult> GetOrganization(long id) { ... }

[HttpGet]
[TenantRead<WarehouseDbContext>]
public async Task<ActionResult> GetContact(Guid id) { ... }
```

#### Pros:
- ✅ Type-safe (DbContext type at compile time)
- ✅ No string keys

#### Cons:
- ❌ Breaks the ambient pattern (Metalama can't access DI easily)
- ❌ Verbose attribute syntax
- ❌ Complex to integrate with AmbientRequestGuard

---

### Option 3: Separate Attribute Types

**Create database-specific attributes.**

```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class AppTenantReadAttribute : OverrideMethodAspect { ... }

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class WarehouseTenantReadAttribute : OverrideMethodAspect { ... }

// Usage
[HttpGet]
[AppTenantRead]
public async Task<ActionResult> GetOrganization(long id) { ... }

[HttpGet]
[WarehouseTenantRead]
public async Task<ActionResult> GetContact(Guid id) { ... }
```

#### Pros:
- ✅ Clear and explicit
- ✅ No configuration needed

#### Cons:
- ❌ Code duplication
- ❌ Not extensible (can't add third database easily)
- ❌ Still needs ambient guard updates

---

## Implemented Solution

**Option 1: Keyed Services** has been implemented with these refinements:

### Key Design Decisions

1. **Type-Safe Keys**: Use `nameof(DbContextType)` instead of string literals
   - `nameof(AppDbContext)` - OLTP
   - `nameof(WarehouseDbContext)` - OLAP

2. **No Backwards Compatibility**: Clean break, all code uses keyed services

3. **Multi-Database Attributes**: Attributes accept `params string[]` to support multiple databases
   ```csharp
   [TenantRead(nameof(AppDbContext), nameof(WarehouseDbContext))]
   ```

### Implementation Summary

**✅ Completed:**
1. ✅ Updated `AmbientRequestGuard` to store multiple guards by key
2. ✅ Updated `AmbientGuardMiddleware` to resolve all guards
3. ✅ Updated `TenantReadAttribute` to accept params array of database keys
4. ✅ Updated `TenantWriteAttribute` to accept params array of database keys
5. ✅ Updated `IServiceCollectionExtensions` to register guards with `nameof()` keys

**Benefits:**
1. ✅ Type-safe keys using `nameof()`
2. ✅ Support for multiple databases in single attribute
3. ✅ Clean, explicit API
4. ✅ Easy to add more databases in the future
5. ✅ No backwards compatibility burden

## Related Files

- `Base2.Identity.Data/src/Tenancy/Guard/IRequestDbGuard.cs`
- `Base2.Identity.Data/src/Tenancy/Guard/AmbientRequestGuard.cs`
- `Base2.Identity.Data/src/Tenancy/Guard/TenantReadAttribute.cs`
- `Base2.Identity.Data/src/Tenancy/Guard/TenantWriteAttribute.cs`
- `Base2.Identity.Web/src/Identity/AmbientGuardMiddleware.cs`
- `Base2.Data/src/Extensions/IServiceCollectionExtensions.cs`

---

**Last Updated**: 2025-12-06  
**Status**: Design Proposal  
**Decision Required**: Choose implementation approach before implementing WarehouseDbContext RLS
