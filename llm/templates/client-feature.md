# Template: Client Feature

## Purpose

Complete workflow for building a new client-side feature with API client, services, components, i18n, and routing.

## Generation Rules

> ⚠️ **CRITICAL**: Generate COMPLETE, STANDALONE workflows.
> - Do NOT elide sections or say "see other workflow for patterns"
> - Do NOT shorten to "save space" - target token lengths are intentional
> - Each workflow must contain ALL code examples inline
> - The implementing model should need ONLY this document

## Assembly Instructions

### Include (in order):

1. `modules/patterns/client/feature-structure.md` (full)
   - Directory structure
   - File organization
   - Which app (web, admin, common)

2. `modules/patterns/client/localization.md` (section: New Feature Setup)
   - Creating all 5 language files
   - Locale index file
   - Registering in features/locales.ts

3. `modules/patterns/client/components.md` (full)
   - API client creation
   - Service layer
   - DI registration
   - Component patterns

4. `modules/patterns/client/routing.md` (full)
   - Route registration
   - Sidebar navigation
   - Dashboard integration

5. `modules/patterns/client/testing.md` (full)
   - Component test patterns
   - Service test patterns
   - i18n testing

6. `modules/howto/update-tracking-docs.md` (full)
   - User stories, Feature PRD, Current state
   - GitHub issues

### Preserve Notes:

> **Important:** Copy all `> **Note:**` blocks from modules directly into the workflow output. These are instructions for the implementing model.

### Add Transitions:

- After feature-structure: "With the structure in place, set up localization for the feature."
- After localization: "Now build the API client, services, and components."
- After components: "Finally, wire up routing and navigation."
- After routing: "Write tests to verify the implementation."
- Before post-implementation: "Update tracking documents to reflect completion."

### Inline Workflow-Specific Content:

#### Prerequisites Section
```markdown
Before starting, determine:
1. **Feature namespace**: Should match server namespace (e.g., `prospecting`)
2. **Which app**: web (user-facing), admin (internal), or common (shared)
3. **Server API**: Is the backend ready? (Recommended: build server first)
```

#### File Structure Overview
```markdown
client/{app}/src/features/{feature}/
├── api/
│   └── {entity}Api.ts
├── components/
│   └── {entity}/
│       ├── {Entity}List.tsx
│       └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts
│   └── {Entity}Service.ts
├── views/
│   ├── {Entity}Page.tsx
│   └── {Feature}TestPage.tsx
├── locales/
│   ├── de.jsonc
│   ├── el.jsonc
│   ├── en.jsonc
│   ├── es.jsonc
│   ├── fr.jsonc
│   └── index.ts
└── index.ts
```

#### Checklist (end of document)
```markdown
### Structure
- [ ] Created directory structure
- [ ] Created API client
- [ ] Created service interface and implementation
- [ ] Registered service in DI

### Localization
- [ ] Created all 5 locale files (de, el, en, es, fr)
- [ ] Created locale index
- [ ] Registered in features/locales.ts
- [ ] Ran duplicate checker

### Components & Routing
- [ ] Created components with useTranslation
- [ ] Created main page and test page
- [ ] Added routes
- [ ] Added sidebar navigation (if user-facing)

### Testing
- [ ] Component tests written
- [ ] Service tests written
- [ ] i18n tested with different locales

### Tracking
- [ ] User stories updated
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated (if significant)
- [ ] GitHub issues updated
```

## Target Output

- **Length**: 2500-3500 tokens
- **Format**: Single markdown with code examples
- **Output**: `workflows/client-feature.md`

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
- [API Client Pattern](../patterns/client/api-client-pattern.md) - Result type handling
- [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md) - Complex state
