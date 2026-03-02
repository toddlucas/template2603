# App-Level i18n Lazy Loading Implementation Plan

## Goal
Implement lazy loading of translations at the app level to reduce initial bundle size and improve performance by only loading translations for the app the user is currently using.

## Overview

### Current State (Eager Loading)
All translations from all apps are loaded upfront when the application starts:

```typescript
// src/features/locales.ts - Loads EVERYTHING
import { analytics } from "#example/features/analytics/locales";
import { infrastructure } from "#example/features/infrastructure/locales";
// ... all features
// All translations included in initial bundle
```

**Problems:**
- Mail app translations load even if user never visits mail (~30KB wasted)
- Defeats code-splitting benefits of lazy routes
- Large initial i18n bundle

### Target State (Hybrid App-Level Lazy Loading)
- **Upfront loading:** Common + shared features (auth, frame, theme, ai)
- **Lazy loading:** App-specific translations load when switching to that app

```
Initial Load:
  ✅ common/src/locales (shared across all client apps)
  ✅ web/src/features/auth (web-specific auth views)
  ✅ web/src/features/frame (web-specific frame)
  ✅ web/src/features/ai (web-specific, but shared across apps)
  ✅ web/src/locales/translation (web app-level)

Lazy Load on App Switch:
  🔄 Example features → Load when switching to Example app
  🔄 Mail features → Load when switching to Mail app
```

**Benefits:**
- Reduced initial bundle by ~30-50KB (compressed)
- Translations bundle with their associated app routes
- Clear separation aligned with app architecture
- Simple to understand and maintain

---

## Architecture Design

### Directory Structure

```
client/
├── common/src/                     # Shared across all client apps (web, admin, etc.)
│   ├── locales/                    # Common translations (eager load)
│   │   ├── de.jsonc
│   │   ├── el.jsonc
│   │   ├── en.jsonc
│   │   ├── es.jsonc
│   │   ├── fr.jsonc
│   │   └── index.ts
│   ├── features/
│   │   ├── auth/                   # Shared auth system (eager load)
│   │   │   └── locales/
│   │   ├── frame/                  # Shared frame system (eager load)
│   │   │   └── locales/
│   │   └── theme/                  # Shared theme system (eager load)
│   │       └── locales/
│   └── ...
│
└── web/src/                        # Web-specific client
    ├── locales/
    │   ├── translation/            # Web app-level (eager load)
    │   │   ├── en.jsonc
    │   │   └── ...
    │   └── index.ts                # Updated: Only shared locales
    │
    ├── features/
    │   ├── ai/                     # Web-specific shared feature (eager load)
    │   │   └── locales/
    │   ├── auth/                   # Web-specific auth views (eager load)
    │   │   └── views/
    │   │       └── locales/
    │   └── frame/                  # Web-specific frame extensions (eager load)
    │       └── locales/
    │
    └── apps/
        ├── example/
        │   ├── features/
        │   │   ├── analytics/locales/
        │   │   ├── dashboard/locales/
        │   │   ├── infrastructure/locales/
        │   │   ├── interaction/locales/
        │   │   ├── orchestration/locales/
        │   │   ├── prospecting/locales/
        │   │   └── settings/locales/
        │   ├── locales/            # NEW: Aggregates example translations
        │   │   └── index.ts
        │   └── index.ts            # Updated: Add loadLocales()
        │
        └── mail/
            ├── locales/            # NEW: Aggregates mail translations
            │   └── index.ts
            └── index.ts            # Updated: Add loadLocales()
```

### Locale Loading Layers

**Layer 1: Shared (Eager - Initial Bundle)**
```typescript
// src/locales/index.ts
import { common } from "$/locales";           // Common library
import { ai } from "@/features/ai/locales";    // Shared feature
import { frame } from "./features/frame/locales"; // Web frame
import de from "./translation/de.jsonc";       // Web app-level
// ...

export const resources = {
  en: { ...en, ...ai.en, ...frame.en, ...common.en },
  // ... other languages
};
```

**Layer 2: App-Specific (Lazy - Per App)**
```typescript
// apps/example/locales/index.ts
import { analytics } from "../features/analytics/locales";
import { dashboard } from "../features/dashboard/locales";
import { infrastructure } from "../features/infrastructure/locales";
import { interaction } from "../features/interaction/locales";
import { orchestration } from "../features/orchestration/locales";
import { prospecting } from "../features/prospecting/locales";
import { settings } from "../features/settings/locales";

export const exampleLocales = {
  de: { ...analytics.de, ...dashboard.de, ...infrastructure.de, ...interaction.de, ...orchestration.de, ...prospecting.de, ...settings.de },
  el: { ...analytics.el, ...dashboard.el, ...infrastructure.el, ...interaction.el, ...orchestration.el, ...prospecting.el, ...settings.el },
  en: { ...analytics.en, ...dashboard.en, ...infrastructure.en, ...interaction.en, ...orchestration.en, ...prospecting.en, ...settings.en },
  es: { ...analytics.es, ...dashboard.es, ...infrastructure.es, ...interaction.es, ...orchestration.es, ...prospecting.es, ...settings.es },
  fr: { ...analytics.fr, ...dashboard.fr, ...infrastructure.fr, ...interaction.fr, ...orchestration.fr, ...prospecting.fr, ...settings.fr },
};
```

---

## Implementation Plan

### Phase 1: Refactor Existing Locale Loading (30 min)

**1.1 Update `src/features/locales.ts`**
Remove example-specific feature imports, keep only shared features:

```typescript
// src/features/locales.ts
import { ai } from "@/features/ai/locales";
import { frame } from "./frame/locales";

export const features = {
  de: { ...ai.de, ...frame.de },
  el: { ...ai.el, ...frame.el },
  en: { ...ai.en, ...frame.en },
  es: { ...ai.es, ...frame.es },
  fr: { ...ai.fr, ...frame.fr },
};
```

**1.2 Test that app still loads**
```bash
npm run dev
# Verify app loads (will show missing translations for example features - expected)
```

---

### Phase 2: Create App-Level Locale Aggregators (20 min)

**2.1 Create `apps/example/locales/index.ts`**

```typescript
import { analytics } from "../features/analytics/locales";
import { dashboard } from "../features/dashboard/locales";
import { infrastructure } from "../features/infrastructure/locales";
import { interaction } from "../features/interaction/locales";
import { orchestration } from "../features/orchestration/locales";
import { prospecting } from "../features/prospecting/locales";
import { settings } from "../features/settings/locales";

export const exampleLocales = {
  de: { 
    ...analytics.de, 
    ...dashboard.de, 
    ...infrastructure.de, 
    ...interaction.de, 
    ...orchestration.de, 
    ...prospecting.de, 
    ...settings.de 
  },
  el: { 
    ...analytics.el, 
    ...dashboard.el, 
    ...infrastructure.el, 
    ...interaction.el, 
    ...orchestration.el, 
    ...prospecting.el, 
    ...settings.el 
  },
  en: { 
    ...analytics.en, 
    ...dashboard.en, 
    ...infrastructure.en, 
    ...interaction.en, 
    ...orchestration.en, 
    ...prospecting.en, 
    ...settings.en 
  },
  es: { 
    ...analytics.es, 
    ...dashboard.es, 
    ...infrastructure.es, 
    ...interaction.es, 
    ...orchestration.es, 
    ...prospecting.es, 
    ...settings.es 
  },
  fr: { 
    ...analytics.fr, 
    ...dashboard.fr, 
    ...infrastructure.fr, 
    ...interaction.fr, 
    ...orchestration.fr, 
    ...prospecting.fr, 
    ...settings.fr 
  },
};
```

**2.2 Create `apps/mail/locales/index.ts`**

```typescript
// Mail doesn't have features yet, but prepare for future
export const mailLocales = {
  de: {},
  el: {},
  en: {},
  es: {},
  fr: {},
};
```

---

### Phase 3: Add Lazy Loading to App Configs (45 min)

**3.1 Update `AppConfig` interface**

```typescript
// src/routes/AppRegistry.ts
export interface AppConfig {
  id: string;
  name: string;
  basePath: string;
  startPath: string;
  icon?: string;
  getSidebarData: () => SidebarNavMainItem[];
  loadRoutes: () => Promise<RouteObject[]>;
  loadLocales?: () => Promise<void>;  // NEW: Optional locale loader
}
```

**3.2 Create locale loading utility**

```typescript
// src/utils/loadAppLocales.ts
import i18n from '../i18n';

export async function loadAppLocales(
  appId: string,
  localesModule: Record<string, any>
) {
  // Get all available languages from i18n
  const languages = Object.keys(localesModule);
  
  // Add resources for each language
  for (const lang of languages) {
    const resources = localesModule[lang];
    
    // Add each namespace from this app
    Object.keys(resources).forEach((namespace) => {
      i18n.addResourceBundle(
        lang,
        namespace,
        resources[namespace],
        true,  // deep merge
        false  // don't overwrite
      );
    });
  }
  
  console.log(`✅ Loaded locales for ${appId} app`);
}
```

**3.3 Update `apps/example/index.ts`**

```typescript
import type { AppConfig } from '@/routes/AppRegistry';
import { exampleSidebarData } from '#example/constants/sidebar-data';
import { loadAppLocales } from '@/utils/loadAppLocales';

export const exampleApp: AppConfig = {
  id: 'example',
  name: 'Example',
  basePath: '/',
  startPath: '/dashboard',
  icon: '🎯',
  getSidebarData: () => exampleSidebarData,
  loadRoutes: () => import('#example/routes').then(m => m.exampleRoutes),
  loadLocales: async () => {
    const { exampleLocales } = await import('#example/locales');
    await loadAppLocales('example', exampleLocales);
  },
};

export default exampleApp;
```

**3.4 Update `apps/mail/index.ts`**

```typescript
import type { AppConfig } from '@/routes/AppRegistry';
import { mailSidebarData } from '#mail/constants/sidebar-data';
import { loadAppLocales } from '@/utils/loadAppLocales';

export const mailApp: AppConfig = {
  id: 'mail',
  name: 'Mail Infrastructure',
  basePath: '/mail',
  startPath: '/mail/overview',
  icon: '📧',
  getSidebarData: () => mailSidebarData,
  loadRoutes: () => import('#mail/routes').then(m => m.mailRoutes),
  loadLocales: async () => {
    const { mailLocales } = await import('#mail/locales');
    await loadAppLocales('mail', mailLocales);
  },
};

export default mailApp;
```

---

### Phase 4: Update AppContext to Load Locales (30 min)

**4.1 Add locale loading state management**

```typescript
// src/contexts/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AppConfig } from '../routes/AppRegistry';
import type { SidebarNavMainItem } from '$/features/frame/components/sidebar-types';
import { getAppById, getAppByPath, getDefaultApp } from '../routes/AppRegistry';

interface AppContextType {
  currentApp: AppConfig;
  sidebarData: SidebarNavMainItem[];
  switchApp: (appId: string) => void;
  availableApps: AppConfig[];
  isLoadingLocales: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  availableApps: AppConfig[];
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, availableApps }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentApp, setCurrentApp] = useState<AppConfig>(() => {
    return getAppByPath(location.pathname) || getDefaultApp();
  });
  
  const [isLoadingLocales, setIsLoadingLocales] = useState(false);
  const [loadedApps, setLoadedApps] = useState<Set<string>>(new Set());

  // Load locales for an app if not already loaded
  const loadAppLocales = async (app: AppConfig) => {
    if (loadedApps.has(app.id) || !app.loadLocales) {
      return; // Already loaded or no locales to load
    }
    
    setIsLoadingLocales(true);
    try {
      await app.loadLocales();
      setLoadedApps(prev => new Set(prev).add(app.id));
    } catch (error) {
      console.error(`Failed to load locales for ${app.id}:`, error);
    } finally {
      setIsLoadingLocales(false);
    }
  };

  // Load locales for initial app on mount
  useEffect(() => {
    loadAppLocales(currentApp);
  }, []); // Only on mount

  // Update current app when location changes
  useEffect(() => {
    const app = getAppByPath(location.pathname);
    if (app && app.id !== currentApp.id) {
      setCurrentApp(app);
      loadAppLocales(app);
    }
  }, [location.pathname]);

  const sidebarData = currentApp.getSidebarData();

  // Switch to a different app
  const switchApp = async (appId: string) => {
    const app = getAppById(appId);
    if (app) {
      setCurrentApp(app);
      await loadAppLocales(app);
      navigate(app.startPath);
    }
  };

  const value: AppContextType = {
    currentApp,
    sidebarData,
    switchApp,
    availableApps,
    isLoadingLocales,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

**4.2 Optional: Add loading indicator in AppSwitcher**

```typescript
// src/components/AppSwitcher.tsx
import { useApp } from '../contexts/AppContext';
import { Loader2 } from 'lucide-react';

export function AppSwitcher() {
  const { currentApp, switchApp, availableApps, isLoadingLocales } = useApp();
  
  return (
    <DropdownMenu>
      {/* ... existing code ... */}
      {isLoadingLocales && (
        <DropdownMenuItem disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading translations...</span>
        </DropdownMenuItem>
      )}
      {/* ... rest of menu items ... */}
    </DropdownMenu>
  );
}
```

---

### Phase 5: Testing & Verification (30 min)

**5.1 Build and analyze bundle**

```bash
npm run build

# Check bundle sizes
ls -lh dist/assets/*.js | grep -E '(example|mail|locales)'
```

**Expected results:**
- Initial bundle should be smaller (no example feature translations)
- Separate chunks for `apps-example-locales` and `apps-mail-locales`

**5.2 Manual testing checklist**

- [ ] App loads successfully with initial translations
- [ ] Shared translations (auth, frame, ai) work immediately
- [ ] Example features initially show fallback or missing translations (before locale load)
- [ ] After ~100ms, example translations load and display correctly
- [ ] Switch to Mail app → Mail translations load
- [ ] Switch back to Example → No reload (already loaded)
- [ ] Language switcher works correctly
- [ ] No console errors about missing translations
- [ ] Browser network tab shows dynamic imports for locale chunks

**5.3 Test specific scenarios**

```typescript
// Test 1: Initial load (Example should load)
// Open browser → Go to http://localhost:8383
// Check: Dashboard shows example translations
// Network tab: Should see example-locales chunk load

// Test 2: Switch to Mail
// Click app switcher → Select Mail app
// Check: Mail translations load
// Network tab: Should see mail-locales chunk load

// Test 3: Switch languages
// Change from English to Greek
// Check: All translations update correctly
// Both example and mail should use Greek

// Test 4: Direct navigation
// Navigate directly to /mail/overview
// Check: Mail locales load automatically
// Verify mail features display correctly

// Test 5: Performance
// Hard refresh app
// Check: Initial bundle is smaller than before
// Measure time to interactive
```

---

### Phase 6: Cleanup & Documentation (15 min)

**6.1 Remove old `features/locales.ts` references**

Verify no files still import from the old location:
```bash
grep -r "from '../features/locales'" src/ | grep -v node_modules
grep -r "from '@/features/locales'" src/ | grep -v node_modules
```

**6.2 Update TypeScript types**

Ensure `i18next.d.ts` still works with dynamic loading:
```typescript
// src/i18next.d.ts
import { defaultNS } from "./i18n";
import { resources } from "./locales";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: typeof resources["en"];
    // Note: App-specific namespaces added dynamically
  }
}
```

**6.3 Update documentation**
- Update `APPS-BRANCH-SUMMARY.md` to mention locale lazy loading
- Add note to `i18n-localization-pattern.md` about app-level loading
- Document the `loadAppLocales` utility

---

## Performance Impact

### Before (Eager Loading)
```
Initial Bundle:
  - Shared locales: ~15KB
  - Example feature locales: ~35KB
  - Mail feature locales: ~5KB
  - Total: ~55KB (compressed ~18KB)
```

### After (App-Level Lazy Loading)
```
Initial Bundle:
  - Shared locales: ~15KB
  - Total: ~15KB (compressed ~5KB)

Lazy Loaded (Example):
  - Example feature locales: ~35KB (compressed ~12KB)

Lazy Loaded (Mail):
  - Mail feature locales: ~5KB (compressed ~2KB)
```

**Improvement:**
- Initial load: -40KB raw, -13KB compressed
- Users who never visit Mail: Never load those 5KB
- First visit to app: Small one-time cost (~100ms)
- Subsequent visits: Instant (cached)

---

## Potential Issues & Solutions

### Issue 1: Flash of Untranslated Content (FOUC)
**Problem:** Translations might not load before components render

**Solution:**
```typescript
// Option A: Wait for locales before navigating
const switchApp = async (appId: string) => {
  const app = getAppById(appId);
  if (app) {
    setCurrentApp(app);
    await loadAppLocales(app);  // Wait
    navigate(app.startPath);
  }
};

// Option B: Show loading indicator
if (isLoadingLocales) {
  return <LoadingSpinner />;
}
```

### Issue 2: TypeScript Autocomplete
**Problem:** Dynamically loaded namespaces won't have autocomplete

**Solution:** Keep `i18next.d.ts` type definitions - they're compile-time only and don't affect runtime loading

### Issue 3: Language Changes
**Problem:** When user changes language, need to reload app locales in new language

**Solution:** Already handled by `i18n.addResourceBundle()` - it merges per language

### Issue 4: Bundle Splitting Not Working
**Problem:** Vite might not split locale chunks properly

**Solution:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'example-locales': ['./src/apps/example/locales/index.ts'],
          'mail-locales': ['./src/apps/mail/locales/index.ts'],
        },
      },
    },
  },
});
```

---

## Rollback Plan

If issues arise:

**Step 1: Revert locale loading**
```typescript
// src/features/locales.ts - Restore old version
import { analytics } from "#example/features/analytics/locales";
// ... add back all example features
```

**Step 2: Remove loadLocales from AppConfig**
```typescript
// src/routes/AppRegistry.ts
export interface AppConfig {
  // ... remove loadLocales property
}
```

**Step 3: Restore i18n.ts**
Use old resources export without dynamic loading

---

## Future Enhancements

### Phase 7 (Optional): Per-Feature Lazy Loading
If app-level is still too coarse-grained, could load per feature:

```typescript
// Load analytics translations only when visiting analytics routes
const AnalyticsDashboard = lazy(async () => {
  const [component, locales] = await Promise.all([
    import('./AnalyticsDashboard'),
    import('../locales'),
  ]);
  await loadFeatureLocales('analytics', locales.analytics);
  return component;
});
```

### Phase 8 (Optional): HTTP Backend
For very large apps, consider i18next-http-backend:

```typescript
i18n.use(HttpBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
});
```

---

## Success Criteria

✅ Initial bundle reduced by >30KB (compressed >10KB)  
✅ App loads without errors  
✅ All translations display correctly  
✅ Switching apps loads translations smoothly  
✅ Language switching works correctly  
✅ No FOUC (flash of untranslated content)  
✅ Browser network tab shows separate locale chunks  
✅ Build completes successfully  
✅ TypeScript compiles without errors  

---

## Timeline

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | Refactor existing locale loading | 30 min | None |
| 2 | Create app-level aggregators | 20 min | Phase 1 |
| 3 | Add lazy loading to app configs | 45 min | Phase 2 |
| 4 | Update AppContext | 30 min | Phase 3 |
| 5 | Testing & verification | 30 min | Phase 4 |
| 6 | Cleanup & documentation | 15 min | Phase 5 |

**Total Estimated Time:** 2.5 - 3 hours

---

## Related Documentation

- [i18n Localization Pattern](../../../patterns/client/i18n-localization-pattern.md)
- [Apps Branch Summary](./apps-branch-summary.md)
- [Modular App Architecture](./modular-app-architecture.md)
