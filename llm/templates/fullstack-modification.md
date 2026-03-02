# Template: Fullstack Modification

## Purpose

Workflow for modifying an existing feature end-to-end: server changes to existing entities followed by corresponding client changes.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see server-modification/client-modification for patterns"
> - Do NOT shorten to "save space" - fullstack workflows ARE large by design
> - Each workflow must contain ALL code examples inline for BOTH server AND client
> - The implementing model should need ONLY this document
> - Fully expand both server and client sections (NO REFERENCES to other workflows)

## Assembly Instructions

### Part 1: Server (from server-modification template)

Include content for modifying existing entities:

1. `modules/patterns/server/model-troika.md` (section: Adding Fields)
2. `modules/patterns/server/queries.md` (section: Adding Query Methods)
3. `modules/patterns/server/mappers.md` (section: Updating Mappers)
4. `modules/patterns/server/services.md` (section: Adding Operations)
5. `modules/patterns/server/controllers.md` (section: Adding Endpoints)
6. `modules/patterns/server/testing.md` (section: What to Test)

### Transition to Client

```markdown
---

## Part 2: Client

With the server changes complete and tested, update the client to use them.

**Verify before proceeding:**
- [ ] New/updated endpoints return expected data
- [ ] Swagger/OpenAPI shows correct schemas
- [ ] TypeScript types regenerated (if using TypeGen)
```

### Part 2: Client (from client-modification template)

Include content for updating existing components:

1. `modules/patterns/client/localization.md` (section: Adding to Existing Feature)
2. `modules/patterns/client/components.md` (section: Adding Components)
3. `modules/patterns/client/testing.md` (section: What to Test)

### Integration Section (unique to fullstack)

```markdown
---

## Part 3: Integration

### Verify Changes Work End-to-End

1. **Test the updated functionality**:
   - [ ] New fields display correctly
   - [ ] New operations work as expected
   - [ ] Error handling works
   - [ ] Loading states display

### Common Integration Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Type mismatch | Stale TypeScript types | Regenerate with update-models.cmd |
| Missing field | Not mapped in API response | Check mapper ignores |
| 404 on new endpoint | Route not registered | Check controller route |
| Translation missing | Key not in locale file | Add to all 5 locale files |
```

### Post-Implementation (shared)

Include:
1. `modules/howto/update-tracking-docs.md` (section: Modification updates)
   - User stories, GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:

**Server:**
1. Identify existing feature namespace and entity
2. Understand what's being modified (field, operation, endpoint)
3. Review existing code patterns

**Client:**
4. Check if translations exist for new UI text
5. Review existing component patterns in the feature
```

#### Decision Tree
```markdown
What are you modifying?

├─ New field (server + client display)
│  └─ Server: Model → Entity → Mapper → Migration
│  └─ Client: Translations → Component update
│
├─ New operation (server + client action)
│  └─ Server: Query → Service → Controller
│  └─ Client: API client → Service → Component
│
├─ New entity in existing feature
│  └─ Use fullstack-entity workflow instead
│
├─ Client-only change (display/UX)
│  └─ Use client-modification workflow only
│
└─ New feature
    └─ Use fullstack-feature workflow instead
```

#### Checklist (end of document)
```markdown
## Full Checklist

### Server Changes
- [ ] Updated Model (if field is API-exposed)
- [ ] Updated Entity (if new field/property)
- [ ] Updated DbContext configuration
- [ ] Updated Mapper (ignores/mappings)
- [ ] Updated UpdateFrom method
- [ ] Updated Service (new methods)
- [ ] Updated Controller (new endpoints)
- [ ] Created migration (if schema changed)
- [ ] Updated tests

### Client Changes
- [ ] Checked for existing translation keys
- [ ] Added new keys to all 5 locale files
- [ ] Updated/created components
- [ ] Ran duplicate checker

### Integration
- [ ] TypeScript types regenerated (if needed)
- [ ] End-to-end flow tested
- [ ] Error handling verified

### Tracking
- [ ] User stories updated in PRD
- [ ] GitHub issues updated/closed
```

## Target Output

- **Length**: 2500-4000 tokens
- **Format**: Single comprehensive markdown
- **Output**: `workflows/fullstack-modification.md`

## Generation Notes

When generating this workflow:
1. Fully expand both server and client sections (no references)
2. Include integration section between them
3. Focus on delta changes, not full feature setup
4. Include common pitfalls for modification work

## Backlinks for Deep Dives

### Server
- [Server Feature Template](../patterns/server/server-feature-template.md)
- [Mapper Patterns](../patterns/server/mapper-patterns.md)

### Client
- [Client Feature Template](../patterns/client/client-feature-template.md)
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
