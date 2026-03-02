# Modular App Architecture - POC

This POC demonstrates a modular app architecture where multiple applications can be dynamically loaded and switched between using a unified sidebar interface.

## Overview

The architecture separates concerns into:
- **Top-level infrastructure**: Router, layouts, shared components
- **Individual apps**: Self-contained applications with their own routes, features, and sidebar configuration

## What's Been Built

### 1. Mail Infrastructure App (`apps/mail/`)

A prototype application for managing mail infrastructure (domains, DNS, warmup).

```
apps/mail/
├── features/
│   └── domains/
│       └── views/
│           ├── MailOverview.tsx      # Dashboard with metrics
│           ├── DomainList.tsx        # Domain management
│           └── WarmupDashboard.tsx   # Warmup monitoring
├── constants/
│   └── sidebar-data.ts               # Mail-specific sidebar
├── locales/
│   └── en.jsonc                      # Translations
├── routes.tsx                        # Lazy-loaded routes
└── index.ts                          # App configuration
```

### 2. App Registry System (`routes/AppRegistry.ts`)

Central registry that knows about all available apps:

```typescript
export interface AppConfig {
  id: string;
  name: string;
  basePath: string;
  icon?: string;
  getSidebarData: () => SidebarNavMainItem[];
  loadRoutes: () => Promise<RouteObject[]>;
}
```

### 3. App Context (`contexts/AppContext.tsx`)

React context that manages:
- Current active app
- App switching logic
- Sidebar data for current app
- Route-based app detection

### 4. App Switcher Component (`components/AppSwitcher.tsx`)

UI component that replaces the team switcher with app selection:
- Dropdown menu showing available apps
- Click to switch apps
- Visual indicator of current app

### 5. Updated Layouts

**FrameLayout** now:
- Uses AppContext to get sidebar data
- Displays AppSwitcher instead of TeamSwitcher
- Dynamically loads sidebar config based on current app

## How It Works

1. **User clicks App Switcher** (where "My Workspace" was)
2. **Selects an app** (e.g., "Mail Infrastructure")
3. **AppContext.switchApp()** is called
4. **Navigation happens** to app's base path
5. **Sidebar updates** with app-specific menu items
6. **Routes lazy load** when accessed

## File Structure

```
web/src/
├── apps/                          # ✅ All apps
│   └── mail/                     # ✅ Mail app (POC)
├── layouts/                       # ✅ Shared layouts
│   ├── FrameLayout.tsx           # Updated to use AppContext
│   ├── Layout.tsx
│   └── FocusPageLayout.tsx
├── components/                    # ✅ Shared components
│   ├── AppSwitcher.tsx           # NEW: App selection UI
│   └── AppSidebarWithAppSwitcher.tsx  # NEW: Custom sidebar
├── contexts/                      # ✅ NEW: App context
│   └── AppContext.tsx
├── routes/                        # ✅ Updated router
│   ├── index.tsx                 # Loads mail routes
│   ├── AppRegistry.ts            # NEW: App registry
│   └── AuthProtected.tsx
├── Shell.tsx                      # Updated with AppProvider
├── main.tsx
└── container.ts
```

## Routes

### Mail App Routes
- `/mail/overview` - Dashboard with metrics
- `/mail/domains` - Domain management
- `/mail/warmup` - Warmup progress
- `/mail/dns` - DNS configuration

All routes are lazy-loaded and only fetched when accessed.

## Testing the POC

1. **Start the dev server**:
   ```bash
   cd /Users/todd/Source/sendicateio/apps/src/client/web
   npm run dev
   ```

2. **Navigate to an authenticated route** (e.g., `/dashboard`)

3. **Click the App Switcher** (top-left in sidebar, where "My Workspace" was)

4. **Select "Mail Infrastructure"**

5. **Sidebar changes** to show Mail app menu items

6. **Navigate through mail features**

## Key Features

✅ **Dynamic sidebar** - Changes based on current app  
✅ **Lazy loading** - Apps load on-demand  
✅ **URL-based detection** - Current app detected from route  
✅ **Clean separation** - Each app is self-contained  
✅ **Shared infrastructure** - Layouts, components, DI container shared  

## Benefits

1. **Modular** - Easy to add new apps without touching existing code
2. **Scalable** - Clear boundaries between applications
3. **Performance** - Code splitting reduces initial bundle size
4. **Maintainable** - Each app owns its features and configuration
5. **User-friendly** - Familiar switcher UI (like team/workspace switchers)

## Next Steps

### To add the Main app properly:

1. Create `apps/main/` directory
2. Move current features to `apps/main/features/`
3. Create `apps/main/routes.tsx` with existing routes
4. Create `apps/main/constants/sidebar-data.ts` (use existing data)
5. Register in AppRegistry
6. Update routes to load from registry

### To add more apps:

1. Create `apps/{appname}/` directory
2. Add features, routes, sidebar config
3. Export AppConfig in `index.ts`
4. Register in AppRegistry
5. Routes automatically available

## Architecture Decisions

### Why App Switcher in Sidebar?
- Users are familiar with team/workspace switchers
- Natural location for context switching
- No additional UI chrome needed

### Why Lazy Loading?
- Reduces initial bundle size
- Apps only load when accessed
- Better performance for users who don't use all apps

### Why Sidebar Config in Each App?
- Apps own their navigation structure
- Easy to add/modify without affecting other apps
- Clear separation of concerns

## Files Modified

- `Shell.tsx` - Added AppProvider
- `FrameLayout.tsx` - Uses AppContext for sidebar
- `routes/index.tsx` - Loads mail routes

## Files Added

- `contexts/AppContext.tsx`
- `routes/AppRegistry.ts`
- `components/AppSwitcher.tsx`
- `components/AppSidebarWithAppSwitcher.tsx`
- `apps/mail/**` (entire mail app)

## Technical Notes

### AppConfig Interface
Each app exports an AppConfig that defines:
- **id**: Unique identifier
- **name**: Display name
- **basePath**: URL prefix (e.g., `/mail`)
- **icon**: Emoji or icon for UI
- **getSidebarData()**: Returns sidebar menu items
- **loadRoutes()**: Returns Promise of route definitions

### Path Aliases

The project uses a three-tier alias system:

| Alias | Resolves To | Use For |
|-------|-------------|---------|
| `$` | `common/src` | Shared code (auth, frame, theme, UI components) |
| `@` | `web/src` | Web infrastructure (layouts, routes, shell) |
| `#app` | `web/src/apps/{app}` | App-specific code (e.g., `#main`, `#mail`) |

**Examples:**
```typescript
// Shared from common
import { Button } from '$/components/ui/button';
import { useAuthentication } from '$/features/auth/hooks';

// Web infrastructure
import { FrameLayout } from '@/layouts/FrameLayout';
import { AppRegistry } from '@/routes/AppRegistry';

// App-specific
import { ContactList } from '#main/features/prospecting/views/ContactList';
import { mailSidebarData } from '#mail/constants/sidebar-data';
```

### Sidebar Data Format
Uses the existing `SidebarNavMainItem` type from `$/features/frame/components/sidebar-types`:
```typescript
// In apps/mail/constants/sidebar-data.ts
import { Globe, TrendingUp } from "lucide-react";
import type { SidebarNavMainItem } from "$/features/frame/components/sidebar-types";

export const mailSidebarData: SidebarNavMainItem[] = [
  {
    id: "mail-domains",
    title: "Domains",
    path: "/mail/domains",
    icon: Globe,
    items: [],
  },
  // ...
];
```

Each item must have:
- `id`: string - Unique identifier
- `title`: string - Display name
- `path`: string - Internal route path
- `icon`: LucideIcon - Required icon
- `items`: SidebarNavItem[] - Sub-items (can be empty array)
- `badge?`: number - Optional badge count

### Route Detection
AppContext automatically detects the current app based on URL path:
- Checks if path starts with any app's `basePath`
- Falls back to default app if no match

## Known Issues / TODO

- [ ] Add loading states while app routes are loading
- [ ] Handle app switching while on nested routes
- [ ] Add breadcrumb updates for app context
- [ ] Consider URL strategy: `/mail/*` vs `/?app=mail`
- [ ] Add app-specific i18n registration
- [ ] Test with multiple apps loaded
- [ ] Add error boundaries per app

## Questions?

See the original proposal in chat history for more context on the architecture decisions.
