# Template: Client Entity

## Purpose

Workflow for adding a new entity (API client, service, components, views, translations) to an existing client feature.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see other workflow for patterns"
> - Do NOT shorten to "save space" - target token lengths are intentional
> - Each workflow must contain ALL code examples inline
> - The implementing model should need ONLY this document

## Assembly Instructions

### Include (in order):

1. `modules/patterns/client/localization.md` (section: Adding to Existing Feature)
   - Adding keys for new entity to existing locale files
   - Using useTranslation with feature namespace

2. `modules/patterns/client/components.md` (full for new entity)
   - API client creation for new entity
   - Service layer for new entity
   - DI registration
   - Component patterns

3. `modules/patterns/client/routing.md` (section: Adding Routes)
   - Route registration for new entity pages
   - Sidebar navigation (if needed)

4. `modules/patterns/client/testing.md` (full)
   - Component test patterns
   - Service test patterns
   - i18n testing

5. `modules/howto/update-tracking-docs.md` (full)
   - User stories, Feature PRD
   - GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Add Transitions:

- After localization: "With translations ready, build the API client and service."
- After components: "Wire up routing for the new entity pages."
- After routing: "Write tests to verify the implementation."
- Before post-implementation: "Update tracking documents to reflect completion."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting:
1. **Existing feature**: Which namespace? (prospecting, orchestration, etc.)
2. **Server API**: Are the backend endpoints ready for the new entity?
3. **New entity name**: Should match server entity name
4. **Service approach**: Add to existing service or create new service class?
```

#### Decision Tree
```markdown
Service Organization:

├─ Entity has distinct CRUD operations
│  └─ Create new {Entity}Api and {Entity}Service
│
├─ Entity operations are part of parent workflow
│  └─ Add methods to existing parent service
│
└─ Unsure?
    └─ Prefer separate API client and service for clarity
```

#### File Structure Overview
```markdown
For a new entity `{entity}` in existing feature `{feature}`:

client/{app}/src/features/{feature}/
├── api/
│   └── {entity}Api.ts              # NEW
├── components/
│   └── {entity}/                   # NEW directory
│       ├── {Entity}List.tsx
│       └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts         # NEW
│   └── {Entity}Service.ts          # NEW
├── views/
│   └── {Entity}Page.tsx            # NEW
├── locales/
│   ├── de.jsonc                    # UPDATE (add new keys)
│   ├── el.jsonc                    # UPDATE
│   ├── en.jsonc                    # UPDATE
│   ├── es.jsonc                    # UPDATE
│   └── fr.jsonc                    # UPDATE
└── index.ts                        # UPDATE (export new entity)
```

#### Checklist (end of document)
```markdown
### API & Service
- [ ] Created API client for new entity
- [ ] Created service interface and implementation
- [ ] Registered service in DI container

### Localization
- [ ] Added new entity keys to all 5 locale files
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

### Components & Routing
- [ ] Created components directory for new entity
- [ ] Created list/form/detail components as needed
- [ ] Created main page for entity
- [ ] Added routes for new pages
- [ ] Added sidebar navigation (if user-facing)

### Testing
- [ ] Component tests written
- [ ] Service tests written
- [ ] i18n tested with different locales

### Tracking
- [ ] User stories updated
- [ ] Feature PRD updated (if exists)
- [ ] GitHub issues updated
```

## Target Output

- **Length**: 2000-2500 tokens
- **Format**: Single markdown with code examples
- **Output**: `workflows/client-entity.md`

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
- [API Client Pattern](../patterns/client/api-client-pattern.md) - Result type handling
- [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md) - Complex state
