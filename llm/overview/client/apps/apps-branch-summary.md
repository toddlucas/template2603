# Apps Branch - Modular Architecture POC Summary

## What Was Built

A proof-of-concept for dynamically loading separate applications within the web client, using the Mail Infrastructure app as an example.

## Complete File Structure

```
apps/
└── src/client/web/src/
    ├── apps/                                    # 🆕 New apps directory
    │   └── mail/                               # 🆕 Mail Infrastructure app
    │       ├── features/
    │       │   └── domains/
    │       │       └── views/
    │       │           ├── MailOverview.tsx    # 🆕 Dashboard
    │       │           ├── DomainList.tsx      # 🆕 Domain mgmt
    │       │           └── WarmupDashboard.tsx # 🆕 Warmup monitor
    │       ├── constants/
    │       │   └── sidebar-data.ts            # 🆕 Mail sidebar config
    │       ├── locales/
    │       │   └── en.jsonc                   # 🆕 Translations
    │       ├── routes.tsx                     # 🆕 Lazy-loaded routes
    │       └── index.ts                       # 🆕 App config
    │
    ├── contexts/                              # 🆕 New contexts directory
    │   └── AppContext.tsx                     # 🆕 App state management
    │
    ├── components/
    │   ├── AppSwitcher.tsx                    # 🆕 App selection UI
    │   └── AppSidebarWithAppSwitcher.tsx      # 🆕 Custom sidebar
    │
    ├── routes/
    │   ├── AppRegistry.ts                     # 🆕 App registration
    │   └── index.tsx                          # ✏️ Updated with mail routes
    │
    ├── layouts/
    │   └── FrameLayout.tsx                    # ✏️ Uses AppContext
    │
    ├── Shell.tsx                              # ✏️ Wraps with AppProvider
    │
    └── APPS-POC-README.md                     # 🆕 Full documentation
```

## Legend
- 🆕 New file created
- ✏️ Existing file modified

## Recent Updates

### Main App Migration (Jan 2026)
- Main app moved to `apps/main/` following the modular architecture
- All main features now in `apps/main/features/`
- Main set as default app with basePath `/`
- Added `startPath` to AppConfig for customizable app landing pages

### i18n Lazy Loading (Planned)
- App-level lazy loading of translations to reduce initial bundle
- See [i18n-lazy-loading-plan.md](./i18n-lazy-loading-plan.md) for implementation details
- Translations load when switching to an app, not upfront

## How to Use

1. **Switch to the apps worktree**:
   ```bash
   cd /Users/todd/Source/sendicateio/apps
   ```

2. **Install dependencies** (if needed):
   ```bash
   cd src/client/web
   npm install
   ```

3. **Run the dev server**:
   ```bash
   npm run dev
   ```

4. **Test the app switcher**:
   - Navigate to any authenticated route (e.g., `/dashboard`)
   - Click where "My Workspace" appears (top-left in sidebar)
   - Select "📧 Mail Infrastructure"
   - Sidebar updates with Mail app menu
   - Navigate to Mail routes: `/mail/overview`, `/mail/domains`, etc.

## Key Concepts

### 1. App Registry (`routes/AppRegistry.ts`)
Central registration point for all apps. Currently has:
- Mail Infrastructure app

### 2. App Context (`contexts/AppContext.tsx`)
React context providing:
- Current app state
- App switching function
- Dynamic sidebar data
- Available apps list

### 3. App Switcher (`components/AppSwitcher.tsx`)
UI component that:
- Shows in sidebar header
- Lists available apps
- Switches app on selection
- Shows current app icon

### 4. Dynamic Sidebar
FrameLayout now:
- Gets sidebar data from AppContext
- Updates when app changes
- Maintains state per app

## Routes Added

| Route | Component | Description |
|-------|-----------|-------------|
| `/mail/overview` | MailOverview | Dashboard with metrics |
| `/mail/domains` | DomainList | Domain management |
| `/mail/warmup` | WarmupDashboard | Warmup monitoring |
| `/mail/dns` | Placeholder | Coming soon |

## Architecture Benefits

✅ **Separation of concerns** - Each app is independent  
✅ **Lazy loading** - Apps load on-demand  
✅ **Scalable** - Easy to add new apps  
✅ **User-friendly** - Familiar switcher pattern  
✅ **Maintainable** - Clear boundaries  

## Next Steps

To migrate the Main app:
1. Create `apps/main/` directory
2. Move existing features to `apps/main/features/`
3. Create `apps/main/routes.tsx` with current routes
4. Move `constants/sidebar-data.ts` to `apps/main/constants/`
5. Register Main app in AppRegistry
6. Set Main as default app

To add new apps:
1. Create `apps/{name}/` directory
2. Follow mail app structure
3. Export AppConfig in `index.ts`
4. Register in AppRegistry
5. Done!

## Path Alias System

The project uses a three-tier alias system:

| Alias | Resolves To | Use For |
|-------|-------------|---------|
| `$` | `common/src` | Shared code (auth, UI, platform) |
| `@` | `web/src` | Web infrastructure (layouts, routes) |
| `#main` | `web/src/apps/main` | Main app code |
| `#mail` | `web/src/apps/mail` | Mail app code |

**Examples:**
```typescript
// Shared from common
import { Button } from '$/components/ui/button';

// Web infrastructure  
import { FrameLayout } from '@/layouts/FrameLayout';

// App-specific
import { ContactList } from '#main/features/prospecting/views/ContactList';
import { mailSidebarData } from '#mail/constants/sidebar-data';
```

Adding a new app automatically generates its `#app` alias in `vite.config.ts`.

## Documentation

Full documentation available in:
- `src/client/web/ALIAS-SYSTEM.md` - Path alias system explained
- `src/client/web/APPS-POC-README.md` - App architecture overview

## Worktree Info

- **Worktree path**: `/Users/todd/Source/sendicateio/apps`
- **Branch**: `apps`
- **Based on**: `main` branch
- **Purpose**: POC for modular app architecture

## Merging Back

When ready to merge:
```bash
cd /Users/todd/Source/sendicateio/apps
git add .
git commit -m "Add modular app architecture POC with mail app"
git push origin apps

# Then create PR from apps -> main
```

## Questions & Issues

See the POC README for:
- Technical details
- Known issues
- Architecture decisions
- Troubleshooting

---

Created: January 10, 2026  
Worktree: apps  
Branch: apps
