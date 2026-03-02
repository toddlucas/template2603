# New App Template

Use this as a guide when creating a new app.

## Directory Structure

```
apps/{appname}/
├── features/              # App-specific features
│   └── {feature}/
│       ├── components/
│       ├── views/
│       ├── services/
│       └── stores/
├── constants/
│   └── sidebar-data.ts   # Sidebar configuration
├── locales/
│   └── en.jsonc          # Translations
├── routes.tsx            # Route definitions
└── index.ts              # App config export
```

## Step 1: Create Directory Structure

```bash
mkdir -p apps/{appname}/features/{feature}/views
mkdir -p apps/{appname}/constants
mkdir -p apps/{appname}/locales
```

## Step 2: Create Sidebar Config

**File**: `apps/{appname}/constants/sidebar-data.ts`

```typescript
import { Icon1, Icon2 } from "lucide-react";
import type { SidebarNavMainItem } from "$/features/frame/components/sidebar-types";

export const {appname}SidebarData: SidebarNavMainItem[] = [
  {
    id: "{appname}-item1",
    title: "Item 1",
    path: "/{appname}/item1",
    icon: Icon1,
    items: [],
  },
  {
    id: "{appname}-item2",
    title: "Item 2",
    path: "/{appname}/item2",
    icon: Icon2,
    items: [],
  },
];
```

## Step 3: Create Views

**File**: `apps/{appname}/features/{feature}/views/MainView.tsx`

```typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '$/components/ui/card';

const MainView: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Main View</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Content goes here...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainView;
```

## Step 4: Create Routes

**File**: `apps/{appname}/routes.tsx`

```typescript
import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const MainView = lazy(() => import('./features/{feature}/views/MainView'));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<div>Loading...</div>}>
    <Component />
  </Suspense>
);

export const {appname}Routes: RouteObject[] = [
  {
    path: '{appname}/main',
    element: withSuspense(MainView),
  },
  // Add more routes...
];
```

## Step 5: Create Locales

**File**: `apps/{appname}/locales/en.jsonc`

```jsonc
{
  // App name
  "{AppName}": "{App Name}",
  
  // Navigation
  "Item 1": "Item 1",
  "Item 2": "Item 2",
  
  // Views
  "Main View": "Main View",
  "Content goes here...": "Content goes here..."
}
```

## Step 6: Create App Config

**File**: `apps/{appname}/index.ts`

```typescript
import type { AppConfig } from '@/routes/AppRegistry';
import { {appname}SidebarData } from '#{appname}/constants/sidebar-data';

export const {appname}App: AppConfig = {
  id: '{appname}',
  name: '{App Name}',
  basePath: '/{appname}',
  icon: '🎯', // Choose emoji or use icon component
  getSidebarData: () => {appname}SidebarData,
  loadRoutes: () => import('#{appname}/routes').then(m => m.{appname}Routes),
};

export default {appname}App;
```

## Step 7: Register App

**File**: `routes/AppRegistry.ts`

```typescript
// Add import (using the app alias)
import { {appname}App } from '#{appname}';

// Add to registered apps
export const registeredApps: AppConfig[] = [
  exampleApp,
  mailApp,
  {appname}App,  // ← Add here
];
```

**Also update vite.config.ts:**

Add your new app to the apps array:
```typescript
const apps = ['main', 'mail', '{appname}']; // ← Add here
```

**Also update tsconfig.app.json:**

Add the TypeScript path mapping:
```json
"paths": {
  "@/*": ["./src/*"],
  "$/*": ["../common/src/*"],
  "#main/*": ["./src/apps/main/*"],
  "#mail/*": ["./src/apps/mail/*"],
  "#{appname}/*": ["./src/apps/{appname}/*"]  // ← Add here
}
```

## Step 8: Test

1. Start dev server: `npm run dev`
2. Navigate to authenticated route
3. Click App Switcher
4. Select your new app
5. Test navigation and functionality

## Checklist

- [ ] Created directory structure
- [ ] Added sidebar configuration
- [ ] Created at least one view
- [ ] Created routes with lazy loading
- [ ] Added translations (en.jsonc)
- [ ] Created app config (index.ts)
- [ ] Added app to `vite.config.ts` apps array
- [ ] Added TypeScript path mapping to `tsconfig.app.json`
- [ ] Registered in AppRegistry
- [ ] Restarted dev server (for alias changes)
- [ ] Tested app switching
- [ ] Tested navigation
- [ ] Verified lazy loading works

## Tips

1. **Icon Selection**: Use Lucide React icons or emojis
2. **Sidebar Items**: Keep top-level items to 4-6 max
3. **Base Path**: Use lowercase, no spaces (e.g., `/mail`, `/analytics`)
4. **Lazy Loading**: Always use `lazy()` for components
5. **Suspense**: Wrap lazy components with Suspense fallback
6. **Translations**: Start with English, add other languages later

## Common Patterns

### Feature with List/Detail Views

```typescript
export const appRoutes: RouteObject[] = [
  {
    path: 'app/items',
    element: withSuspense(ItemList),
  },
  {
    path: 'app/items/:id',
    element: withSuspense(ItemDetail),
  },
  {
    path: 'app/items/new',
    element: withSuspense(ItemForm),
  },
];
```

### Nested Sidebar Items

```typescript
{
  id: "parent",
  title: "Parent",
  path: "/app/parent",
  icon: ParentIcon,
  items: [
    {
      id: "child-1",
      title: "Child 1",
      path: "/app/parent/child1",
    },
    {
      id: "child-2",
      title: "Child 2",
      path: "/app/parent/child2",
    },
  ],
}
```

### App with Services

```typescript
// apps/{appname}/services/DataService.ts
import { injectable } from 'inversify';

@injectable()
export class DataService {
  async getData() {
    // Implementation
  }
}

// Register in container.ts
container.bind<DataService>(TYPES.DataService)
  .to(DataService)
  .inSingletonScope();
```

## Example Apps

See existing apps for reference:
- `apps/mail/` - Simple app with dashboard and list views
- (More examples as they're added)

---

Need help? Check the main POC README or ask the team!
