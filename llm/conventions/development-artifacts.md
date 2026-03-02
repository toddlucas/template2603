# Development Artifacts Management

## Overview

This document defines where to place temporary development artifacts like examples, prototypes, scratch files, and feature-specific documentation to prevent them from cluttering production code or causing build issues.

## Problem Statement

During development, we often create:
- Example/test components for trying out features
- README files documenting complex features
- Prototype code for exploring APIs
- Scratch files for debugging
- Mock data for development

When these files are placed in `src/` directories, they:
- ❌ Get included in production builds
- ❌ Cause TypeScript compilation errors
- ❌ Clutter the codebase
- ❌ Confuse other developers
- ❌ May contain hardcoded data or API keys

## Solution: Organized Artifact Storage

### Directory Structure

```
main/src/client/
├── common/
│   ├── src/                          # Production code only
│   │   └── features/
│   │       └── auth/
│   │           ├── api/
│   │           ├── stores/
│   │           └── views/
│   │
│   ├── scratch/                      # Temporary development files (gitignored)
│   │   ├── README.md
│   │   ├── auth-prototype.tsx
│   │   └── test-breadcrumb.tsx
│   │
│   ├── examples/                     # Permanent examples (committed)
│   │   ├── README.md
│   │   ├── auth/
│   │   │   ├── README.md
│   │   │   ├── basic-login-example.tsx
│   │   │   └── oauth-flow-example.tsx
│   │   └── dashboard/
│   │       └── sidebar-usage-example.tsx
│   │
│   └── .notes/                       # Feature documentation (committed)
│       ├── breadcrumb-design.md
│       ├── sidebar-state-management.md
│       └── auth-flow-diagram.png
│
├── web/
│   ├── src/                          # Production code
│   ├── scratch/                      # Web app scratch files
│   ├── examples/                     # Web app examples
│   └── .notes/                       # Web app notes
│
└── admin/
    ├── src/                          # Production code
    ├── scratch/                      # Admin app scratch files
    ├── examples/                     # Admin app examples
    └── .notes/                       # Admin app notes
```

## Directory Purposes

### `src/` - Production Code Only ✅

**What belongs here**:
- Production components, hooks, services
- Production configuration
- Tests (`.test.ts`, `.test.tsx`)
- Type definitions

**What does NOT belong**:
- ❌ Example files
- ❌ Prototype components
- ❌ README files about features
- ❌ Test data or fixtures (unless in `testing/`)

### `scratch/` - Temporary Development Files 🚧

**Purpose**: Quick prototypes, experiments, debugging files that you don't want to commit.

**Naming**: Any name, any extension

**Git**: `.gitignore` this entire directory

**Lifecycle**: Delete when done or move to `examples/`

**Examples**:
```
scratch/
├── README.md                 # Explains this is scratch space
├── test-new-hook.tsx        # Testing a new hook
├── sidebar-prototype.tsx    # Trying out sidebar design
├── mock-api-data.json       # Test data
└── debug-render.tsx         # Debugging component renders
```

**When to use**:
- ✅ Quick prototypes
- ✅ Debugging components
- ✅ Testing third-party libraries
- ✅ Temporary mock data
- ✅ Code snippets you're not sure about

### `examples/` - Permanent Examples 📚

**Purpose**: Committed examples that show how to use features/components.

**Naming**: `{feature}-example.tsx` or descriptive names

**Git**: Committed to repository

**Lifecycle**: Permanent (until feature is removed)

**Structure**:
```
examples/
├── README.md                        # Index of all examples
├── auth/
│   ├── README.md                   # Auth examples overview
│   ├── basic-login.example.tsx
│   ├── oauth-flow.example.tsx
│   └── protected-route.example.tsx
└── dashboard/
    ├── sidebar-usage.example.tsx
    └── breadcrumb-nav.example.tsx
```

**When to use**:
- ✅ Demonstrating component usage
- ✅ Showing API integration patterns
- ✅ Documenting complex features
- ✅ Onboarding new developers
- ✅ Reference implementations

### `.notes/` - Feature Documentation 📝

**Purpose**: Documentation, design decisions, diagrams for features.

**Naming**: `{topic}.md`, `{topic}-diagram.png`

**Git**: Committed to repository

**Lifecycle**: Permanent documentation

**Structure**:
```
.notes/
├── breadcrumb-design.md
├── sidebar-state-management.md
├── auth-flow-diagram.png
├── api-integration-notes.md
└── performance-considerations.md
```

**What to document**:
- Design decisions and rationale
- Complex state management flows
- API integration details
- Performance considerations
- Known issues or limitations

**When to use**:
- ✅ Documenting complex features
- ✅ Recording design decisions
- ✅ Explaining non-obvious code
- ✅ Architecture diagrams
- ✅ Feature-specific notes

## Build Configuration

### Update `.gitignore`

```gitignore
# Development artifacts
**/scratch/
**/.scratch/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### Update `tsconfig.json`

```json
{
  "compilerOptions": {
    // ... existing options
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "scratch",
    "examples",
    ".notes",
    "**/*.example.tsx",
    "**/*.example.ts"
  ]
}
```

### Update `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  cacheDir: '.vite',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Explicitly exclude example files from build
      external: (id) => {
        return id.includes('/examples/') || 
               id.includes('/scratch/') ||
               id.includes('/.notes/') ||
               id.endsWith('.example.tsx') ||
               id.endsWith('.example.ts');
      }
    }
  },
  server: {
    port: 6170,
  },
})
```

## File Naming Conventions

### Production Files
- Components: `ComponentName.tsx`
- Hooks: `useHookName.ts`
- Services: `serviceName.ts`
- Tests: `ComponentName.test.tsx`

### Development Artifacts
- Examples: `feature-name.example.tsx`
- Prototypes: `prototype-feature-name.tsx` (in `scratch/`)
- Scratch: `test-something.tsx` (in `scratch/`)
- Notes: `feature-description.md` (in `.notes/`)

## Migration Guide

### Moving Existing Artifacts

**Current problematic structure**:
```
src/features/dashboard/
├── hooks/
│   ├── BreadcrumbTest.tsx          ❌ Test component
│   ├── README.breadcrumbs.md       ❌ README in src
│   └── use-breadcrumbs.ts          ✅ Production code
├── examples/
│   └── test-sidebar-expansion.tsx  ❌ In src
```

**Fixed structure**:
```
src/features/dashboard/
└── hooks/
    └── use-breadcrumbs.ts          ✅ Only production code

examples/dashboard/
├── sidebar-expansion.example.tsx   ✅ Committed example
└── breadcrumb-usage.example.tsx    ✅ Shows how to use hook

.notes/
└── breadcrumb-design.md            ✅ Design documentation

scratch/
└── breadcrumb-prototype.tsx        ✅ Temporary (if needed)
```

### Step-by-Step Migration

1. **Create new directories** (if they don't exist):
   ```bash
   mkdir -p scratch examples .notes
   ```

2. **Move example files**:
   ```bash
   # Move committed examples
   git mv src/features/dashboard/examples/*.tsx examples/dashboard/
   
   # Or if truly temporary, just delete them
   rm src/features/dashboard/examples/test-*.tsx
   ```

3. **Move documentation**:
   ```bash
   git mv src/features/dashboard/hooks/README.breadcrumbs.md .notes/breadcrumb-design.md
   ```

4. **Move test components**:
   ```bash
   # If you want to keep them as examples:
   git mv src/features/dashboard/hooks/BreadcrumbTest.tsx examples/dashboard/breadcrumb-usage.example.tsx
   
   # Or if temporary, just delete:
   rm src/features/dashboard/hooks/BreadcrumbTest.tsx
   ```

5. **Update imports** in moved files if necessary

6. **Verify build**:
   ```bash
   npm run build
   ```

## Best Practices

### DO ✅

- **Use `scratch/` freely** - It's gitignored, so experiment without fear
- **Commit useful examples** to `examples/` for the team
- **Document complex features** in `.notes/`
- **Clean up regularly** - Delete old scratch files
- **Name examples clearly** - Use `.example.tsx` suffix
- **Add README files** to `examples/` directories
- **Reference examples in code comments** when useful

### DON'T ❌

- **Don't commit to `scratch/`** - It should be gitignored
- **Don't put examples in `src/`** - They'll be bundled
- **Don't mix example code with production code**
- **Don't leave TODO comments** - Use `.notes/` for longer-term notes
- **Don't hardcode API keys** even in scratch files (use `.env`)
- **Don't create `test-*.tsx` files in `src/`** (use `.test.tsx` or move to `scratch/`)

## Integration with Development Workflow

### During Feature Development

1. **Prototype in `scratch/`**:
   ```bash
   # Create a quick prototype
   touch scratch/new-feature-prototype.tsx
   # Experiment freely, no need to commit
   ```

2. **Create tests in `src/`**:
   ```bash
   # Proper test files
   touch src/features/myfeature/MyComponent.test.tsx
   ```

3. **Document in `.notes/`**:
   ```bash
   # Record design decisions
   touch .notes/myfeature-design.md
   ```

4. **Create reusable example**:
   ```bash
   # Once feature is stable
   touch examples/myfeature/usage.example.tsx
   ```

### Before Committing

**Checklist**:
- [ ] Remove or move any `test-*.tsx` files from `src/`
- [ ] Move README files from `src/` to `.notes/`
- [ ] Move example components to `examples/`
- [ ] Delete temporary `scratch/` files (or keep for later)
- [ ] Verify `npm run build` works
- [ ] Check that no development artifacts are staged in git

### Code Review

Reviewers should flag:
- Files in `src/` that look like examples or tests (not `.test.tsx`)
- README files in `src/` directories
- Hardcoded test data in production code
- Components named `Test*` or `Example*` in `src/`

## Example README for scratch/

Create `scratch/README.md`:

```markdown
# Scratch Directory

This directory is for temporary development files that should NOT be committed.

## What Goes Here

- Quick prototypes
- Debugging components
- Test data
- Code experiments
- Temporary mock files

## Lifecycle

- Files here are gitignored
- Delete when done or move to `examples/` if useful
- Clean up regularly to avoid clutter

## Not For

- Production code (goes in `src/`)
- Tests (use `*.test.tsx` in `src/`)
- Permanent examples (use `examples/`)
- Documentation (use `.notes/`)
```

## Example README for examples/

Create `examples/README.md`:

```markdown
# Examples Directory

Committed examples showing how to use features and components.

## Structure

- `auth/` - Authentication and authorization examples
- `dashboard/` - Dashboard component examples
- `forms/` - Form component examples

## Naming Convention

Files should use `.example.tsx` or `.example.ts` suffix.

## Usage

Examples are excluded from production builds but committed for reference.
Use them to:
- Learn how to use complex features
- Onboard new developers
- Document best practices

## Adding Examples

1. Create in appropriate subdirectory
2. Use `.example.tsx` suffix
3. Add clear comments explaining the example
4. Update this README with link to new example
```

## Related Documentation

- [Client Overview](../overview/client/client-overview.md) - Overall client architecture
- [Feature Development Pattern](../patterns/client/feature-development-pattern.md) - Feature structure
- [Testing Conventions](./testing-conventions.md) - How to write tests

---

**Last Updated**: 2025-12-06  
**Maintained By**: Engineering Team

