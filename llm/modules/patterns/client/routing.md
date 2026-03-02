# Client Routing

> **Module**: Patterns / Client  
> **Domain**: Navigation setup  
> **Token target**: 200-300

## Purpose

Defines how to add routes and integrate with sidebar navigation.

## Content to Include

### Route Registration

```tsx
// {app}/src/routes/index.tsx (or similar)
import {Entity}Page from '$/features/{feature}/views/{Entity}Page';
import {Feature}TestPage from '$/features/{feature}/views/{Feature}TestPage';

// In routes configuration
<Route path="{feature}/{entity}" element={<{Entity}Page />} />
<Route path="test/{feature}" element={<{Feature}TestPage />} />
```

### Sidebar Navigation

If the feature needs a navigation link:

```typescript
// {app}/src/constants/sidebar-data.ts
import { Users } from 'lucide-react';  // Choose appropriate icon

// Add to appropriate section
{
  title: "{Entity}s",
  path: "/{feature}/{entity}", // path, or url for external link
  icon: Users,
},
```

### When to Add Sidebar Links

| Feature Type | Add Sidebar Link? |
|--------------|-------------------|
| User-facing pages | Yes |
| Admin tools | Yes (in admin app) |
| Test pages | No |
| Internal utilities | No |

### Test Page Pattern

Always create a test page for development:

```tsx
// views/{Feature}TestPage.tsx
const {Feature}TestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{Feature} Test Page</h1>
      
      {/* Test controls */}
      <Card className="mb-8">
        <CardHeader><CardTitle>Test Controls</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={() => console.log('test')}>Test Action</Button>
        </CardContent>
      </Card>
      
      {/* Main component */}
      <{Entity}List />
    </div>
  );
};

export default {Feature}TestPage;
```

### Dashboard Integration

For features that appear on the dashboard:

1. Create a summary widget component
2. Register in dashboard layout
3. Consider data loading strategy (eager vs lazy)

## Backlink

- [Client Feature Template](../../../patterns/client/client-feature-template.md) - Full routing examples
