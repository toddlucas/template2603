# Template: Server Feature

## Purpose

Complete workflow for building a new server-side feature with CRUD operations, RLS, and testing.

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

4. `modules/patterns/server/services.md` (full)
   - Service class structure
   - CRUD operations
   - Setting TenantId and timestamps
   - DI registration

5. `modules/patterns/server/localization.md` (full)
   - When to localize vs not localize
   - Injecting IStringLocalizer
   - Using localizer for exception messages
   - Marker class reference

6. `modules/patterns/server/metrics.md` (full)
   - Injecting IObservabilityMetrics
   - Recording metrics in services
   - Timing operations
   - Adding new metrics

7. `modules/patterns/server/controllers.md` (full)
   - Controller class structure
   - RLS attributes usage
   - Standard CRUD endpoints

8. `modules/patterns/server/rls.md` (essentials only)
   - Entity requirements (TenantId)
   - Service responsibilities
   - Controller attribute usage
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
- After mappers: "The service layer orchestrates business logic and uses these mappers."
- After services: "Add localization support for user-facing messages in the service."
- After localization: "Add metrics to track operations and provide observability."
- After metrics: "Controllers expose the service operations via HTTP endpoints."
- After controllers: "Finally, ensure RLS is properly configured for multi-tenancy."
- After rls: "Write tests to verify the implementation."
- Before post-implementation: "After implementation, update tracking documents."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting, determine:
1. **Namespace**: Which feature area? (Access, Business, Prospecting, etc.)
2. **Database**: App (OLTP) or Warehouse (OLTP)?
3. **Entity name**: Singular, PascalCase (e.g., `Contact`, `Sequence`)
```

#### File Structure Overview
```markdown
For a feature called `{Entity}` in the `{Namespace}` namespace:

Base2.Contracts/src/{Namespace}/
├── {Entity}Model.cs

Base2.Data/src/{Namespace}/
├── {Entity}.cs
├── {Entity}Query.cs
├── {Entity}Mapper.cs

Base2.Services/src/{Namespace}/
├── {Entity}Service.cs

Base2.Web/src/Controllers/{Namespace}/
├── {Entity}Controller.cs
```

#### Checklist (end of document)
```markdown
### Files Created
- [ ] `Contracts/src/{Namespace}/{Entity}Model.cs`
- [ ] `Data/src/{Namespace}/{Entity}.cs`
- [ ] `Data/src/{Namespace}/{Entity}Query.cs`
- [ ] `Data/src/{Namespace}/{Entity}Mapper.cs`
- [ ] `Services/src/{Namespace}/{Entity}Service.cs`
- [ ] `Web/src/Controllers/{Namespace}/{Entity}Controller.cs`

### Configuration
- [ ] DbSet registered in DbContext
- [ ] Entity configuration in OnModelCreating
- [ ] Service registered in DI
- [ ] RLS policy added (TablesWithTenantOnly)
- [ ] Migration created

### Localization
- [ ] IStringLocalizer injected in service (if user-facing messages)
- [ ] Marker class exists for namespace
- [ ] Exception messages use _localizer["..."]
- [ ] Log messages remain in English

### Observability
- [ ] Metrics injected in service
- [ ] Success metrics recorded
- [ ] Failure metrics recorded in catch blocks
- [ ] Metric tests added (if new metrics created)

### Testing
- [ ] Service unit tests written
- [ ] Controller integration tests written

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated (if significant)
- [ ] GitHub issues updated/closed
```

## Target Output

- **Length**: 2500-3500 tokens
- **Format**: Single markdown with code examples
- **Output**: `workflows/server-feature.md`

## Backlinks for Deep Dives

- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md) - Full RLS documentation
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
- [Database Testing Pattern](../patterns/server/database-testing-pattern.md)
