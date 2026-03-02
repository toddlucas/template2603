# Database Architecture: Control Plane vs Data Plane

## Overview

The Product Name server uses a **two-database architecture** that separates infrastructure concerns (control plane) from domain-specific business logic (data plane). This document explains the rationale, implementation, and best practices for working with this architecture.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  Controllers → Services → Queries                           │
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
               ▼                        ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  OLTP PLANE              │  │  OLAP PLANE                  │
│  AppDbContext            │  │  WarehouseDbContext          │
├──────────────────────────┤  ├──────────────────────────────┤
│ Infrastructure & Access  │  │ Domain Business Logic        │
│                          │  │                              │
│ • Users                  │  │ • Contacts                   │
│ • Tenants                │  │ • Sequences                  │
│ • Organizations          │  │ • Campaigns                  │
│ • Groups (Reseller)      │  │ • Templates                  │
│ • Roles & Permissions    │  │ • EmailMessages              │
│ • OrganizationMembers    │  │ • Activities                 │
│ • People                 │  │ • Conversations              │
│                          │  │ • AIResearch                 │
│                          │  │                              │
│ [PostgreSQL - App]       │  │ [PostgreSQL - Warehouse]     │
│ RLS: ✅ Active           │  │ RLS: 🔮 Planned             │
│ Size: Small, Stable      │  │ Size: Large, Growing         │
└──────────────────────────┘  └──────────────────────────────┘
         △                             △
         │                              │
         └──────── Foreign Keys ────────┘
            (TenantId, OrganizationId, UserId)
```

## The Two Databases

### AppDbContext - OLTP

**Purpose**: Multi-tenant foundation, identity management, and access control

#### What Belongs Here?

**Identity & Authentication:**
- Users, passwords, authentication tokens
- Roles, permissions, claims
- Login history, security events

**Multi-Tenancy Infrastructure:**
- Tenants (top-level isolation boundary)
- Organizations (companies/customers within tenant)
- Groups (reseller/agency hierarchy)

**Access Control:**
- Organization membership
- User-organization relationships
- Role assignments

#### Characteristics

| Aspect | Description |
|--------|-------------|
| **Schema Stability** | High - changes infrequently |
| **Size** | Small (thousands to tens of thousands of rows) |
| **Change Frequency** | Low - infrastructure changes are rare |
| **RLS Support** | ✅ Full RLS via `IRequestDbGuard` |
| **Deployment Cadence** | Infrequent, carefully coordinated |
| **Backup Strategy** | Daily full backups, point-in-time recovery |
| **Scaling Strategy** | Vertical (single database) |

#### Example Entities

```csharp
// AppDbContext.cs
public class AppDbContext : TenantIdentityDbContext<...>
{
    // Identity
    public DbSet<ApplicationUser> Users { get; set; }
    public DbSet<ApplicationTenant> Tenants { get; set; }
    
    // Access
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<OrganizationMember> OrganizationMembers { get; set; }
    public DbSet<Person> People { get; set; }
}
```

### WarehouseDbContext - OLAP

**Purpose**: Sales engagement domain logic and customer operational data

#### What Belongs Here?

**Core Sales Engagement Entities:**
- Contacts, Accounts, Deals (Prospecting)
- Sequences, Campaigns, Steps (Orchestration)
- Templates, EmailMessages, Calls (Communication)
- Conversations, Replies (Interaction)
- Activities, Events (Analytics)
- AIResearch, Enrichment (Discovery)

#### Characteristics

| Aspect | Description |
|--------|-------------|
| **Schema Stability** | Medium - evolves with product features |
| **Size** | Large (millions to billions of rows) |
| **Change Frequency** | High - new features add tables/columns |
| **RLS Support** | 🔮 Planned (not yet implemented) |
| **Deployment Cadence** | Frequent, independent of control plane |
| **Backup Strategy** | Continuous backups, shorter retention |
| **Scaling Strategy** | Horizontal (future: schema-per-tenant) |

#### Example Entities (Planned)

```csharp
// WarehouseDbContext.cs
public class WarehouseDbContext : DbContext
{
    // Prospecting
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Deal> Deals { get; set; }
    
    // Orchestration
    public DbSet<Sequence> Sequences { get; set; }
    public DbSet<Campaign> Campaigns { get; set; }
    public DbSet<SequenceStep> SequenceSteps { get; set; }
    public DbSet<Template> Templates { get; set; }
    
    // Communication
    public DbSet<EmailMessage> EmailMessages { get; set; }
    public DbSet<Call> Calls { get; set; }
    public DbSet<Task> Tasks { get; set; }
    
    // Interaction
    public DbSet<Conversation> Conversations { get; set; }
    
    // Discovery
    public DbSet<AIResearch> AIResearch { get; set; }
}
```

## Cross-Database Relationships

### Reference Pattern

Data plane entities reference control plane entities **by ID only** (no EF Core navigation properties across databases):

```csharp
// Data Plane Entity
public class Contact
{
    // Control plane references (by ID)
    public Guid TenantId { get; set; }        // → App.Tenant
    public Guid OrganizationId { get; set; }  // → App.Organization
    public Guid OwnerId { get; set; }         // → App.User
    
    // Data plane properties
    public string Email { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    
    // ❌ NO navigation properties to control plane
    // public User Owner { get; set; }  // Don't do this!
}
```

### Querying Across Databases

**Option 1: Application-Level Joins** (Preferred)

```csharp
public class ContactService
{
    private readonly WarehouseDbContext _warehouseDb;
    private readonly AppDbContext _appDb;
    
    public async Task<ContactWithOwnerDto> GetContactWithOwner(Guid contactId)
    {
        // Get contact from warehouse
        var contact = await _warehouseDb.Contacts.FindAsync(contactId);
        
        // Get owner from OLTP database
        var owner = await _appDb.Users.FindAsync(contact.OwnerId);
        
        // Join in application code
        return new ContactWithOwnerDto
        {
            Contact = contact.ToModel(),
            Owner = owner.ToModel()
        };
    }
}
```

**Option 2: Database-Level Foreign Keys** (Optional)

```sql
-- In Warehouse database, add foreign key to App database
ALTER TABLE warehouse.contacts 
ADD CONSTRAINT fk_contacts_owner 
FOREIGN KEY (owner_id) 
REFERENCES product_name.users(id);
```

**Trade-offs:**
- ✅ Referential integrity enforced
- ❌ Tighter coupling between databases
- ❌ Harder to scale independently

**Recommendation**: Use application-level joins for flexibility, add FK constraints only for critical relationships.

## Decision Matrix: Which Database?

Use this matrix to decide where new entities belong:

| Question | Control Plane | Data Plane |
|----------|---------------|------------|
| Is it about authentication/authorization? | ✅ Yes | ❌ No |
| Is it about tenant/organization management? | ✅ Yes | ❌ No |
| Is it domain-specific business logic? | ❌ No | ✅ Yes |
| Will it have millions of rows? | ❌ No | ✅ Yes |
| Does it change frequently with features? | ❌ No | ✅ Yes |
| Is it critical infrastructure? | ✅ Yes | ❌ No |

### Examples

| Entity | Database | Reasoning |
|--------|----------|-----------|
| User | Control Plane | Authentication & authorization |
| Tenant | Control Plane | Multi-tenancy infrastructure |
| Organization | Control Plane | Access control boundary |
| Contact | Data Plane | Domain entity, high volume |
| Sequence | Data Plane | Domain entity, feature-driven |
| EmailMessage | Data Plane | Domain entity, very high volume |
| Template | Data Plane | Domain entity, content |
| Role | Control Plane | Authorization infrastructure |
| Permission | Control Plane | Authorization infrastructure |

## Implementation Guidelines

### Creating New Entities

#### Control Plane Entity

```csharp
// 1. Create entity in Base2.Access namespace
public class Organization
{
    public long Id { get; set; }
    public Guid TenantId { get; set; }  // ✅ Multi-tenant
    public string Name { get; set; }
    
    // Navigation to other control plane entities OK
    public ICollection<OrganizationMember> Members { get; set; }
    
    // Temporal tracking
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// 2. Add to AppDbContext
public DbSet<Organization> Organizations { get; set; }

// 3. Add RLS policy
// Table automatically gets tenant_id filtering via RLS
```

#### Data Plane Entity (Future)

```csharp
// 1. Create entity in appropriate namespace (e.g., Base2.Prospecting)
public class Contact
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }        // ✅ Multi-tenant
    public Guid OrganizationId { get; set; }  // ✅ Reference control plane
    public Guid OwnerId { get; set; }         // ✅ Reference control plane
    
    public string Email { get; set; }
    public string FirstName { get; set; }
    
    // Temporal tracking
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// 2. Add to WarehouseDbContext
public DbSet<Contact> Contacts { get; set; }

// 3. Add RLS policy (when RLS support added to WarehouseDbContext)
```

### Testing Strategy

#### Control Plane Tests

Use `Data.Mock` with `AppDbContext`:

```csharp
[Fact]
public async Task CreateOrganization_ShouldSetTenantId()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App);
    
    using var scope = container.BeginScope();
    var db = scope.App;
    
    var org = new Organization { Name = "Test Org", TenantId = Guid.NewGuid() };
    db.Organizations.Add(org);
    await db.SaveChangesAsync();
    
    org.Id.Should().BeGreaterThan(0);
}
```

#### Data Plane Tests (Future)

Use `Data.Mock` with `WarehouseDbContext`:

```csharp
[Fact]
public async Task CreateContact_ShouldWork()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.Warehouse);
    
    using var scope = container.BeginScope();
    var db = scope.Warehouse;
    
    var contact = new Contact { Email = "test@example.com" };
    db.Contacts.Add(contact);
    await db.SaveChangesAsync();
    
    contact.Id.Should().NotBeEmpty();
}
```

#### Cross-Database Tests

```csharp
[Fact]
public async Task ContactReferencesUser_ShouldWork()
{
    using var container = new TestDbContextContainer();
    await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);
    
    // Create user in control plane
    Guid userId;
    {
        using var scope = container.BeginScope();
        var user = new ApplicationUser { Email = "owner@example.com" };
        scope.App.Users.Add(user);
        await scope.App.SaveChangesAsync();
        userId = user.Id;
    }
    
    // Create contact in data plane that references user
    {
        using var scope = container.BeginScope();
        var contact = new Contact 
        { 
            Email = "contact@example.com",
            OwnerId = userId  // References control plane
        };
        scope.Warehouse.Contacts.Add(contact);
        await scope.Warehouse.SaveChangesAsync();
    }
    
    // Verify relationship (application-level join)
    {
        using var scope = container.BeginScope();
        var contact = await scope.Warehouse.Contacts.FirstAsync();
        var owner = await scope.App.Users.FindAsync(contact.OwnerId);
        
        owner.Should().NotBeNull();
        owner!.Email.Should().Be("owner@example.com");
    }
}
```

## Migration Strategy

### Adding RLS to WarehouseDbContext (Future)

When ready to add RLS to the data plane:

1. **Update WarehouseDbContext to support RLS**:
```csharp
// Option 1: Extend TenantDbContext (if we create one)
public class WarehouseDbContext : TenantDbContext { }

// Option 2: Add RLS manually
// - Add ITenantScoped interface to entities
// - Configure RLS policies in migrations
```

2. **Add RLS policies to all Warehouse tables**:
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contacts
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

3. **Register guard for WarehouseDbContext**:
```csharp
services.AddScoped<IRequestDbGuard<WarehouseDbContext>>(sp => 
    new RequestDbGuard<WarehouseDbContext>(
        sp.GetRequiredService<WarehouseDbContext>(),
        sp.GetRequiredService<TenantContext<Guid>>()
    )
);
```

4. **Update controllers to use appropriate guard**:
```csharp
// For operations on OLTP data
[TenantRead]  // Uses AppDbContext guard

// For operations on OLAP data
[TenantRead(typeof(WarehouseDbContext))]  // Uses WarehouseDbContext guard (future)
```

## Future Scaling: Schema-Per-Tenant

As the data plane grows, consider migrating to **schema-per-tenant** for the App database:

```
Current:
  product_name.contacts (all tenants)
  
Future:
  tenant_123.contacts
  tenant_456.contacts
  tenant_789.contacts
```

**Benefits**:
- Better performance isolation
- Easier per-tenant backups
- Simpler data export for customers
- Clearer data boundaries

**Control plane stays shared** - only data plane migrates.

## Related Documentation

- [Server Overview](../../overview/server/server-overview.md) - Overall architecture
- [RLS Patterns](./rls-patterns.md) - Multi-tenancy and Row-Level Security
- [Database Testing Pattern](./database-testing-pattern.md) - Testing with Data.Mock
- [Server Architecture Patterns](./server-architecture-patterns.md) - Layered architecture

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team
