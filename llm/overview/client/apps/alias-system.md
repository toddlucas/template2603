# Path Alias System

The web client uses a three-tier path alias system for clean, consistent imports.

## Quick Reference

| Alias | Resolves To | Use For | Examples |
|-------|-------------|---------|----------|
| `$` | `common/src` | Shared between web & admin | `$/components/ui/button`, `$/features/auth` |
| `@` | `web/src` | Web infrastructure | `@/layouts/FrameLayout`, `@/routes/AppRegistry` |
| `#app` | `web/src/apps/{app}` | App-specific code | `#myapp/features/prospecting`, `#mail/constants` |

## The Three Tiers

### Tier 1: Shared (`$`) - Common Library

**Location:** `client/common/src`  
**Shared between:** Web app and Admin app

**What lives here:**
- `$/features/auth` - Authentication system
- `$/features/frame` - UI framework (sidebar, breadcrumbs, nav)
- `$/features/theme` - Theme system
- `$/components/ui/*` - shadcn UI components
- `$/platform/*` - Platform services (DI, events, config, logging)
- `$/models/*` - TypeScript models/types
- `$/api/*` - API client code

**Example:**
```typescript
import { Button } from '$/components/ui/button';
import { useAuthentication } from '$/features/auth/hooks';
import { useContainer } from '$/platform/di/ContainerContext';
```

---

### Tier 2: Web Infrastructure (`@`) - Web Root

**Location:** `client/web/src`  
**Specific to:** Web application

**What lives here:**
- `@/layouts/*` - Layout components (FrameLayout, Layout, FocusPageLayout)
- `@/routes/*` - Routing configuration (AppRegistry, router setup)
- `@/contexts/*` - Web-level contexts (AppContext)
- `@/components/*` - Web-specific components (AppSwitcher, RouteErrorBoundary)
- `@/Shell.tsx` - Root shell component
- `@/App.tsx` - Main app component
- `@/constants/*` - Web constants (languages)
- `@/pages/*` - Dev/test pages

**Example:**
```typescript
import { FrameLayout } from '@/layouts/FrameLayout';
import { AppRegistry } from '@/routes/AppRegistry';
import { AppProvider } from '@/contexts/AppContext';
```

---

### Tier 3: Apps (`#app`) - Application Modules

**Location:** `client/web/src/apps/{app}`  
**Generated for:** Each registered app

**Currently available:**
- `#myapp` → `web/src/apps/myapp`
- `#mail` → `web/src/apps/mail`

**What lives in an app:**
- `#myapp/features/*` - App features (prospecting, orchestration, interaction, etc.)
- `#myapp/constants/*` - App constants (sidebar-data)
- `#myapp/locales/*` - App translations
- `#myapp/routes.tsx` - App routes
- `#myapp/index.ts` - App configuration

**Example:**
```typescript
import { ContactList } from '#myapp/features/prospecting/views/ContactList';
import { myappSidebarData } from '#myapp/constants/sidebar-data';
import { DomainList } from '#mail/features/domains/views/DomainList';
```

---

## Import Decision Tree

```
Is it shared between web and admin?
├─ YES → Use $ (common)
│  └─ Examples: auth, UI components, platform services
│
└─ NO → Is it web infrastructure or app-specific?
   ├─ Infrastructure (layouts, routes, shell) → Use @
   │  └─ Examples: FrameLayout, AppRegistry, Shell
   │
   └─ App-specific (features, app config) → Use #app
      └─ Examples: #myapp/features/*, #mail/features/*
```

## Configuration

### Adding a New App

When creating a new app, update two config files:

**1. vite.config.ts** - Add to apps array:
```typescript
const apps = ['myapp', 'mail', 'newapp']; // ← Add here
```

The alias `#newapp` is generated automatically.

**2. tsconfig.app.json** - Add TypeScript path:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "$/*": ["../common/src/*"],
      "#myapp/*": ["./src/apps/myapp/*"],
      "#mail/*": ["./src/apps/mail/*"],
      "#newapp/*": ["./src/apps/newapp/*"]  // ← Add here
    }
  }
}
```

**Remember:** Restart the dev server after config changes!

---

## Common Patterns

### Within an App

```typescript
// In myapp app files (e.g., #myapp/features/prospecting/views/ContactList.tsx)

// ✅ Shared from common
import { Button } from '$/components/ui/button';
import { useAuthentication } from '$/features/auth/hooks';

// ✅ Web infrastructure
import { PageHeader } from '@/components/PageHeader';

// ✅ Other myapp features (prefer relative for nearby files)
import { useContactsStore } from '../../stores/contactsStore';

// ✅ Other myapp features (absolute when crossing feature boundaries)
import { SequenceModel } from '#myapp/features/orchestration/models/Sequence';
```

### In Route Definitions

```typescript
// In apps/myapp/routes.tsx
import { lazy } from 'react';

// Use #myapp for lazy loading
const ContactList = lazy(() => import('#myapp/features/prospecting/views/ContactList'));
const SequenceDetail = lazy(() => import('#myapp/features/orchestration/views/SequenceDetail'));

// Shared components use @
const ComingSoonPage = lazy(() => import('@/components/ComingSoonPage'));
```

### In App Config

```typescript
// In apps/myapp/index.ts
import type { AppConfig } from '@/routes/AppRegistry';
import { myappSidebarData } from '#myapp/constants/sidebar-data';

export const myappApp: AppConfig = {
  id: 'myapp',
  getSidebarData: () => myappSidebarData,
  loadRoutes: () => import('#myapp/routes').then(m => m.myappRoutes),
};
```

---

## Anti-Patterns (Don't Do This)

```typescript
// ❌ Wrong: Using $ for app-specific code
import { ContactList } from '$/apps/myapp/features/prospecting/views/ContactList';

// ❌ Wrong: Using @ for app code (old pattern before #app aliases)
import { ContactList } from '@/apps/myapp/features/prospecting/views/ContactList';

// ❌ Wrong: Using $ for web infrastructure
import { FrameLayout } from '$/layouts/FrameLayout';

// ❌ Wrong: Using @ for common shared code
import { Button } from '@/components/ui/button';

// ✅ Correct alternatives:
import { ContactList } from '#myapp/features/prospecting/views/ContactList';
import { FrameLayout } from '@/layouts/FrameLayout';
import { Button } from '$/components/ui/button';
```

---

## Migration Notes

### Pre-App System (Old)

Before the modular app architecture:
```typescript
import { ContactList } from '@/features/prospecting/views/ContactList';
```

### Post-App System (New)

After migrating to modular apps:
```typescript
import { ContactList } from '#myapp/features/prospecting/views/ContactList';
```

The `@/features/*` pattern is deprecated for app-specific code.

---

## Benefits

1. **Clear intent** - Alias tells you what tier the code belongs to
2. **Auto-completion** - IDEs can suggest based on alias
3. **Refactoring** - Easy to move code between tiers
4. **Scalability** - Adding new apps is just one config line
5. **Consistency** - All apps follow the same pattern

---

**Last Updated:** January 10, 2026  
**Version:** 1.0 (Initial implementation with #app aliases)
