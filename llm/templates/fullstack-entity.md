# Template: Fullstack Entity

## Purpose

Workflow for adding a new entity end-to-end to an existing feature: server entity (Model, Query, Mapper, Service, Controller) followed by client entity (API, Service, Components).

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see server-entity/client-entity for patterns"
> - Do NOT shorten to "save space" - fullstack workflows ARE large by design
> - Each workflow must contain ALL code examples inline for BOTH server AND client
> - The implementing model should need ONLY this document
> - Fully expand both server and client sections (NO REFERENCES to other workflows)

## Assembly Instructions

### Part 1: Server (from server-entity template)

Include full content for creating a new entity:

1. `modules/patterns/server/model-troika.md` (full)
2. `modules/patterns/server/queries.md` (full)
3. `modules/patterns/server/mappers.md` (full)
4. `modules/patterns/server/services.md` (full or section for adding to existing)
5. `modules/patterns/server/controllers.md` (full or section for adding to existing)
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

### Part 2: Client (from client-entity template)

Include full content for creating client entity support:

1. `modules/patterns/client/localization.md` (section: Adding to Existing Feature)
2. `modules/patterns/client/components.md` (full for new entity)
3. `modules/patterns/client/routing.md` (section: Adding Routes)
4. `modules/patterns/client/testing.md` (full)

### Integration Section (unique to fullstack)

```markdown
---

## Part 3: Integration

### End-to-End Testing

1. **Start both servers** (if not running)
2. **Navigate to new entity page**: `/{feature}/{entity}`
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
   - User stories, Feature PRD
   - GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:

**Server:**
1. Existing namespace (Access, Business, Prospecting, etc.)
2. Database (same as existing feature)
3. New entity name (singular, PascalCase)
4. Service/Controller approach (new or extend existing)

**Client:**
5. Existing feature namespace (should match server)
6. Service approach (new or extend existing)
```

#### File Structure Overview
```markdown
**Server** - New entity `{Entity}` in namespace `{Namespace}`:

Contracts/src/{Namespace}/{Entity}Model.cs
Data/src/{Namespace}/{Entity}.cs
Data/src/{Namespace}/{Entity}Query.cs
Data/src/{Namespace}/{Entity}Mapper.cs
Services/src/{Namespace}/{Entity}Service.cs
Web/src/Controllers/{Namespace}/{Entity}Controller.cs

**Client** - New entity `{entity}` in feature `{feature}`:

features/{feature}/api/{entity}Api.ts
features/{feature}/components/{entity}/{Entity}List.tsx
features/{feature}/components/{entity}/{Entity}Form.tsx
features/{feature}/services/I{Entity}Service.ts
features/{feature}/services/{Entity}Service.ts
features/{feature}/views/{Entity}Page.tsx
features/{feature}/locales/*.jsonc  (update all 5)
```

#### Checklist (end of document)
```markdown
## Full Checklist

### Server
- [ ] Model and Entity created
- [ ] DbSet and configuration added to DbContext
- [ ] Query class created
- [ ] Mapper created
- [ ] Service created (or methods added to existing)
- [ ] Service registered in DI (if new)
- [ ] Controller created (or endpoints added to existing)
- [ ] RLS policy registered
- [ ] Migration created
- [ ] Server tests written

### Client
- [ ] API client created
- [ ] Service created (or methods added to existing)
- [ ] Service registered in DI (if new)
- [ ] New keys added to all 5 locale files
- [ ] Components created
- [ ] Views/pages created
- [ ] Routes added
- [ ] Client tests written

### Integration
- [ ] End-to-end flow tested
- [ ] Error handling verified
- [ ] Loading states verified

### Tracking
- [ ] User stories updated in PRD
- [ ] Feature PRD updated (if exists)
- [ ] GitHub issues updated/closed
```

## Target Output

- **Length**: 4000-5000 tokens
- **Format**: Single comprehensive markdown
- **Output**: `workflows/fullstack-entity.md`

## Generation Notes

When generating this workflow:
1. Fully expand both server and client sections (no references)
2. Include integration section between them
3. Emphasize that this adds to an EXISTING feature/namespace
4. Include guidance on whether to create new or extend existing services/controllers

## Backlinks for Deep Dives

### Server
- [Server Architecture Patterns](../patterns/server/server-architecture-patterns.md)
- [RLS Patterns](../patterns/server/rls-patterns.md)
- [Mapper Patterns](../patterns/server/mapper-patterns.md)

### Client
- [Client Feature Template](../patterns/client/client-feature-template.md)
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md)
- [API Client Pattern](../patterns/client/api-client-pattern.md)
