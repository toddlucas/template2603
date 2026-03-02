# Template: Server Entity

## Purpose

Workflow for adding a new entity (Model, Entity, Query, Mapper, Service, Controller) to an existing server namespace/feature.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see other workflow for patterns"
> - Do NOT shorten to "save space" - target token lengths are intentional
> - Each workflow must contain ALL code examples inline
> - The implementing model should need ONLY this document

## Assembly Instructions

### Include (in order):

1. `modules/patterns/server/model-troika.md` (full)
   - Model class in Contracts
   - Entity class in Data
   - DbContext registration

2. `modules/patterns/server/queries.md` (full)
   - Query class in Data
   - Standard query methods
   - Find by field patterns

3. `modules/patterns/server/mappers.md` (full)
   - ToModel, ToDetailModel mappings
   - ToRecord, UpdateFrom mappings
   - Private mappers for related entities

4. `modules/patterns/server/services.md` (section: Adding to Existing Service OR full for new Service)
   - Service methods for the new entity
   - Can be added to existing feature service or new service class

5. `modules/patterns/server/localization.md` (full)
   - When to localize vs not localize
   - Injecting IStringLocalizer
   - Using localizer for exception messages
   - Marker class reference

6. `modules/patterns/server/metrics.md` (full)
   - Injecting IObservabilityMetrics
   - Recording metrics in services
   - Timing operations

7. `modules/patterns/server/controllers.md` (section: Adding Endpoints OR full for new Controller)
   - Controller endpoints for the new entity
   - Can be added to existing feature controller or new controller class

8. `modules/patterns/server/rls.md` (essentials only)
   - Entity requirements (TenantId)
   - Table registration

9. `modules/patterns/server/testing.md` (full)
   - Service unit test patterns
   - Controller integration test patterns
   - What to test checklist

10. `modules/howto/update-tracking-docs.md` (full)
   - User stories, Feature PRD, Current state
   - GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Add Transitions:

- After model-troika: "With the data model in place, create the query class to encapsulate data access."
- After queries: "Now we need mappers to convert between entity and model layers."
- After mappers: "Add service methods to orchestrate business logic."
- After services: "Add localization support for user-facing messages in the service."
- After localization: "Add metrics to track the new entity operations."
- After metrics: "Expose the new entity operations via controller endpoints."
- After controllers: "Ensure RLS is properly configured for the new entity."
- After rls: "Write tests to verify the implementation."
- Before post-implementation: "After implementation, update tracking documents."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:
1. **Existing namespace**: Which feature area? (Access, Business, Prospecting, etc.)
2. **Database**: Same as existing feature (App or Warehouse)
3. **New entity name**: Singular, PascalCase (e.g., `Sequence`, `Step`)
4. **Service approach**: Add to existing service or create new service class?
5. **Controller approach**: Add to existing controller or create new controller class?
```

#### Decision Tree
```markdown
Service/Controller Organization:

├─ Entity is core to feature (e.g., Sequence in Prospecting)
│  └─ Create new {Entity}Service and {Entity}Controller
│
├─ Entity is supporting/child (e.g., SequenceStep)
│  └─ Add methods to existing parent service/controller
│     OR create new service/controller (your choice)
│
└─ Unsure?
    └─ Prefer separate service/controller for clarity
```

#### File Structure Overview
```markdown
For a new entity `{Entity}` in existing namespace `{Namespace}`:

Base2.Contracts/src/{Namespace}/
├── {Entity}Model.cs              # NEW

Base2.Data/src/{Namespace}/
├── {Entity}.cs                   # NEW
├── {Entity}Query.cs              # NEW
├── {Entity}Mapper.cs             # NEW

Base2.Services/src/{Namespace}/
├── {Entity}Service.cs            # NEW (or add to existing)

Base2.Web/src/Controllers/{Namespace}/
├── {Entity}Controller.cs         # NEW (or add to existing)
```

#### Checklist (end of document)
```markdown
### Files Created
- [ ] `Contracts/src/{Namespace}/{Entity}Model.cs`
- [ ] `Data/src/{Namespace}/{Entity}.cs`
- [ ] `Data/src/{Namespace}/{Entity}Query.cs`
- [ ] `Data/src/{Namespace}/{Entity}Mapper.cs`
- [ ] `Services/src/{Namespace}/{Entity}Service.cs` (or updated existing)
- [ ] `Web/src/Controllers/{Namespace}/{Entity}Controller.cs` (or updated existing)

### Configuration
- [ ] DbSet registered in DbContext
- [ ] Entity configuration in OnModelCreating
- [ ] Service registered in DI (if new service)
- [ ] RLS policy added (TablesWithTenantOnly)
- [ ] Migration created

### Localization
- [ ] IStringLocalizer injected in service (if user-facing messages)
- [ ] Marker class exists for namespace
- [ ] Exception messages use _localizer["..."]
- [ ] Log messages remain in English

### Testing
- [ ] Service unit tests written
- [ ] Controller integration tests written

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] GitHub issues updated/closed
```

## Target Output

- **Length**: 2000-3000 tokens
- **Format**: Single markdown with code examples
- **Output**: `workflows/server-entity.md`

## Backlinks for Deep Dives

- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md) - Full RLS documentation
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md)
