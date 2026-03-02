# Data Project Restructure: `Base2.Data.Contracts` + `Base2.Data.Local`

**Date:** February 23, 2026  
**Status:** Planning  

---

## Motivation

The document indexing subsystem introduces three new local-only entities: `Workspace`, `DocumentIndex`, and `DocumentChunk`. These belong in a local SQLite database — not in the server's multi-tenant `AppDbContext`, which inherits from `TenantIdentityDbContext` and carries Identity tables, tenant columns, RLS interceptors, and write guards.

This is the forcing function identified in the Desktop App Readiness plan. Rather than stuffing local-only entities into a server context, we execute the split now while the entity set is small and the migration history is short.

---

## Goals

- Extract the shared doc-workflow entity POCOs into `Base2.Data.Contracts` so both contexts can reference them without circular dependencies.
- Create `Base2.Data.Local` with a plain `LocalDbContext` (no Identity, no tenancy) that houses the shared doc entities and the new local-only indexer entities.
- Introduce `IDocumentDbContext` as the narrow interface that `DocumentService` and `ChangesetService` depend on, making both services work in either deployment context.
- Leave the server context (`AppDbContext`) and its migration assemblies (`Base2.Data.Sqlite`, `Base2.Data.Npgsql`) structurally unchanged from the outside.

---

## Out of Scope

- Implementing `Workspace`, `DocumentIndex`, or `DocumentChunk` — that is indexer subsystem work; this plan only creates the project structure and `LocalDbContext` skeleton that the indexer will populate.
- Migrating the desktop host's actual runtime behaviour — that follows once `LocalDbContext` exists.
- `WarehouseDbContext` — not touched.
- Any client-side changes.

---

## Open Concerns

**`.Local` suffix as a misnomer for future service projects**

If domain services (e.g., an indexing service) are introduced in a `Base2.Services.Local` project and later also run on the server via `IDocumentDbContext`, the `.Local` suffix would be misleading — it describes only one of the deployment contexts. At that point, naming by capability (e.g., `Base2.Indexing`) would be more accurate. No action required now, but avoid creating `Base2.Services.Local` without revisiting the name first.

---

## Resulting Project Structure

```
Base2.Data.Contracts  (new)
  └─ Entity POCOs: DocumentReference, Changeset, DocumentChange,
                   ContentUpdate, ElementInsert, ElementDelete
  └─ Enums: ChangesetStatus (+ any doc-domain enums)
  └─ IDocumentDbContext interface
  └─ Ref: Microsoft.EntityFrameworkCore (needed for DbSet<T> + OnModelCreating)

Base2.Data  (modified)
  └─ Removes the six doc entity files (now in Contracts)
  └─ Adds ProjectRef → Base2.Data.Contracts
  └─ AppDbContext implements IDocumentDbContext
  └─ DI forwarding: IDocumentDbContext → AppDbContext
  └─ Mapper/query classes for doc entities STAY here (server-specific)

Base2.Data.Sqlite  (unchanged — still migration assembly for AppDbContext/SQLite)
Base2.Data.Npgsql  (unchanged — still migration assembly for AppDbContext/Npgsql)

Base2.Data.Local  (new)
  └─ LocalDbContext : DbContext, IDocumentDbContext
  └─ DbSets: all six from IDocumentDbContext
  └─ DbSets: Workspaces, DocumentIndexEntries, DocumentChunks  (indexer entities — skeleton only)
  └─ Migrations/ (inline — migration assembly = this project, always SQLite)
  └─ IServiceCollectionExtensions.AddLocalDb(IConfiguration)
  └─ Refs: Base2.Data.Contracts, EF Core SQLite

Base2.Services  (modified)
  └─ DocumentService, ChangesetService → take IDocumentDbContext instead of AppDbContext

Base2.Desktop.Host  (modified)
  └─ Drops ref to Base2.Data.Sqlite
  └─ Adds ref to Base2.Data.Local

Base2.Data.Mock  (modified)
  └─ References Base2.Data.Contracts (for entity types) instead of Base2.Data directly
  └─ (May still reference Base2.Data for server-context mocking; assess during implementation)
```

---

## Step-by-Step Implementation

### Step 1 — Create `Base2.Data.Contracts`

**New project:** `Base2.Data.Contracts\src\Base2.Data.Contracts.csproj`

Package references:
- `Microsoft.EntityFrameworkCore` (core only — no provider)

**Move** the following files from `Base2.Data\src\Docs\` into `Base2.Data.Contracts\src\Docs\`:

| File | Notes |
|---|---|
| `DocumentReference.cs` | |
| `Changeset.cs` | Includes `ChangesetStatus` enum if co-located |
| `DocumentChange.cs` | |
| `ContentUpdate.cs` | |
| `ElementInsert.cs` | |
| `ElementDelete.cs` | |

Namespace stays `Base2.Docs` — no consumer changes required.

**Add** `IDocumentDbContext.cs` to `Base2.Data.Contracts\src\`:

```csharp
namespace Base2.Data;

public interface IDocumentDbContext
{
    DbSet<DocumentReference> DocumentReferences { get; }
    DbSet<Changeset> Changesets { get; }
    DbSet<DocumentChange> DocumentChanges { get; }
    DbSet<ContentUpdate> ContentUpdates { get; }
    DbSet<ElementInsert> ElementInserts { get; }
    DbSet<ElementDelete> ElementDeletes { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

**Add** `GlobalUsings.cs` following the pattern in other projects.

---

### Step 2 — Update `Base2.Data`

1. **Remove** the six moved entity files from `Base2.Data\src\Docs\`.  
   The mapper/query files (`ChangesetMapper`, `ChangesetQuery`, `DocumentReferenceMapper`, `DocumentReferenceQuery`, `DocumentChangeMapper`, `DocumentChangeQuery`) **stay** — they are server-specific and have EF/LINQ dependencies.

2. **Add** `<ProjectReference>` to `Base2.Data.Contracts` in `Base2.Data.csproj`.

3. **Implement the interface on `AppDbContext`:**

```csharp
public class AppDbContext :
    TenantIdentityDbContext<...>,
    IDocumentDbContext   // add this
{
    // DbSet<DocumentReference>, DbSet<Changeset>, etc. already satisfy the interface
}
```

4. **Register the forwarding alias in `IServiceCollectionExtensions.cs`:**

```csharp
// In AddAppDbConfiguration, after AddProviderDbContext<AppDbContext>:
services.AddScoped<IDocumentDbContext>(
    sp => sp.GetRequiredService<AppDbContext>());
```

Both the concrete `AppDbContext` and the `IDocumentDbContext` alias resolve to the same scoped instance — same change tracker, same transaction. This is the standard EF Core DI forwarding pattern.

---

### Step 3 — Create `Base2.Data.Local`

**New project:** `Base2.Data.Local\src\Base2.Data.Local.csproj`

Package references:
- `Microsoft.EntityFrameworkCore.Sqlite`

Project references:
- `Base2.Data.Contracts`

**`LocalDbContext.cs`:**

```csharp
namespace Base2.Data.Local;

public class LocalDbContext : DbContext, IDocumentDbContext
{
    public LocalDbContext(DbContextOptions<LocalDbContext> options)
        : base(options) { }

    // IDocumentDbContext
    public DbSet<DocumentReference> DocumentReferences { get; set; } = null!;
    public DbSet<Changeset> Changesets { get; set; } = null!;
    public DbSet<DocumentChange> DocumentChanges { get; set; } = null!;
    public DbSet<ContentUpdate> ContentUpdates { get; set; } = null!;
    public DbSet<ElementInsert> ElementInserts { get; set; } = null!;
    public DbSet<ElementDelete> ElementDeletes { get; set; } = null!;

    // Local-only (indexer) — skeleton; populated in the indexing subsystem work
    public DbSet<Workspace> Workspaces { get; set; } = null!;
    public DbSet<DocumentIndexEntry> DocumentIndexEntries { get; set; } = null!;
    public DbSet<DocumentChunk> DocumentChunks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.AddSqliteDateTimeOffset();

        // Shared doc entities (call the same static configurators from Contracts)
        DocumentReference.OnModelCreating(modelBuilder);
        Changeset.OnModelCreating(modelBuilder);
        DocumentChange.OnModelCreating(modelBuilder);
        ContentUpdate.OnModelCreating(modelBuilder);
        ElementInsert.OnModelCreating(modelBuilder);
        ElementDelete.OnModelCreating(modelBuilder);

        // Local-only entities (configured here, not in Contracts)
        Workspace.OnModelCreating(modelBuilder);
        DocumentIndexEntry.OnModelCreating(modelBuilder);
        DocumentChunk.OnModelCreating(modelBuilder);

        modelBuilder.Snakeify();
    }
}
```

**Note:** `LocalDbContext` intentionally omits `TenantId` columns, Identity tables, RLS interceptors, and write guards. There is no `#if CLOUD` needed — the entity POCOs in `Contracts` should not carry `TenantId` at all. `TenantId` is a server-context concern applied in `AppDbContext.OnModelCreating` via EF fluent configuration, not on the POCO itself. Verify this during the move in Step 1; if `TenantId` is currently on the POCO, strip it to a server-only fluent configuration.

**Indexer entity stubs** (`Workspace`, `DocumentIndexEntry`, `DocumentChunk`) — add minimal entity classes with only `Id` properties and no-op `OnModelCreating` stubs. Full schema is defined in the indexing subsystem plan and implemented in that work stream.

**`IServiceCollectionExtensions.cs`:**

```csharp
namespace Microsoft.Extensions.DependencyInjection;

public static class LocalDbServiceCollectionExtensions
{
    public static IServiceCollection AddLocalDb(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString("LocalDb")
            ?? "DataSource=product_name-local.db";

        services.AddDbContext<LocalDbContext>(options =>
            options.UseSqlite(
                connectionString,
                o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery)));

        services.AddScoped<IDocumentDbContext>(
            sp => sp.GetRequiredService<LocalDbContext>());

        return services;
    }
}
```

**Migrations:** generate the initial migration after the entities are in place:

```
dotnet ef migrations add InitialCreate \
  --project Base2.Data.Local\src \
  --startup-project Base2.Desktop.Host\src \
  --output-dir Migrations
```

The migration assembly defaults to `Base2.Data.Local` — no separate migrations project needed.

---

### Step 4 — Update `Base2.Services`

In `DocumentService.cs` and `ChangesetService.cs`:

- Change constructor parameter from `AppDbContext` to `IDocumentDbContext`.
- Update the `csproj` to remove `<ProjectReference>` to `Base2.Data` if `AppDbContext` is now the only dependency being removed. Check whether any other types from `Base2.Data` are still needed (mappers, queries); if so, keep the reference.

> This is the key decoupling. After this change, `Base2.Services` has no dependency on `Base2.Data` for the docs workflow — only on `Base2.Data.Contracts`. The server wires `IDocumentDbContext → AppDbContext`; the local/desktop host wires `IDocumentDbContext → LocalDbContext`.

---

### Step 5 — Update `Base2.Desktop.Host`

- Remove `<ProjectReference>` to `Base2.Data.Sqlite`.
- Add `<ProjectReference>` to `Base2.Data.Local`.
- Replace `AddDatabases(configuration)` (or equivalent) with `AddLocalDb(configuration)`.
- Remove any `AppDbContext` registrations in the desktop host's DI setup.

---

### Step 6 — Update `Base2.Data.Mock` and Test Projects

- `Base2.Data.Mock`: evaluate what it mocks. If it mocks `AppDbContext` for test use, consider adding a mock or in-memory implementation of `IDocumentDbContext` here so both server and local tests can share test data setup.
- `Base2.Data.Test`: update project references as needed; no entity logic changes expected.
- `Base2.Services.Test`: if services tests inject `AppDbContext` directly, update to inject `IDocumentDbContext` via a mock or `LocalDbContext` in-memory instance.

---

### Step 7 — Add Projects to `Base2.sln`

```
dotnet sln Base2.sln add Base2.Data.Contracts\src\Base2.Data.Contracts.csproj
dotnet sln Base2.sln add Base2.Data.Local\src\Base2.Data.Local.csproj
```

---

## Key Design Decisions

### `TenantId` on entity POCOs

The entity POCOs in `Contracts` must be free of `TenantId` — that is a server-context concern. If `TenantId` is currently a property on any of the moved entities (likely on `DocumentReference`, possibly others), strip it from the POCO and apply it in `AppDbContext.OnModelCreating` via fluent configuration only:

```csharp
// In AppDbContext.OnModelCreating — server only
modelBuilder.Entity<DocumentReference>()
    .Property<Guid>("TenantId");
```

The `LocalDbContext` simply doesn't add this configuration, so `tenant_id` never appears in the local schema.

### Namespace stays `Base2.Docs`

The doc entity namespace stays `Base2.Docs` even though the assembly is `Base2.Data.Contracts`. This eliminates churn across every consumer (`Base2.Services`, `Base2.Web`, `Base2.Docs`, etc.) that currently imports `using Base2.Docs;`.

### Mapper/query classes stay in `Base2.Data`

`ChangesetMapper`, `ChangesetQuery`, `DocumentReferenceMapper`, etc. have EF Core `IQueryable<T>` extensions that are specific to the server context's query patterns (e.g., tenant-filtered queries). They stay in `Base2.Data`. The local context will grow its own lean query helpers in `Base2.Data.Local` as needed.

### `IDocumentDbContext` belongs in `Base2.Data.Contracts`, not `Base2.Contracts`

`Base2.Contracts` holds HTTP API DTOs and service interfaces. `IDocumentDbContext` is a data layer abstraction — it belongs alongside the entities it exposes.

---

## Migration Notes

After Step 1–3, two independent migration histories exist:

| Context | Migration assembly | Provider | Used by |
|---|---|---|---|
| `AppDbContext` | `Base2.Data.Sqlite` | SQLite | Web app dev mode |
| `AppDbContext` | `Base2.Data.Npgsql` | PostgreSQL | Web app production |
| `LocalDbContext` | `Base2.Data.Local` | SQLite only | Desktop host, local dev |

The `LocalDbContext` initial migration captures only the subset of tables it needs — no Identity tables, no tenant columns, no business/access entities.

---

## Checklist

- [ ] `Base2.Data.Contracts` project created and added to solution
- [ ] Six doc entity files moved; namespace unchanged (`Base2.Docs`)
- [ ] `TenantId` stripped from entity POCOs; applied via fluent config in `AppDbContext`
- [ ] `IDocumentDbContext` added to `Base2.Data.Contracts`
- [ ] `AppDbContext` implements `IDocumentDbContext`
- [ ] `IDocumentDbContext` forwarding registration added in `AddAppDbConfiguration`
- [ ] `Base2.Data.Local` project created and added to solution
- [ ] `LocalDbContext` created with shared + local-only DbSets
- [ ] Indexer entity stubs (`Workspace`, `DocumentIndexEntry`, `DocumentChunk`) added
- [ ] `AddLocalDb` DI extension added
- [ ] Initial `LocalDbContext` migration generated
- [ ] `DocumentService` and `ChangesetService` updated to take `IDocumentDbContext`
- [ ] `Base2.Desktop.Host` updated to use `Base2.Data.Local`
- [ ] `Base2.Data.Mock` / test projects updated
- [ ] Solution builds cleanly; all tests pass
