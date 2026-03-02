# Data-Driven Breadcrumb System

This implementation provides a comprehensive, data-driven breadcrumb system that automatically generates breadcrumbs based on your application's routing structure and sidebar configuration.

## Features

- **Automatic breadcrumb generation** from sidebar navigation structure
- **Custom breadcrumb overrides** via route handles
- **Support for both dashboard and non-dashboard routes**
- **External link support** with proper security attributes
- **Type-safe implementation** with TypeScript support

## How It Works

### 1. Automatic Sidebar-Based Breadcrumbs

For dashboard routes (those using `FrameLayout`), breadcrumbs are automatically generated from the sidebar navigation structure using the existing `getActiveBreadcrumbs()` method.

### 2. Custom Route Handle Breadcrumbs

You can override automatic breadcrumbs by providing custom breadcrumb data in route handles:

```typescript
export const userListHandle = {
  breadcrumbs: [
    { title: 'Models', url: '/models' },
    { title: 'Users', url: '/identity/users' }
  ],
  breadcrumbTitle: 'User Management' // Optional: custom title for the last breadcrumb
}
```

### 3. Auto-Generated Path-Based Breadcrumbs

For routes without custom handles, breadcrumbs are automatically generated from the URL path segments.

## Usage Examples

### Dashboard Routes

```typescript
// In your route definition
<Route path="identity/users" element={<UserList />} handle={userListHandle} />
```

### Account Routes

```typescript
// In your route definition
<Route path="account/change-password" element={<ChangePassword />} handle={accountChangePasswordHandle} />
```

### Custom Breadcrumb Handle

```typescript
export const myCustomHandle = {
  breadcrumbs: [
    { title: 'Home', url: '/' },
    { title: 'Settings', url: '/settings' },
    { title: 'Advanced', url: '/settings/advanced' }
  ],
  breadcrumbTitle: 'Advanced Settings'
}
```

## Breadcrumb Item Properties

```typescript
interface BreadcrumbItem {
  title: string        // Display text
  url?: string        // Link URL (optional for last item)
  isExternal?: boolean // External link flag
  target?: string     // Link target (e.g., '_blank')
}
```

## Testing

Visit `/breadcrumb-test` to see the breadcrumb system in action and test different route configurations.

## Implementation Details

- **Hook**: `useBreadcrumbs()` - Main hook that determines breadcrumb source
- **Layouts**: Both `FrameLayout` and `Layout` support breadcrumbs
- **Route Handles**: Use `breadcrumbs` and `breadcrumbTitle` properties
- **Sidebar Integration**: Leverages existing `getActiveBreadcrumbs()` method

## Migration from Hardcoded Breadcrumbs

1. Remove hardcoded breadcrumb JSX
2. Add `useBreadcrumbs()` hook to your layout
3. Replace hardcoded breadcrumb rendering with dynamic mapping
4. Add route handles for custom breadcrumb configurations where needed

This system provides a clean, maintainable way to manage breadcrumbs across your entire application while maintaining flexibility for custom configurations.
