# Examples Directory

**✅ These files are committed for team reference**

## Purpose

Permanent examples showing how to use features and components in the common library.

## Structure

```
examples/
├── auth/              # Authentication examples
├── dashboard/         # Dashboard component examples
├── forms/            # Form component examples
└── [feature]/        # Other feature examples
```

## Naming Convention

Files should use `.example.tsx` or `.example.ts` suffix:
- `basic-login.example.tsx`
- `sidebar-usage.example.tsx`
- `form-validation.example.tsx`

## How These Are Used

Examples are:
- ✅ Committed to git (unlike `scratch/`)
- ✅ Excluded from production builds
- ✅ Available for reference
- ✅ Used for onboarding new developers

## Adding New Examples

1. **Create in appropriate subdirectory**:
   ```bash
   mkdir -p examples/myfeature
   touch examples/myfeature/usage.example.tsx
   ```

2. **Use clear naming**:
   - Describe what the example demonstrates
   - Use `.example.tsx` suffix

3. **Add helpful comments**:
   ```typescript
   /**
    * Example: Basic authentication flow
    * 
    * Demonstrates:
    * - Login form with validation
    * - Error handling
    * - Redirect after login
    */
   ```

4. **Update this README** with a link to your example

## Current Examples

### Auth Examples
- Coming soon

### Dashboard Examples  
- Coming soon

### Form Examples
- Coming soon

## Usage in Documentation

Reference examples in code comments or documentation:

```typescript
/**
 * Custom hook for managing sidebar state
 * 
 * @example
 * See examples/dashboard/sidebar-usage.example.tsx for complete usage
 */
export function useSidebarState() {
  // ...
}
```

---

**Note**: If you just need a quick prototype, use `scratch/` instead (it's gitignored).

