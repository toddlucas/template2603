# Template: Fullstack Feature

## Purpose

Complete workflow for building a feature end-to-end: server API followed by client UI.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see server-feature/client-feature for patterns"
> - Do NOT shorten to "save space" - fullstack workflows ARE large by design
> - Each workflow must contain ALL code examples inline for BOTH server AND client
> - The implementing model should need ONLY this document
> - Fully expand both server and client sections (NO REFERENCES to other workflows)

## Assembly Instructions

### Part 1: Server (from server-feature template)

Include fully unwound content from `workflows/server-feature.md`:

1. `modules/patterns/server/model-troika.md` (full)
2. `modules/patterns/server/queries.md` (full)
3. `modules/patterns/server/mappers.md` (full)
4. `modules/patterns/server/services.md` (full)
5. `modules/patterns/server/controllers.md` (full)
6. `modules/patterns/server/rls.md` (essentials only)
7. `modules/patterns/server/testing.md` (full)

### Transition to Client

```markdown
---

## Part 2: Client

With the server API complete and tested, build the client to consume it.

**Verify before proceeding:**
- [ ] Server endpoints return expected data
- [ ] Swagger/OpenAPI shows correct schemas
- [ ] TypeScript types generated (if using TypeGen)
```

### Part 2: Client (from client-feature template)

Include fully unwound content from `workflows/client-feature.md`:

1. `modules/patterns/client/feature-structure.md` (full)
2. `modules/patterns/client/localization.md` (section: New Feature Setup)
3. `modules/patterns/client/components.md` (full)
4. `modules/patterns/client/routing.md` (full)
5. `modules/patterns/client/testing.md` (full)

### Integration Section (unique to fullstack)

```markdown
---

## Part 3: Integration

### End-to-End Testing

1. **Start both servers** (if not running)
2. **Navigate to test page**: `/test/{feature}`
3. **Verify operations**:
   - [ ] List loads data from API
   - [ ] Create adds new record
   - [ ] Update modifies existing record
   - [ ] Delete removes record
   - [ ] Error states display correctly
   - [ ] Loading states display correctly

### Common Integration Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| 401 Unauthorized | Missing/invalid token | Check auth setup, token refresh |
| 404 Not Found | Wrong API path | Verify route in controller vs client |
| CORS error | Server CORS config | Add origin to allowed list |
| Type mismatch | Stale TypeScript types | Regenerate with update-models.cmd |
| Empty response | RLS filtering | Verify TenantId matches |
```

### Post-Implementation (shared)

Include:
1. `modules/howto/update-tracking-docs.md` (full)
   - User stories, Feature PRD, Current state
   - GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting, determine:

**Server:**
1. Namespace (Access, Business, Prospecting, etc.)
2. Database (App or Warehouse)
3. Entity name (singular, PascalCase)

**Client:**
4. Which app (web, admin, common)
5. Feature namespace (should match server)
```

#### Checklist (end of document)
```markdown
## Full Checklist

### Server
- [ ] Model, Entity, Query created
- [ ] Mapper created
- [ ] Service created and registered in DI
- [ ] Controller created with RLS attributes
- [ ] RLS policy registered
- [ ] Migration created
- [ ] Server tests written

### Client
- [ ] Directory structure created
- [ ] API client created
- [ ] Service created and registered in DI
- [ ] All 5 locale files created
- [ ] Locales registered in features/locales.ts
- [ ] Components created
- [ ] Routes added
- [ ] Client tests written

### Integration
- [ ] End-to-end flow tested
- [ ] Error handling verified
- [ ] Loading states verified

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated
- [ ] GitHub issues updated/closed
```

## Target Output

- **Length**: 5000-6000 tokens
- **Format**: Single comprehensive markdown
- **Output**: `workflows/fullstack-feature.md`

## Generation Notes

When generating this workflow:
1. Fully expand both server and client sections (no references)
2. Include integration section between them
3. Merge checklists into single comprehensive checklist
4. Include all code examples from both templates

## Backlinks for Deep Dives

### Server
- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md)
- [Mapper Patterns](../patterns/server/mapper-patterns.md)

### Client
- [Client Feature Template](../patterns/client/client-feature-template.md)
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
- [API Client Pattern](../patterns/client/api-client-pattern.md)
