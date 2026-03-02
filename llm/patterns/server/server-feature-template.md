# Server Feature Template

## Overview

This is a comprehensive, copy-paste-ready template for building new server features. It consolidates all patterns into a single walkthrough, reducing the need to synthesize from multiple documents.

**Time estimate**: 2-3 hours for complete CRUD feature with tests

## Prerequisites

Before starting, determine:
1. **Namespace**: Which feature area? (Access, Business, Prospecting, etc.)
2. **Database**: App (OLTP) or Warehouse (OLAP)?
3. **Entity name**: Singular, PascalCase (e.g., `Contact`, `Sequence`)

## File Structure

For a feature called `Contact` in the `Prospecting` namespace:

```
Base2.Contracts/src/Prospecting/
├── ContactModel.cs              # Basic DTO

Base2.Data/src/Prospecting/
├── Contact.cs                   # Database entity
├── ContactQuery.cs              # Query operations
├── ContactMapper.cs             # Mapperly mapper

Base2.Services/src/Prospecting/
├── ContactService.cs            # Business logic

Base2.Web/src/Controllers/Prospecting/
├── ContactController.cs         # API endpoints
```

---

## Code Style Conventions

Before diving into the template, here are the coding conventions to follow in all server code.

### Parameter Ordering Convention

When service methods need identity context parameters, use this ordering:

1. **userId** - The user performing the operation (when needed)
2. **tenantId** - The tenant context (for create operations)
3. **groupId** - The group context (for create operations)
4. **...data** - The model/entity/parameters for the operation

**When to include each parameter:**

| Parameter | Include When |
|-----------|--------------|
| `userId` | Creating entities with ownership (OwnerId, CreatedBy), or when business logic requires user context |
| `tenantId` | **Create operations only** - must be set on new entities for RLS |
| `groupId` | **Create operations only** - must be set on new entities for group isolation |

```csharp
// Create operation - needs all context to set on entity
Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, CreateModel model);

// Update/Delete - typically don't need tenant/group (RLS handles isolation)
Task<Model?> UpdateAsync(UpdateModel model);
Task<bool> DeleteAsync(long id);

// Operations with user-specific logic
Task<Model[]> ListByOwnerAsync(Guid userId, CancellationToken ct);
```

**Rationale**: 
- `tenantId` and `groupId` are only needed when creating records (to set on the entity)
- Read/Update/Delete operations rely on RLS for tenant isolation
- `userId` is passed when business logic needs to know the actor (ownership, audit)

**Controller responsibility**: Extract values from claims and pass only what's needed:

```csharp
[HttpPost]
[TenantWrite]
public async Task<ActionResult> Post(CreateModel model)
{
    var (userId, tenantId, groupId) = User.GetUserIdentifiers()
    var result = await _service.CreateAsync(userId, tenantId, groupId, model);
    return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
}
```

NOTE: `var (userId, tenantId, groupId) = User.GetUserIdentifiers()` is shorthand for:

```csharp
Guid userId = User.GetNameIdentifier();
Guid tenantId = User.GetTenantId();
Guid groupId = User.GetGroupId();
```

**When to use TenantContext injection**: Use `TenantContext<Guid>` injection in lower-level services when the values aren't passed down explicitly (e.g., background jobs, nested service calls).

### Using Statement Organization

**Placement**: Using statements go **above** the namespace declaration. Type aliases go **after** the namespace.

Group `using` statements in this order, with blank lines between groups:

1. **System** namespaces (`System.*`)
2. **Microsoft** namespaces (`Microsoft.*`)
3. **Third-party** namespaces (e.g., `Riok.Mapperly`, `FluentValidation`)
4. **Project** namespaces (`Base2.*`)

```csharp
using System.Text.Json;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Riok.Mapperly.Abstractions;

using Base2.Core.Identity;
using Base2.Infrastructure;
using Base2.Prospecting;

namespace Base2.Interaction;

using Record = IncomingReply;
using Model = IncomingReplyModel;
```

**Key Rules**:
- ✅ Using statements go above the namespace
- ✅ Blank line before namespace declaration
- ✅ Type aliases go after the namespace
- ✅ Group by: System → Microsoft → 3rd party → Project (ProductName)

### Primary Constructors

Prefer primary constructors for controllers and services. This reduces boilerplate while maintaining clear dependency declaration.

**Controllers** (always use primary constructors):

```csharp
[ApiController]
public class ContactController(
    ILogger<ContactController> logger,
    ContactService contactService) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly ContactService _contactService = contactService;
    
    // ... methods
}
```

**Services** (prefer primary constructors):

```csharp
public class ContactService(
    AppDbContext dbContext,
    ILogger<ContactService> logger,
    TenantContext<Guid> tenantContext)
{
    private readonly ILogger _logger = logger;
    private readonly AppDbContext _dbContext = dbContext;
    private readonly DbSet<Contact> _dbSet = dbContext.Contacts;
    private readonly TenantContext<Guid> _tenantContext = tenantContext;
    
    // ... methods
}
```

### Namespace Organization (Vertical Slices)

**Rule**: Keep namespaces "vertically integrated" - **no intermediate layer namespaces** like `.Data`, `.Services`, or `.BackgroundJobs`.

For example, for the `AI` feature area:
- `Base2.Contracts` → `Base2.AI` (models)
- `Base2.Services` → `Base2.AI` (services)
- `Base2.Data` → `Base2.AI` (entities, queries)
- `Base2.Web` → `Base2.Controllers.AI` (controllers)

Projects are organized by vertical slice, so namespaces are **uniform across projects**. The namespace is defined by `<RootNamespace>` in each `.csproj` file.

For example, for the `Interaction` feature area:

| Project | Namespace | Contains |
|---------|-----------|----------|
| `Base2.Contracts/src/Interaction/` | `Base2.Interaction` | Models, DTOs, interfaces |
| `Base2.Data/src/Interaction/` | `Base2.Interaction` | Entities, queries, mappers |
| `Base2.Services/src/Interaction/` | `Base2.Interaction` | Services, business logic |
| `Base2.Background.Tasks/src/Interaction/` | `Base2.Interaction` | Background jobs, enqueuers |
| `Base2.Web/src/Controllers/Interaction/` | `Base2.Controllers.Interaction` | API controllers (exception) |

**Benefits**:
- ✅ Types from different projects share the same namespace
- ✅ Cleaner imports - no need for using statements within the same feature
- ✅ Clear vertical slice organization
- ✅ Background job interfaces stay with their feature, not in a separate namespace

```csharp
// In Services/src/Interaction/ReplyIngestionService.cs
using Base2.Infrastructure;
using Base2.Observability;

namespace Base2.Interaction;

// Can use IncomingReplyModel, IReplyIngestionJobEnqueuer without imports
// because they're all in Base2.Interaction
public class ReplyIngestionService(
    WarehouseDbContext dbContext,
    IReplyIngestionJobEnqueuer jobEnqueuer) : IReplyIngestionService
{
    // ...
}
```

**❌ Don't**:
```csharp
namespace Base2.Services.Interaction;  // ❌ Extra .Services layer
namespace Base2.Data.Interaction;     // ❌ Extra .Data layer
namespace Base2.BackgroundJobs;       // ❌ Separate from feature
```

**✅ Do**:
```csharp
namespace Base2.Interaction;          // ✅ Feature-level namespace
```

**Exception**: Controllers use `Base2.Controllers.{Feature}` to avoid conflicts with the ASP.NET routing convention.

---

## Step 1: Model (Contracts Layer)

**File**: `Base2.Contracts/src/Prospecting/ContactModel.cs`

```csharp
namespace Base2.Prospecting;

/// <summary>
/// Represents a contact for outreach.
/// </summary>
public class ContactModel
{
    /// <summary>
    /// The contact ID.
    /// </summary>
    [Display(Name = "ID")]
    public long Id { get; set; }

    /// <summary>
    /// The organization this contact belongs to.
    /// </summary>
    [Display(Name = "Organization ID")]
    [Required]
    public long OrgId { get; set; }

    /// <summary>
    /// The contact's first name.
    /// </summary>
    [Display(Name = "First Name")]
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = null!;

    /// <summary>
    /// The contact's last name.
    /// </summary>
    [Display(Name = "Last Name")]
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = null!;

    /// <summary>
    /// The contact's email address.
    /// </summary>
    [Display(Name = "Email")]
    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }

    /// <summary>
    /// The contact's company name.
    /// </summary>
    [Display(Name = "Company")]
    [StringLength(200)]
    public string? Company { get; set; }

    /// <summary>
    /// The contact's job title.
    /// </summary>
    [Display(Name = "Title")]
    [StringLength(100)]
    public string? Title { get; set; }

    /// <summary>
    /// The contact's status.
    /// </summary>
    [Display(Name = "Status")]
    [Required]
    [StringLength(20)]
    public string StatusId { get; set; } = null!;
}

/// <summary>
/// Detailed contact model with related entities and temporal tracking.
/// </summary>
public class ContactDetailModel : ContactModel, ITemporal
{
    /// <summary>
    /// The organization this contact belongs to.
    /// </summary>
    public OrganizationModel Organization { get; set; } = null!;

    // Add other related entities as needed
    // public SequenceEnrollmentModel[] Enrollments { get; set; } = [];

    #region ITemporal

    /// <summary>
    /// The created timestamp.
    /// </summary>
    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The updated timestamp.
    /// </summary>
    [Display(Name = "Updated At")]
    public DateTime UpdatedAt { get; set; }

    #endregion ITemporal
}
```

### Key Points

- **Basic Model**: No temporal fields (`CreatedAt`, `UpdatedAt`)—they're not exposed via basic API.
- **Detail Model**: Implements `ITemporal`—exposes `CreatedAt` and `UpdatedAt` for detailed views.
- **Use data annotations**: `[Required]`, `[StringLength]`, `[EmailAddress]` for validation.
- **Nullable references**: Use `string?` for optional fields, `string` with `= null!` for required.

---

## Step 2: Entity (Data Layer)

**File**: `Base2.Data/src/Prospecting/Contact.cs`

```csharp
namespace Base2.Prospecting;

using TRecord = Contact;

/// <summary>
/// Contact entity for database persistence.
/// </summary>
public class Contact : ContactModel, ITemporalRecord
{
    #region Internal properties (not exposed via API)

#if RESELLER
    /// <summary>
    /// The group ID this contact belongs to (reseller mode).
    /// </summary>
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

    /// <summary>
    /// The tenant ID this contact belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// The organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The contact status enumeration.
    /// </summary>
    public ContactStatusEnum? ContactStatusEnum { get; set; }

    // Add other navigation properties as needed
    // public ICollection<SequenceEnrollment> Enrollments { get; set; } = new List<SequenceEnrollment>();

    #endregion Navigation properties

    #region ITemporalRecord

    /// <summary>
    /// The created timestamp.
    /// </summary>
    [Display(Name = "Created At")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The updated timestamp.
    /// </summary>
    [Display(Name = "Updated At")]
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// The deleted timestamp (soft delete).
    /// </summary>
    [Display(Name = "Deleted At")]
    public DateTime? DeletedAt { get; set; }

    #endregion ITemporalRecord
}
```

### Key Points

- **Inherits from Model**: Entity inherits from the basic model class.
- **TenantId**: Required for RLS (Row-Level Security).
- **GroupId**: Only include if `RESELLER` mode is enabled.
- **ITemporalRecord**: Includes `DeletedAt` for soft deletes (internal only).
- **Navigation properties**: Define relationships to other entities.

---

## Step 3: DbContext Registration

**File**: `Base2.Data/src/AppDbContext.cs` (or `WarehouseDbContext.cs`)

Add the DbSet:

```csharp
public DbSet<Contact> Contacts { get; set; } = null!;
```

Add the configuration in `OnModelCreating`:

```csharp
// Contact configuration
modelBuilder.Entity<Contact>(entity =>
{
    entity.ToTable("contact");
    
    entity.HasKey(e => e.Id);
    
    entity.Property(e => e.FirstName)
        .HasColumnName("first_name")
        .HasMaxLength(100)
        .IsRequired();
    
    entity.Property(e => e.LastName)
        .HasColumnName("last_name")
        .HasMaxLength(100)
        .IsRequired();
    
    entity.Property(e => e.Email)
        .HasColumnName("email")
        .HasMaxLength(255);
    
    entity.Property(e => e.Company)
        .HasColumnName("company")
        .HasMaxLength(200);
    
    entity.Property(e => e.Title)
        .HasColumnName("title")
        .HasMaxLength(100);
    
    entity.Property(e => e.StatusId)
        .HasColumnName("status_id")
        .HasMaxLength(20)
        .IsRequired();
    
    entity.Property(e => e.TenantId)
        .HasColumnName("tenant_id")
        .IsRequired();
    
    // Temporal properties
    entity.Property(e => e.CreatedAt).HasColumnName("created_at");
    entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
    entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");
    
    // Relationships
    entity.HasOne(e => e.Organization)
        .WithMany()
        .HasForeignKey(e => e.OrgId)
        .IsRequired();
    
    // Status enumeration relationship
    entity.HasOne(e => e.ContactStatusEnum)
        .WithMany()
        .HasForeignKey(e => e.StatusId)
        .IsRequired();
});
```

---

## Step 4: Query Class (Data Layer)

**File**: `Base2.Data/src/Prospecting/ContactQuery.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Base2.Prospecting;

using Record = Contact;

/// <summary>
/// Contact query operations.
/// </summary>
/// <remarks>
/// Queries are tenant-agnostic by design. RLS automatically filters by tenant at the database level.
/// Never add WHERE tenant_id = @tenantId—RLS handles it.
/// </remarks>
public record ContactQuery(DbSet<Record> DbSet, ILogger logger)
{
    /// <summary>
    /// Gets a single contact by ID (read-only, no tracking).
    /// </summary>
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single contact by ID (with change tracking for updates).
    /// </summary>
    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .AsTracking()
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single contact by ID with related entities (read-only).
    /// </summary>
    public Task<Record?> SingleDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Include(e => e.Organization)
        .Include(e => e.ContactStatusEnum)
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single contact by ID with related entities (with tracking).
    /// </summary>
    public Task<Record?> TrackDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Include(e => e.Organization)
        .Include(e => e.ContactStatusEnum)
        .AsTracking()
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets all contacts.
    /// </summary>
    public Task<Record[]> ListAsync(CancellationToken cancellationToken = default) => DbSet
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds contacts by email.
    /// </summary>
    public Task<Record?> FindByEmailAsync(string email, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Email == email)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Finds contacts by organization.
    /// </summary>
    public Task<Record[]> FindByOrganizationAsync(long orgId, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.OrgId == orgId)
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds contacts by name (partial match).
    /// </summary>
    public Task<Record[]> FindByNameAsync(string name, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.FirstName.Contains(name) || e.LastName.Contains(name))
        .ToArrayAsync(cancellationToken);
}
```

### Key Points

- **Record pattern**: Use `public record ContactQuery(...)` with primary constructor.
- **No tenant filtering**: RLS handles tenant isolation automatically.
- **Read vs Track**: Use `SingleOrDefaultAsync` for reads, `TrackOrDefaultAsync` for updates.
- **Include**: Add `.Include()` for detail queries that need related entities.

---

## Step 5: Mapper (Data Layer)

**File**: `Base2.Data/src/Prospecting/ContactMapper.cs`

```csharp
using Base2.Access;

namespace Base2.Prospecting;

using Record = Contact;
using Model = ContactModel;
using DetailModel = ContactDetailModel;

/// <summary>
/// Contact mapper using Mapperly.
/// </summary>
[Mapper(UseDeepCloning = true, PropertyNameMappingStrategy = PropertyNameMappingStrategy.CaseInsensitive)]
public static partial class ContactMapper
{
    /// <summary>
    /// Maps the entity to the basic model.
    /// </summary>
    /// <remarks>
    /// Basic models exclude:
    /// - Internal fields (TenantId, GroupId)
    /// - Temporal fields (CreatedAt, UpdatedAt, DeletedAt)
    /// - Navigation properties
    /// </remarks>
#if RESELLER
    [MapperIgnoreSource(nameof(Record.GroupId))]
#endif
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.Organization))]
    [MapperIgnoreSource(nameof(Record.ContactStatusEnum))]
    [MapperIgnoreSource(nameof(Record.CreatedAt))]
    [MapperIgnoreSource(nameof(Record.UpdatedAt))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    public static partial Model ToModel(this Record source);

    /// <summary>
    /// Maps the entity to the detail model.
    /// </summary>
    /// <remarks>
    /// Detail models include:
    /// - Temporal fields (CreatedAt, UpdatedAt) - mapped from source
    /// - Related entities as basic models
    /// 
    /// Detail models exclude:
    /// - Internal fields (TenantId, GroupId, DeletedAt)
    /// - Navigation property enumerations
    /// </remarks>
#if RESELLER
    [MapperIgnoreSource(nameof(Record.GroupId))]
#endif
    [MapperIgnoreSource(nameof(Record.TenantId))]
    [MapperIgnoreSource(nameof(Record.ContactStatusEnum))]
    [MapperIgnoreSource(nameof(Record.DeletedAt))]
    // Note: Organization is NOT ignored - it maps to DetailModel.Organization
    public static partial DetailModel ToDetailModel(this Record source);

    /// <summary>
    /// Maps entities to basic models (array).
    /// </summary>
    public static partial Model[] ToModels(this IEnumerable<Record> source);

    /// <summary>
    /// Maps entities to detail models (array).
    /// </summary>
    public static partial DetailModel[] ToDetailModels(this IEnumerable<Record> source);

    /// <summary>
    /// Maps the model to a new entity.
    /// </summary>
    /// <remarks>
    /// When creating records, exclude:
    /// - Internal fields (set by service)
    /// - Temporal fields (set by service)
    /// - Navigation properties
    /// </remarks>
#if RESELLER
    [MapperIgnoreTarget(nameof(Record.GroupId))]
#endif
    [MapperIgnoreTarget(nameof(Record.TenantId))]
    [MapperIgnoreTarget(nameof(Record.Organization))]
    [MapperIgnoreTarget(nameof(Record.ContactStatusEnum))]
    [MapperIgnoreTarget(nameof(Record.CreatedAt))]
    [MapperIgnoreTarget(nameof(Record.UpdatedAt))]
    [MapperIgnoreTarget(nameof(Record.DeletedAt))]
    public static partial Record ToRecord(this Model source);

    /// <summary>
    /// Updates an existing entity from a model.
    /// </summary>
    /// <remarks>
    /// Only update business fields. Never update:
    /// - Id, TenantId, GroupId
    /// - CreatedAt, DeletedAt
    /// - Navigation properties
    /// UpdatedAt is set by the service.
    /// </remarks>
    public static void UpdateFrom(this Record record, Model model)
    {
        record.OrgId = model.OrgId;
        record.FirstName = model.FirstName;
        record.LastName = model.LastName;
        record.Email = model.Email;
        record.Company = model.Company;
        record.Title = model.Title;
        record.StatusId = model.StatusId;
    }

    // Private mappers for related entities (delegation pattern - preferred)
    // Delegates to canonical mappers for consistency across the codebase
    private static OrganizationModel MapToOrganizationModel(Organization source) 
        => OrganizationMapper.ToModel(source);
}
```

### Private Mappers for Related Entities

When DetailModels include navigation properties, Mapperly needs private mappers to convert related entities. The preferred pattern is **delegation to canonical mappers**:

```csharp
// Preferred: Delegate to canonical mapper
private static OrganizationModel MapToOrganizationModel(Organization source) 
    => OrganizationMapper.ToModel(source);
```

This ensures consistent mapping behavior across the codebase. See [Mapper Patterns](./mapper-patterns.md) for full details on private mappers.

### Mapper Rules Summary

| From → To | Ignore on Source | Ignore on Target |
|-----------|------------------|------------------|
| Entity → Model | TenantId, GroupId, Temporal, Navigation | — |
| Entity → DetailModel | TenantId, GroupId, DeletedAt, Enum navigation | — |
| Model → Entity | — | TenantId, GroupId, Temporal, Navigation |

---

## Step 6: Service (Services Layer)

**File**: `Base2.Services/src/Prospecting/ContactService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Base2.Core.Identity;
using Base2.Data;
using Base2.Pagination;

namespace Base2.Prospecting;

using Record = Contact;
using Model = ContactModel;
using DetailModel = ContactDetailModel;

/// <summary>
/// Contact service for business logic and data operations.
/// </summary>
/// <remarks>
/// Services are responsible for:
/// - Setting TenantId on new entities
/// - Setting timestamps (CreatedAt, UpdatedAt)
/// - Business logic and validation
/// 
/// Services do NOT inject IRequestDbGuard. RLS context is set at the controller level.
/// </remarks>
public class ContactService(
    AppDbContext dbContext,  // or WarehouseDbContext
    ILogger<ContactService> logger,
    TenantContext<Guid> tenantContext)
{
    private readonly ILogger _logger = logger;
    private readonly AppDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.Contacts;
    private readonly ContactQuery _query = new(dbContext.Contacts, logger);
    private readonly TenantContext<Guid> _tenantContext = tenantContext;

    /// <summary>
    /// Gets a single contact by ID.
    /// </summary>
    public async Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleOrDefaultAsync(id, cancellationToken);
        return record?.ToModel();
    }

    /// <summary>
    /// Gets a single contact by ID with related entities.
    /// </summary>
    public async Task<DetailModel?> ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleDetailOrDefaultAsync(id, cancellationToken);
        return record?.ToDetailModel();
    }

    /// <summary>
    /// Gets all contacts.
    /// </summary>
    public async Task<Model[]> ListAsync(CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.ListAsync(cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Creates a new contact.
    /// </summary>
    /// <param name="userId">The ID of the user creating the contact.</param>
    /// <param name="tenantId">The tenant ID for data isolation.</param>
    /// <param name="groupId">The group ID for group isolation.</param>
    /// <param name="model">The contact model.</param>
    /// <returns>The created contact model.</returns>
    public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
    {
        Record record = model.ToRecord();
        
        // Service responsibility: Set identity context and timestamps
        record.UserId = userId;
        record.TenantId = tenantId;
#if RESELLER
        record.GroupId = groupId;
#endif
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Add(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created contact {ContactId}: {FirstName} {LastName}", 
            record.Id, record.FirstName, record.LastName);
        return record.ToModel();
    }

    /// <summary>
    /// Updates an existing contact.
    /// </summary>
    public async Task<Model?> UpdateAsync(Model model)
    {
        Record? record = await _query.TrackOrDefaultAsync(model.Id);
        if (record is null)
        {
            _logger.LogWarning("Attempted to update non-existent contact {ContactId}", model.Id);
            return null;
        }

        record.UpdateFrom(model);
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated contact {ContactId}: {FirstName} {LastName}",
            record.Id, record.FirstName, record.LastName);
        return record.ToModel();
    }

    /// <summary>
    /// Deletes a contact.
    /// </summary>
    public async Task<bool> DeleteAsync(long id)
    {
        Record? record = await _query.TrackOrDefaultAsync(id);
        if (record is null)
        {
            _logger.LogWarning("Attempted to delete non-existent contact {ContactId}", id);
            return false;
        }

        _dbSet.Remove(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted contact {ContactId}: {FirstName} {LastName}",
            id, record.FirstName, record.LastName);
        return true;
    }

    /// <summary>
    /// Gets a paginated list of contacts with search support.
    /// </summary>
    public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<Record> queryable = _dbSet.AsQueryable();

        query.Search((term) =>
        {
            queryable = queryable
                .Where(c => c.FirstName.ToLower().Contains(term) ||
                           c.LastName.ToLower().Contains(term) ||
                           c.Email!.ToLower().Contains(term) ||
                           c.Company!.ToLower().Contains(term));
        });

        Record[] records = await queryable
            .OrderByPage(query, nameof(Record.LastName))
            .Paginate(query, out int count)
            .ToArrayAsync(cancellationToken);

        return PagedResult.Create(records.ToModels(), count, (string?)null);
    }

    /// <summary>
    /// Finds a contact by email.
    /// </summary>
    public async Task<Model?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.FindByEmailAsync(email, cancellationToken);
        return record?.ToModel();
    }

    /// <summary>
    /// Finds contacts by organization.
    /// </summary>
    public async Task<Model[]> FindByOrganizationAsync(long orgId, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByOrganizationAsync(orgId, cancellationToken);
        return records.ToModels();
    }
}
```

### Key Points

- **TenantContext injection**: Used to set `TenantId` on new entities.
- **No IRequestDbGuard**: Services don't inject the guard—controllers handle RLS.
- **Timestamps**: Service sets `CreatedAt`/`UpdatedAt` explicitly.
- **Logging**: Log significant operations with structured logging.

---

## Step 7: Register Service in DI

**File**: `Base2.Services/src/Extensions/IServiceCollectionExtensions.cs`

Add to the service registration:

```csharp
services.AddScoped<ContactService>();
```

---

## Step 8: Controller (Web Layer)

**File**: `Base2.Web/src/Controllers/Prospecting/ContactController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;

using Base2.Prospecting;
using Base2.Pagination;

namespace Base2.Controllers.Prospecting;

[Route("api/[area]/[controller]")]
[Area(nameof(Prospecting))]
[Tags(nameof(Prospecting))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class ContactController(
    ILogger<ContactController> logger,
    ContactService contactService) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly ContactService _contactService = contactService;

    /// <summary>
    /// Get a contact
    /// </summary>
    [HttpGet("{id:long}")]
    [TenantRead]
    [Produces(typeof(ContactModel))]
    [EndpointDescription("Returns a contact.")]
    public async Task<ActionResult> Get(long id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return BadRequest();

        ContactModel? result = await _contactService.ReadOrDefaultAsync(id, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get a contact with details
    /// </summary>
    [HttpGet("{id:long}/detail")]
    [TenantRead]
    [Produces(typeof(ContactDetailModel))]
    [EndpointDescription("Returns a contact with related entities.")]
    public async Task<ActionResult> GetDetail(long id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return BadRequest();

        ContactDetailModel? result = await _contactService.ReadDetailOrDefaultAsync(id, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get a list of contacts
    /// </summary>
    [HttpGet]
    [TenantRead]
    [Produces("application/json", Type = typeof(PagedResult<ContactModel>))]
    [EndpointDescription("Returns a paginated list of contacts.")]
    public async Task<ActionResult> List([FromQuery] PagedQuery query, CancellationToken cancellationToken)
    {
        PagedResult<ContactModel, string?> result = await _contactService.GetPagedAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create a contact
    /// </summary>
    [HttpPost]
    [TenantWrite]
    [Produces(typeof(ContactModel))]
    [EndpointDescription("Creates a contact.")]
    public async Task<ActionResult> Post(ContactModel model)
    {
        if (model is null)
            return BadRequest();

        var (userId, tenantId, groupId) = User.GetUserIdentifiers();
        ContactModel result = await _contactService.CreateAsync(userId, tenantId, groupId, model);
        return Ok(result);
    }

    /// <summary>
    /// Update a contact
    /// </summary>
    [HttpPut]
    [TenantWrite]
    [Produces(typeof(ContactModel))]
    [EndpointDescription("Updates a contact.")]
    public async Task<ActionResult> Put(ContactModel model)
    {
        if (model is null)
            return BadRequest();

        ContactModel? result = await _contactService.UpdateAsync(model);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Delete a contact
    /// </summary>
    [HttpDelete("{id:long}")]
    [TenantWrite]
    [EndpointDescription("Deletes a contact.")]
    public async Task<ActionResult> Delete(long id)
    {
        if (id <= 0)
            return BadRequest();

        bool succeeded = await _contactService.DeleteAsync(id);
        if (!succeeded)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Search contacts by email
    /// </summary>
    [HttpGet("search/email")]
    [TenantRead]
    [Produces(typeof(ContactModel))]
    [EndpointDescription("Finds a contact by email.")]
    public async Task<ActionResult> SearchByEmail([FromQuery] string email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest();

        ContactModel? result = await _contactService.FindByEmailAsync(email, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get contacts by organization
    /// </summary>
    [HttpGet("organization/{orgId:long}")]
    [TenantRead]
    [Produces("application/json", Type = typeof(ContactModel[]))]
    [EndpointDescription("Returns contacts for an organization.")]
    public async Task<ActionResult> GetByOrganization(long orgId, CancellationToken cancellationToken)
    {
        if (orgId <= 0)
            return BadRequest();

        ContactModel[] results = await _contactService.FindByOrganizationAsync(orgId, cancellationToken);
        return Ok(results);
    }
}
```

### RLS Attributes

| Attribute | When to Use | What It Does |
|-----------|-------------|--------------|
| `[TenantRead]` | GET operations | Sets read-only RLS context |
| `[TenantWrite]` | POST, PUT, DELETE | Sets read-write RLS context |

For complex operations (read-then-write), use manual guard calls instead:

```csharp
// Manual pattern for read-then-write
[HttpPut]
public async Task<ActionResult> ComplexUpdate(ContactModel model, 
    [FromServices] IRequestDbGuard guard)
{
    // Read first to validate
    await guard.EnsureReadAsync();
    var exists = await _contactService.ReadOrDefaultAsync(model.Id);
    if (exists is null)
        return NotFound();
    
    // Promote to write
    await guard.EnsureWriteAsync();
    var result = await _contactService.UpdateAsync(model);
    return Ok(result);
}
```

---

## Step 9: Add RLS Support

### 9.1 Entity Requirements

Your entity must have the `TenantId` property (already added in Step 2):

```csharp
[Display(Name = "Tenant ID")]
[Required]
public Guid TenantId { get; set; }
```

### 9.2 Service Sets TenantId (and GroupId)

Your service must set `TenantId` (and `GroupId` in reseller mode) when creating entities.
This is generally done by passing the values in to the CreateAsync method (as done in Step 6).
However, if these values aren't available, `TenantContext` may be injected.

```csharp
record.TenantId = _tenantContext.TenantId;
#if RESELLER
record.GroupId = _tenantContext.GroupId;
#endif
```

### 9.3 Controller Uses RLS Attributes

Use `[TenantRead]` or `[TenantWrite]` on controller actions (already done in Step 8).

### 9.4 Register Table for RLS Policy Creation

Add your table to the RLS policy manager in migration scripts:

**File**: `Base2.Data/src/Migrations/Scripts/AddRlsPolicy.sql`

```sql
-- Add RLS policy for contacts table
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contact
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

> NOTE: This can be skipped during early development.

Or register in `RlsPolicyManager`:

```csharp
// In RlsPolicyManager.cs
public static readonly string[] TablesWithTenantOnly = 
[
    // ... existing tables
    "contact",
];
```

> NOTE: Prefer this option for now.

### RLS Quick Reference

| Layer | Responsibility |
|-------|----------------|
| **Controller** | Call `[TenantRead]`/`[TenantWrite]` or manual guard |
| **Service** | Set `TenantId` on new entities; NO guard injection |
| **Query** | No tenant filtering—RLS handles it automatically |
| **Database** | PostgreSQL RLS policy filters all queries |

**See**: [RLS Patterns](./rls-patterns.md) for comprehensive RLS documentation.

---

## Step 10: TypeScript Generation (Optional)

If your API is consumed by the TypeScript client, register your models in `AppGenerationSpec.cs` and generate TypeScript types. This ensures type safety between server and client.

### 10.1 Register Models and Enums

**File**: `Base2.Web/src/Models/AppGenerationSpec.cs`

1. Add the namespace import at the top:

```csharp
using Base2.Prospecting;  // or your namespace
```

2. Add your models and enums to the constructor:

```csharp
public class AppGenerationSpec : BaseGenerationSpec
{
    public AppGenerationSpec()
    {
        // ... existing registrations ...

        // Prospecting models
        const string prospectingPath = "prospecting";
        
        // Register enums first (as string union types)
        AddEnum<ContactStatus>(prospectingPath, asUnionType: true);
        AddEnum<ContactSource>(prospectingPath, asUnionType: true);
        
        // Register basic model with enum type mappings
        AddInterface<ContactModel>(prospectingPath)
            .Member(x => nameof(x.StatusId)).Type(nameof(ContactStatus), "./contact-status")
            .Member(x => nameof(x.SourceId)).Type(nameof(ContactSource), "./contact-source");
        
        // Register detail model (inherits from basic model)
        AddInterface<ContactDetailModel>(prospectingPath);
    }
}
```

### Registration Methods Reference

| Method | Use For | Example |
|--------|---------|---------|
| `AddInterface<T>(path)` | Models/DTOs | `AddInterface<ContactModel>("prospecting")` |
| `AddEnum<T>(path, asUnionType: true)` | Enumerations | `AddEnum<ContactStatus>("prospecting", asUnionType: true)` |
| `.Member(x => ...).Type(typeName, relativePath)` | Override property type | Map string `StatusId` to enum type |

### Type Mapping Patterns

**Enum Properties**: When a model has string properties that reference enums (e.g., `StatusId`), use `.Member().Type()` to map them:

```csharp
AddInterface<ContactModel>(prospectingPath)
    .Member(x => nameof(x.StatusId))
    .Type(nameof(ContactStatus), "./contact-status");
```

This generates:

```typescript
export interface ContactModel {
    statusId: ContactStatus;  // Instead of: statusId: string;
}
```

**Important**: 
- Always use `asUnionType: true` for enums to generate TypeScript string literal union types (e.g., `"draft" | "active"`) instead of enum objects
- Register enums before models that reference them
- Use relative paths in `.Type()` for proper imports (e.g., `"./contact-status"`)

### 10.2 Generate TypeScript Types

Run the TypeGen command to generate TypeScript models:

```bash
cd main/src/server/Base2.Web/src
./update-models.cmd
```

Or manually:

```bash
cd main/src/server/Base2.Web/src
dotnet typegen generate
```

### 10.3 Generated Output

Generated files appear in `client/common/src/models/{path}/` with the following structure:

```
client/common/src/models/prospecting/
├── contact-model.ts           # Basic model interface
├── contact-detail-model.ts    # Detail model interface
├── contact-status.ts          # Status enum as union type
└── contact-source.ts          # Source enum as union type
```

**Example generated interface**:

```typescript
// contact-model.ts
import { ContactStatus } from './contact-status';
import { ContactSource } from './contact-source';

export interface ContactModel {
    id: number;
    orgId: number;
    firstName: string;
    lastName: string;
    email?: string;
    company?: string;
    title?: string;
    statusId: ContactStatus;
    sourceId: ContactSource;
}
```

**Example generated enum**:

```typescript
// contact-status.ts
export type ContactStatus = "draft" | "active" | "inactive" | "archived";
```

### 10.4 Verification

After generation, verify:

1. **Enum format**: Enum files use `export type EnumName = "value1" | "value2"` format (string union types) rather than `export enum EnumName { ... }` format
2. **Property types**: Model properties reference the correct enum types instead of `string`
3. **Imports**: Generated files have proper relative imports for enum types
4. **No compilation errors**: Run `npm run build` in the client project to verify

### Benefits

- **Type Safety**: Compile-time checking of API contracts between server and client
- **Auto-Sync**: Changes to C# models automatically update TypeScript types
- **Consistency**: Single source of truth for data structures
- **Developer Experience**: IntelliSense and auto-completion in client code
- **Refactoring Safety**: Renaming fields in C# automatically updates TypeScript

### Common Issues

| Issue | Solution |
|-------|----------|
| Enum generates as object instead of union type | Add `asUnionType: true` parameter |
| Property shows as `string` instead of enum type | Add `.Member().Type()` mapping |
| Import path errors | Use relative paths like `"./enum-name"` |
| Missing types | Ensure namespace is imported in `AppGenerationSpec.cs` |

---

## Step 11: Migration

Create a migration for the new table:

```bash
dotnet ef migrations add AddContactTable -p Base2.Data -s Base2.Web
```

Apply the migration:

```bash
dotnet ef database update -p Base2.Data -s Base2.Web
```

Or, during early development regenerate the migration.

When testing RLS:

```bash
reset-npgsql-app-database.cmd
reset-npgsql-warehouse-database.cmd
```

Or when normally developing:
```bash
reset-sqlite-app-database.cmd
reset-sqlite-warehouse-database.cmd
```

---

## Step 12: Testing

### Unit Tests for Service

**File**: `Base2.Services/test/Prospecting/ContactServiceTests.cs`

```csharp
namespace Base2.Services.Test.Prospecting;

public class ContactServiceTests
{
    [Fact]
    public async Task CreateAsync_ShouldSetIdentityContextAndTimestamps()
    {
        // Arrange
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        var tenantContext = new TenantContext<Guid> { TenantId = tenantId };
        var service = new ContactService(db, Mock.Of<ILogger<ContactService>>(), tenantContext);
        
        var model = new ContactModel
        {
            OrgId = 1,
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            StatusId = "active"
        };

        // Act
        var result = await service.CreateAsync(userId, tenantId, groupId, model);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        
        var saved = await db.Contacts.FindAsync(result.Id);
        saved!.TenantId.Should().Be(tenantId);
        saved.GroupId.Should().Be(groupId);
        saved.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ShouldReturnNull()
    {
        // Arrange
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var service = new ContactService(db, Mock.Of<ILogger<ContactService>>(), 
            new TenantContext<Guid>());
        
        var model = new ContactModel { Id = 999, FirstName = "Test", LastName = "User", StatusId = "active" };

        // Act
        var result = await service.UpdateAsync(model);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WhenExists_ShouldReturnTrue()
    {
        // Arrange
        using var container = new TestDbContextContainer();
        await container.CreateAsync(DatabaseNames.App);
        using var scope = container.BeginScope();
        var db = scope.App;
        
        var contact = new Contact 
        { 
            FirstName = "Test", 
            LastName = "User", 
            StatusId = "active",
            TenantId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Contacts.Add(contact);
        await db.SaveChangesAsync();
        
        var service = new ContactService(db, Mock.Of<ILogger<ContactService>>(), 
            new TenantContext<Guid>());

        // Act
        var result = await service.DeleteAsync(contact.Id);

        // Assert
        result.Should().BeTrue();
        (await db.Contacts.FindAsync(contact.Id)).Should().BeNull();
    }
}
```

### Integration Tests for Controller

**File**: `Base2.Web/test/Prospecting/ContactControllerTests.cs`

```csharp
namespace Base2.Web.Test.Prospecting;

[Collection(WebApplicationFactoryCollection.Name)]
public class ContactControllerTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _factory = fixture.Factory;

    [Fact]
    public async Task Get_WithValidId_ShouldReturnContact()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client);

        // Act
        var response = await client.GetAsync("/api/prospecting/contact/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var contact = await response.Content.ReadFromJsonAsync<ContactModel>();
        contact.Should().NotBeNull();
    }

    [Fact]
    public async Task Post_WithValidModel_ShouldCreateContact()
    {
        // Arrange
        var client = _factory.CreateClient();
        await AuthenticateClient(client);
        
        var model = new ContactModel
        {
            OrgId = 1,
            FirstName = "Jane",
            LastName = "Smith",
            Email = "jane@example.com",
            StatusId = "active"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/prospecting/contact", model);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await response.Content.ReadFromJsonAsync<ContactModel>();
        created!.Id.Should().BeGreaterThan(0);
        created.FirstName.Should().Be("Jane");
    }

    [Fact]
    public async Task Get_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/prospecting/contact/1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
```

---

## Checklist

### Files Created
- [ ] `Contracts/src/Prospecting/ContactModel.cs` - Model and DetailModel
- [ ] `Data/src/Prospecting/Contact.cs` - Entity
- [ ] `Data/src/Prospecting/ContactQuery.cs` - Query class
- [ ] `Data/src/Prospecting/ContactMapper.cs` - Mapperly mapper
- [ ] `Services/src/Prospecting/ContactService.cs` - Service
- [ ] `Web/src/Controllers/Prospecting/ContactController.cs` - Controller

### Configuration
- [ ] DbSet registered in DbContext
- [ ] Entity configuration in `OnModelCreating`
- [ ] Service registered in DI
- [ ] Migration created and applied
- [ ] RLS policy added (for multi-tenant tables)

### TypeScript Generation (if client consumes API)
- [ ] Namespace imported in `AppGenerationSpec.cs`
- [ ] Enums registered with `asUnionType: true`
- [ ] Models registered with enum type mappings (if applicable)
- [ ] TypeScript types generated via `update-models.cmd`
- [ ] Generated files verified (enums as union types, no compilation errors)

### Testing
- [ ] Service unit tests written
- [ ] Controller integration tests written
- [ ] Both success and error paths tested

---

## Related Documentation

- [Server Architecture Patterns](./server-architecture-patterns.md) - Design principles
- [RLS Patterns](./rls-patterns.md) - Row-Level Security patterns
- [Mapper Patterns](./mapper-patterns.md) - Complex mapping scenarios
- [Pagination Patterns](./pagination-patterns.md) - List endpoint patterns
- [Testing Patterns](./testing-patterns.md) - Testing examples
- [Database Testing Pattern](./database-testing-pattern.md) - Fast database tests

---

**Last Updated**: 2025-12-07  
**Maintained By**: Engineering Team
