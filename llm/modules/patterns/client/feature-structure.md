# Client Feature Structure

> **Module**: Patterns / Client  
> **Domain**: Project organization  
> **Token target**: 200-300

## Purpose

Defines directory structure and file organization for new client features.

## Content to Include

### Directory Structure

```
client/{app}/src/features/{feature}/
├── api/
│   └── {entity}Api.ts           # API client
├── components/
│   └── {entity}/                # Entity-specific components
│       ├── {Entity}List.tsx
│       └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts      # Interface
│   └── {Entity}Service.ts       # Implementation
├── stores/
│   └── {entity}Store.ts         # Zustand store (if needed)
├── views/
│   ├── {Entity}Page.tsx         # Main page
│   └── {Feature}TestPage.tsx    # Development test page
├── locales/
│   ├── de.jsonc                 # German
│   ├── el.jsonc                 # Greek
│   ├── en.jsonc                 # English (primary)
│   ├── es.jsonc                 # Spanish
│   ├── fr.jsonc                 # French
│   └── index.ts                 # Locale exports
└── index.ts                     # Feature exports
```

### Which App?

| App | Use For | Location |
|-----|---------|----------|
| `web` | User-facing features | `client/web/src/features/` |
| `admin` | Internal/administrative | `client/admin/src/features/` |
| `common` | Shared components | `client/common/src/features/` |

### Feature Naming

Feature names should match server namespaces:

| Server Namespace | Client Feature | Contains |
|------------------|----------------|----------|
| `Prospecting` | `prospecting/` | Contacts, Sequences |
| `Orchestration` | `orchestration/` | Workflows |
| `Access` | `access/` | Organizations |

### Create Command

```bash
mkdir -p client/{app}/src/features/{feature}/{api,components/{entity},services,views,locales}
```

## Backlink

- [Client Feature Template](../../../patterns/client/client-feature-template.md) - Full setup walkthrough

