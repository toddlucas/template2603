# Template: Server Modification

## Purpose

Workflow for modifying an existing server entity—adding fields, operations, or endpoints to an existing Model/Entity.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see other workflow for patterns"
> - Do NOT shorten to "save space" - target token lengths are intentional
> - Each workflow must contain ALL code examples inline
> - The implementing model should need ONLY this document

## Assembly Instructions

### Include (in order):

1. `modules/patterns/server/model-troika.md` (section: Adding Fields)
   - Adding properties to Model
   - Adding properties to Entity

2. `modules/patterns/server/queries.md` (section: Adding Query Methods)
   - Adding new query methods

3. `modules/patterns/server/mappers.md` (section: Updating Mappers)
   - Adding ignore attributes for new fields
   - Updating UpdateFrom method

4. `modules/patterns/server/services.md` (section: Adding Operations)
   - Adding new service methods
   - Following existing patterns

5. `modules/patterns/server/localization.md` (section: Using Localizer)
   - Adding localized messages for new operations
   - Using existing marker class for namespace

6. `modules/patterns/server/metrics.md` (section: Recording Metrics)
   - Recording metrics for new operations
   - Adding new metrics if needed

7. `modules/patterns/server/controllers.md` (section: Adding Endpoints)
   - Adding new controller actions
   - Appropriate RLS attributes

8. `modules/patterns/server/testing.md` (section: What to Test)
   - Update existing tests for new functionality

9. `modules/howto/update-tracking-docs.md` (section: Modification updates)
   - User stories, GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Add Transitions:

- After model changes: "Add query methods if new data access patterns are needed."
- After query changes: "Update mappers to handle any new fields."
- After mapper changes: "Add service methods to expose the new functionality."
- After service changes: "Add localized messages for any new user-facing errors or validations."
- After localization changes: "Add or update metrics for the new operations."
- After metrics changes: "Finally, expose via controller endpoints."
- After controller changes: "Update tests for the new functionality."
- Before post-implementation: "Update tracking documents to reflect the changes."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:
1. **Identify the existing feature**: Which namespace and entity?
2. **Understand the change**: New field? New operation? New endpoint?
3. **Review existing code**: Understand current patterns in use
```

#### Decision Tree
```markdown
What are you modifying?

├─ New field on existing entity
│  └─ Update: Model → Entity → Mapper (ignore or map) → Migration
│
├─ New query method
│  └─ Update: Query class → Service method → Controller endpoint
│
├─ New operation (complex logic)
│  └─ Update: Service method → Controller endpoint
│
├─ New entity in existing namespace
│  └─ Use server-entity workflow instead
│
└─ New feature/namespace
    └─ Use server-feature workflow instead
```

#### Checklist (end of document)
```markdown
### For New Fields
- [ ] Added to Model (if API-exposed)
- [ ] Added to Entity
- [ ] Updated DbContext configuration
- [ ] Updated mapper ignores/mappings
- [ ] Updated UpdateFrom method
- [ ] Created migration
- [ ] Updated tests

### For New Operations
- [ ] Added query method (if needed)
- [ ] Added service method
- [ ] Added localized messages (if user-facing errors)
- [ ] Added controller endpoint
- [ ] Added appropriate RLS attribute
- [ ] Added tests

### Tracking
- [ ] User stories updated
- [ ] GitHub issues updated
```

## Target Output

- **Length**: 1500-2000 tokens
- **Format**: Single markdown, focused on delta changes
- **Output**: `workflows/server-modification.md`

## Backlinks for Deep Dives

- [Server Feature Template](../patterns/server/server-feature-template.md) - Full feature reference
- [Mapper Patterns](../patterns/server/mapper-patterns.md) - Complex mapping scenarios
