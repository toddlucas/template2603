# Base2.Identity.Data

Multi-tenancy extensions for ASP.NET Core Identity with PostgreSQL Row-Level Security (RLS) enforcement.

## Overview

This library extends Microsoft's ASP.NET Core Identity to support multi-tenancy in applications where MS Identity doesn't natively provide tenant isolation. It provides:

- **Tenant-aware Identity entities** that extend `IdentityUser`, `IdentityDbContext`, etc.
- **Automatic tenant isolation** at the database level using PostgreSQL RLS
- **Request-scoped transaction management** that enforces tenant context consistently
- **Optional hierarchical multi-tenancy** via Groups (RESELLER builds only)

The core philosophy is that **tenant isolation happens automatically at the database layer** via RLS policies, eliminating the need to manually add `WHERE tenant_id = @tenantId` clauses throughout your application code.

---

## Architecture: Four Functional Areas

### 1. Multi-Tenant Identity Model
*Location: `Identity/` folder*

Extends MS Identity entities to be tenant-aware:

- **`TenantIdentityUser<TKey>`** - Adds `TenantId` property (and optionally `GroupId` for RESELLER builds)
- **`IdentityTenant<TKey>`** - Represents a tenant with `Domain` and `Subdomain` properties
- **`IdentityGroup<TKey>`** - Optional group entity for hierarchical multi-tenancy (RESELLER builds)
- **`TenantIdentityDbContext<TUser, TTenant>`** - Extends `IdentityDbContext` with:
  - `Tenants` DbSet (and `Groups` for RESELLER)
  - Overridden uniqueness constraints (username/email unique *per tenant*, not globally)
  - Foreign key relationships between Users → Tenants
- **`CustomClaims`** - Constants for tenant/group claim types

**Key Design Decision:** Username and email are unique per tenant, not globally. Multiple tenants can have users with the same username/email.

---

### 2. Tenant Authentication & Claims
*Location: Split between `Identity/` (Data) and `.Web/Identity/`*

How tenant information flows through the authentication system:

**In Identity.Data:**
- **`CustomClaims`** - Defines claim type URIs for `TenantId` and `GroupId`

**In Identity.Web:**
- **`TenantSignInManager<TUser, TKey>`** - Extends `SignInManager<TUser>` to add tenant/group claims to the user principal during sign-in
- **`TenantClaimsPrincipalExtensions`** - Helper methods to extract tenant/group IDs from `ClaimsPrincipal`

**Flow:**
1. User signs in via `TenantSignInManager`
2. Sign-in manager creates claims principal with `TenantId` claim (from `user.TenantId`)
3. Subsequent requests can extract tenant from `HttpContext.User.GetTenantId()`

---

### 3. Request Tenant Context Resolution
*Location: `Tenancy/TenantContext.cs` (Data) and `.Web/Identity/TenantContextMiddleware.cs`*

Determines which tenant the current request operates under:

- **`TenantContext<TKey>`** - Scoped service that holds the current request's tenant information:
  - `CurrentId` - The active tenant ID for this request
  - `UserTenantId` - Tenant from user claims
  - `SubdomainTenantId` - *(Legacy)* Tenant from subdomain routing
  - `HostnameTenantId` - *(Legacy)* Tenant from hostname routing
  - `CurrentGroupId` - Active group ID (RESELLER builds)

- **`TenantContextMiddleware`** - Middleware that populates `TenantContext` early in the request pipeline:
  - Extracts tenant from authenticated user's claims
  - *(Legacy)* Optionally performs database lookups via subdomain/hostname (to be archived)

**Current Usage:** Tenant is determined from user claims only. The subdomain/hostname resolution features are legacy and can be removed.

---

### 4. Database Transaction Management with RLS Enforcement
*Location: `Tenancy/` folder - the **Guard Pattern***

This is the core mechanism that enforces tenant isolation. See [`Tenancy/README.md`](src/Tenancy/README.md) for detailed usage examples.

#### Components

**Guard Interface & Implementation:**
- **`IRequestDbGuard`** - Interface for request-scoped transaction management
- **`RequestDbGuard<TDb>`** - Implementation that manages read/write transactions for a specific DbContext

**RLS Integration:**
- **`RlsConfig`** - Helper that sets PostgreSQL session variables (`app.tenant_id`, `app.group_id`) used by RLS policies
- **`RequestDbGuard<TDb>.SetTenantContextAsync()`** - Called automatically on transaction start to execute `set_config('app.tenant_id', @tenant, true)`

**Metalama Aspect-Oriented Programming (AOP):**
- **`[TenantRead]` / `[TenantWrite]` attributes** - Declarative transaction boundaries for controller actions
- **`AmbientRequestGuard`** - Static accessor that allows Metalama aspects to access the guard without DI
- **`AmbientGuardMiddleware`** (in .Web) - Middleware that sets up the ambient guard for each request

**Extension Methods:**
- **`RequestDbGuardExtensions`** - Convenience methods like `ExecuteReadAsync()`, `QueryAsync()`, etc.

#### How It Works

1. **Request starts:** `IRequestDbGuard` is registered as scoped (one instance per request)
2. **First read:** `EnsureReadAsync()` is called → starts a read-only transaction
3. **RLS context set:** Guard automatically calls `set_config('app.tenant_id', @tenantId, true)` on the transaction
4. **PostgreSQL RLS enforces isolation:** Your database's RLS policies use `current_setting('app.tenant_id')` to filter rows
5. **Write needed?** `EnsureWriteAsync()` promotes to a write-capable transaction (closes read-only, opens new transaction, re-sets tenant context)
6. **Request ends:** Guard is disposed, transaction commits

#### Transaction Management Philosophy

**The guard pattern owns the transaction lifecycle.** It:
- Lazily creates transactions only when needed
- Optimizes read-only operations with `SET TRANSACTION READ ONLY`
- Automatically promotes to write transactions when `SaveChanges` is called
- **Critically:** Ensures `set_config(..., is_local := true)` is called, which requires an active transaction

#### ⚠️ Important: Transaction Interplay

**The guard pattern manages transactions for you.** When using `IRequestDbGuard`:

**✅ DO:**
- Use `await guard.EnsureReadAsync()` for queries
- Use `await guard.EnsureWriteAsync()` before `SaveChanges()`
- Use `[TenantRead]` / `[TenantWrite]` attributes on controller actions
- Let the guard handle transaction lifecycle (scoped DI handles disposal)

**❌ DON'T:**
- **Avoid manual transactions** when using the guard: `using var tx = context.Database.BeginTransaction()`
- If you need explicit transaction control (e.g., for complex multi-step operations), you have two options:
  1. **Preferred:** Call `guard.EnsureWriteAsync()` once at the start, then do all your work within that transaction
  2. **Advanced:** Don't inject `IRequestDbGuard` and manage transactions manually (but you'll lose automatic RLS context setting)

**Why this matters:** The guard calls `set_config(..., is_local := true)` which requires an active transaction. If you start a second transaction manually, the RLS context won't be set on it, and your queries will fail or bypass tenant isolation.

**Example - Correct complex transaction usage:**

```csharp
public class OrderService
{
    private readonly AppDbContext _dbContext;
    private readonly IRequestDbGuard _guard;

    public OrderService(
        AppDbContext dbContext,
        [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard)
    {
        _dbContext = dbContext;
        _guard = guard;
    }

    public async Task<Order> CreateOrderAsync(OrderDto dto, CancellationToken ct)
    {
        // Start write transaction once
        await _guard.EnsureWriteAsync(ct);

        // All operations use the guard's transaction
        var customer = await _dbContext.Customers.FindAsync(dto.CustomerId);
        var order = new Order { CustomerId = customer.Id, Total = dto.Total };
        _dbContext.Orders.Add(order);
        
        await _dbContext.SaveChangesAsync(ct); // Uses guard's transaction
        
        // Create invoice in same transaction
        var invoice = new Invoice { OrderId = order.Id, Amount = order.Total };
        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync(ct); // Still in guard's transaction
        
        // Transaction commits when guard is disposed (end of request scope)
        return order;
    }
}
```

---

## Configuration & Setup

### Service Registration

In your `Program.cs` or service configuration:

```csharp
// Register tenant services
builder.Services.AddTenantServices();

// Register your DbContext with the guard using keyed services
builder.Services.AddScoped<AppDbContext>();
builder.Services.AddKeyedScoped<IRequestDbGuard>(
    nameof(AppDbContext),
    (sp, key) => new RequestDbGuard<AppDbContext>(
        sp.GetRequiredService<AppDbContext>(),
        sp.GetRequiredService<TenantContext<Guid>>()
    )
);
```

### Middleware Pipeline

Order matters! Add middleware in this sequence:

```csharp
app.UseAuthentication();              // 1. Authenticate user
app.UseTenantContextMiddleware();     // 2. Resolve tenant from claims
app.UseAmbientGuardMiddleware();      // 3. Set up transaction guard
app.UseAuthorization();               // 4. Authorize
app.MapControllers();                 // 5. Route to controllers
```

### Database RLS Policies

Your PostgreSQL database should have RLS policies like:

```sql
-- Enable RLS on your tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy that uses the session variable set by RequestDbGuard
CREATE POLICY tenant_isolation ON invoices
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Known Limitations & TODOs

### RESELLER Build Flag (Compile-Time Multi-Tenancy Mode)

**Current State:** The library supports two multi-tenancy modes controlled by the `RESELLER` preprocessor directive:
- **Standard mode:** User → Tenant (two-level hierarchy)
- **RESELLER mode:** User → Tenant → Group (three-level hierarchy)

This is currently compile-time only. Ideally this would be a runtime configuration, but it's tightly coupled to the identity model and DTOs.

**Impact:** You must choose one mode at build time for all tenants in your system.

### Legacy Tenant Resolution Features (To Be Archived/Removed)

The following features were part of earlier iterations and are candidates for removal:

**In Identity.Data:**
- `ITenantResolver` - Interface for looking up tenants by domain/subdomain
- `TenantContext.SubdomainTenantId`, `TenantContext.HostnameTenantId` - Properties for route-based resolution

**In Identity.Web:**
- `TenantContextMiddleware.UseDatabaseLookup` option
- `RouteValueKey` - Constants for subdomain/hostname routing

**Current approach:** Tenant is always resolved from authenticated user claims only.

---

## Related Projects

This library works alongside:
- **`Base2.Identity.Web`** - Web-specific middleware and authentication components
- **Application-specific Data/Services projects** - Your domain DbContexts that use the guard pattern

---

## Further Reading

- [Tenancy Guard Pattern Details](src/Tenancy/README.md) - Detailed usage examples and patterns
- [Client Overview](../../doc/overview/client/client-overview.md)
- [Server Overview](../../doc/overview/server/server-overview.md)


