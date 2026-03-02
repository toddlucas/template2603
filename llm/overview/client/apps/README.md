# Modular App Architecture

Documentation for the web client's modular app architecture system.

## Overview

The web client uses a modular architecture where multiple applications can coexist and be dynamically loaded. Each app is self-contained with its own features, routes, and sidebar configuration.

## Architecture Documents

### [Modular App Architecture](./modular-app-architecture.md)
**Status:** ✅ Implemented (POC)

Complete guide to the modular app system:
- Architecture overview and benefits
- App registry and configuration
- Dynamic route loading
- App switching mechanism
- Technical implementation details

### [Path Alias System](./alias-system.md)
**Status:** ✅ Implemented

Three-tier path alias system for clean imports:
- `$` - Shared code (common/src)
- `@` - Web infrastructure (web/src)
- `#app` - App-specific code (web/src/apps/{app})

Includes decision trees, patterns, and examples.

## Implementation Guides

### [Apps Branch Summary](./apps-branch-summary.md)
Summary of the apps branch implementation and migration:
- What was built
- File structure
- How to use the app system
- Current state and updates

### [i18n Lazy Loading Plan](./i18n-lazy-loading-plan.md)
**Status:** 📋 Planned

Plan for implementing app-level lazy loading of translations:
- Architecture design
- Implementation phases
- Performance benefits
- Testing strategy

## Current Apps

### Main App (Main)
- **Status:** ✅ Migrated (January 2026)
- **Base Path:** `/`
- **Start Path:** `/dashboard`
- **Features:** Analytics, Dashboard, Infrastructure, Interaction, Orchestration, Prospecting, Settings
- **Alias:** `#main`

### Mail Infrastructure App (POC)
- **Status:** ✅ Working
- **Base Path:** `/mail`
- **Start Path:** `/mail/overview`
- **Features:** Domains, Warmup, DNS
- **Alias:** `#mail`

## Quick Start

### Creating a New App

1. Create directory structure in `web/src/apps/{appname}/`
2. Follow the [App Template](../../../patterns/client/client-app.md)
3. Add to `vite.config.ts` apps array
4. Add TypeScript path to `tsconfig.app.json`
5. Register in `AppRegistry.ts`
6. Restart dev server

### Using the Alias System

```typescript
// Shared from common
import { Button } from '$/components/ui/button';

// Web infrastructure  
import { FrameLayout } from '@/layouts/FrameLayout';

// App-specific
import { ContactList } from '#main/features/prospecting/views/ContactList';
import { mailSidebarData } from '#mail/constants/sidebar-data';
```

## Key Concepts

### App Registry
Central registration point in `routes/AppRegistry.ts` that knows about all available apps and provides helper functions for routing.

### App Context
React context (`contexts/AppContext.tsx`) that manages:
- Current active app
- App switching
- Dynamic sidebar data
- URL-based app detection

### App Switcher
UI component that replaces the team/workspace switcher, allowing users to switch between apps from the sidebar.

### Lazy Loading
All app routes are lazy-loaded using `React.lazy()` and dynamic imports, reducing initial bundle size.

## Benefits

✅ **Modular** - Each app is self-contained  
✅ **Scalable** - Easy to add new apps  
✅ **Performance** - Code splitting and lazy loading  
✅ **Maintainable** - Clear boundaries between apps  
✅ **User-friendly** - Familiar switcher pattern  

## See Also

- [Client Overview](../client-overview.md) - Overall client architecture
- [Client Feature Template](../../../patterns/client/client-feature-template.md) - General feature development

---

**Created:** January 10, 2026  
**Status:** POC Complete, Main Migration Pending
