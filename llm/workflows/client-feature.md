# Client Feature Workflow

Complete workflow for building a new client-side feature with API client, services, components, i18n, and routing.

## Prerequisites

Before starting, determine:
1. **Feature namespace**: Should match server namespace (e.g., `prospecting`)
2. **Which app**: web (user-facing), admin (internal), or common (shared)
3. **Server API**: Is the backend ready? (Recommended: build server first)

## File Structure Overview

```
client/{app}/src/features/{feature}/
├── api/
│   └── {entity}Api.ts           # API client
├── components/
│   └── {entity}/                # Entity-specific components
│       ├── {Entity}List.tsx
│       └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts      # Interface
│   └── {Entity}Service.ts       # Implementation
├── stores/
│   └── {entity}Store.ts         # Zustand store (if needed)
├── views/
│   ├── {Entity}Page.tsx         # Main page
│   └── {Feature}TestPage.tsx    # Development test page
├── locales/
│   ├── de.jsonc                 # German
│   ├── el.jsonc                 # Greek
│   ├── en.jsonc                 # English (primary)
│   ├── es.jsonc                 # Spanish
│   ├── fr.jsonc                 # French
│   └── index.ts                 # Locale exports
└── index.ts                     # Feature exports
```

### Which App?

| App | Use For | Location |
|-----|---------|----------|
| `web` | User-facing features | `client/web/src/features/` |
| `admin` | Internal/administrative | `client/admin/src/features/` |
| `common` | Shared components | `client/common/src/features/` |

### Create Directory Structure

```bash
mkdir -p client/{app}/src/features/{feature}/{api,components/{entity},services,views,locales}
```

---

With the structure in place, set up localization for the feature.

## Step 1: Localization Setup

### 1.1 Create Language Files

Create all 5 files in `features/{feature}/locales/`:

```jsonc
// en.jsonc
{
    // Feature-level
    "Feature Name": "Feature Name",
    "Feature description": "Feature description",

    // Entity-specific
    "Entity Name": "Entity Name",
    "Field Label": "Field Label",

    // Messages
    "Created successfully": "Created successfully",
    "Error loading": "Error loading",

    // Actions
    "Add Entity": "Add Entity",
    "Edit Entity": "Edit Entity"
}
```

Copy to other languages:

```bash
cp en.jsonc de.jsonc && cp en.jsonc el.jsonc && cp en.jsonc es.jsonc && cp en.jsonc fr.jsonc
```

### 1.1b Generate Initial Translations

Once English keys are finalized, translate values in each language file. Mark AI-generated translations for human review:

```jsonc
// de.jsonc
{
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "Feature Name": "Funktionsname",
    "Feature description": "Funktionsbeschreibung",
    "Created successfully": "Erfolgreich erstellt"
}
```

> **Review markers:** `REVIEW: AI_TRANSLATED` indicates AI-generated translations needing native speaker review. Remove the comment after verification.

### 1.2 Create Locale Index

```typescript
// locales/index.ts
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const {feature} = {
  de: { {feature}: de },
  el: { {feature}: el },
  en: { {feature}: en },
  es: { {feature}: es },
  fr: { {feature}: fr },
};
```

### 1.3 Register in App

```typescript
// {app}/src/features/locales.ts
import { {feature} } from "../features/{feature}/locales";

export const features = {
  de: { ...existing.de, ...{feature}.de },
  el: { ...existing.el, ...{feature}.el },
  en: { ...existing.en, ...{feature}.en },
  es: { ...existing.es, ...{feature}.es },
  fr: { ...existing.fr, ...{feature}.fr },
};
```

### 1.4 Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

---

Now build the API client, services, and components.

## Step 2: API Client

```typescript
// api/{entity}Api.ts
import { getModel, postModel, putModel, del, makePageQueryString, type Result } from '$/api';
import type { EntityModel, PagedResult, PagedQuery } from '$/models';

export const {entity}Api = {
  get: (id: number): Promise<Result<EntityModel, Response>> =>
    getModel<EntityModel>(`/api/{namespace}/{entity}/${id}`),

  list: (query: PagedQuery): Promise<Result<PagedResult<EntityModel>, Response>> =>
    getModel<PagedResult<EntityModel>>(
      `/api/{namespace}/{entity}${makePageQueryString(query)}`
    ),

  create: (model: Omit<EntityModel, 'id'>): Promise<Result<EntityModel, Response>> =>
    postModel(`/api/{namespace}/{entity}`, model),

  update: (model: EntityModel): Promise<Result<EntityModel, Response>> =>
    putModel(`/api/{namespace}/{entity}`, model),

  delete: (id: number): Promise<Response> =>
    del(`/api/{namespace}/{entity}/${id}`),
};
```

---

## Step 3: Service Layer

### 3.1 Service Interface

```typescript
// services/I{Entity}Service.ts
export interface I{Entity}Service {
  get(id: number): Promise<EntityModel>;
  list(query: PagedQuery): Promise<PagedResult<EntityModel>>;
  create(model: Omit<EntityModel, 'id'>): Promise<EntityModel>;
  update(model: EntityModel): Promise<EntityModel>;
  delete(id: number): Promise<void>;
}
```

### 3.2 Service Implementation

```typescript
// services/{Entity}Service.ts
import { injectable } from 'inversify';
import { {entity}Api } from '../api/{entity}Api';
import { ApiError } from '$/api';
import type { I{Entity}Service } from './I{Entity}Service';

@injectable()
export class {Entity}Service implements I{Entity}Service {
  async get(id: number): Promise<EntityModel> {
    const result = await {entity}Api.get(id);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to get');
    return result.value;
  }

  async list(query: PagedQuery): Promise<PagedResult<EntityModel>> {
    const result = await {entity}Api.list(query);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to list');
    return result.value;
  }

  async create(model: Omit<EntityModel, 'id'>): Promise<EntityModel> {
    const result = await {entity}Api.create(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to create');
    return result.value;
  }

  async update(model: EntityModel): Promise<EntityModel> {
    const result = await {entity}Api.update(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to update');
    return result.value;
  }

  async delete(id: number): Promise<void> {
    const response = await {entity}Api.delete(id);
    if (!response.ok) throw await ApiError.fromResponse(response, 'Failed to delete');
  }
}
```

### 3.3 DI Registration

```typescript
// platform/di/types.ts
export const TYPES = {
  // ... existing
  {Entity}Service: Symbol.for('{Entity}Service'),
} as const;

// platform/di/container.ts
import { {Entity}Service } from '$/features/{feature}/services/{Entity}Service';
import type { I{Entity}Service } from '$/features/{feature}/services/I{Entity}Service';

container.bind<I{Entity}Service>(TYPES.{Entity}Service)
  .to({Entity}Service)
  .inSingletonScope();
```

---

## Step 4: Components

### 4.1 List Component

```tsx
// components/{entity}/{Entity}List.tsx
import { useTranslation } from 'react-i18next';
import { useContainer } from '$/platform/di/ContainerContext';
import { TYPES } from '$/platform/di/types';
import type { I{Entity}Service } from '../../services/I{Entity}Service';

export const {Entity}List: React.FC = () => {
  const { t } = useTranslation("{feature}");
  const container = useContainer();
  const service = container.get<I{Entity}Service>(TYPES.{Entity}Service);

  const [items, setItems] = useState<EntityModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await service.list({ page: 1, limit: 10 });
      setItems(result.data);
    } catch (err) {
      setError(t("Error loading"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (items.length === 0) return <div>{t("No items found")}</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("Field Label")}</TableHead>
          <TableHead>{t("Actions", { ns: "common" })}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                {t("Edit", { ns: "common" })}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### 4.2 Form Component

```tsx
// components/{entity}/{Entity}Form.tsx
import { useTranslation } from 'react-i18next';

interface {Entity}FormProps {
  entity?: EntityModel;
  onSubmit: (data: EntityModel) => Promise<void>;
  onCancel: () => void;
}

export const {Entity}Form: React.FC<{Entity}FormProps> = ({ entity, onSubmit, onCancel }) => {
  const { t } = useTranslation("{feature}");
  const [formData, setFormData] = useState(entity || { name: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData as EntityModel);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">{t("Field Label")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {t("Save", { ns: "common" })}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel", { ns: "common" })}
          </Button>
        </div>
      </div>
    </form>
  );
};
```

---

Finally, wire up routing and navigation.

## Step 5: Routing

### 5.1 Create Pages

```tsx
// views/{Entity}Page.tsx
import { {Entity}List } from '../components/{entity}/{Entity}List';

const {Entity}Page: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("Entity Name")}</h1>
      <{Entity}List />
    </div>
  );
};

export default {Entity}Page;
```

```tsx
// views/{Feature}TestPage.tsx
const {Feature}TestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{Feature} Test Page</h1>
      
      <Card className="mb-8">
        <CardHeader><CardTitle>Test Controls</CardTitle></CardHeader>
        <CardContent>
          <Button onClick={() => console.log('test')}>Test Action</Button>
        </CardContent>
      </Card>
      
      <{Entity}List />
    </div>
  );
};

export default {Feature}TestPage;
```

### 5.2 Register Routes

```tsx
// {app}/src/routes/index.tsx
import {Entity}Page from '$/features/{feature}/views/{Entity}Page';
import {Feature}TestPage from '$/features/{feature}/views/{Feature}TestPage';

// In routes configuration
<Route path="{feature}/{entity}" element={<{Entity}Page />} />
<Route path="test/{feature}" element={<{Feature}TestPage />} />
```

### 5.3 Add Sidebar Navigation

```typescript
// {app}/src/constants/sidebar-data.ts
import { Users } from 'lucide-react';  // Choose appropriate icon

// Add to appropriate section
{
  title: "{Entity}s",
  path: "/{feature}/{entity}",
  icon: Users,
},
```

---

Write tests to verify the implementation.

## Step 6: Testing

> **Note:** Use Vitest and React Testing Library. Test files go next to components with `.test.tsx` suffix.

### Component Testing

```tsx
// components/{entity}/{Entity}List.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {Entity}List } from './{Entity}List';
import { TestProviders } from '$/test/TestProviders';

const mockService = {
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock('$/platform/di/ContainerContext', () => ({
  useContainer: () => ({
    get: () => mockService,
  }),
}));

describe('{Entity}List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockService.list.mockReturnValue(new Promise(() => {}));
    
    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders items when loaded', async () => {
    mockService.list.mockResolvedValue({
      data: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
      totalCount: 2,
    });

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    mockService.list.mockRejectedValue(new Error('API Error'));

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no items', async () => {
    mockService.list.mockResolvedValue({ data: [], totalCount: 0 });

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/no.*found/i)).toBeInTheDocument();
    });
  });
});
```

### What to Test Checklist

- [ ] **Loading states** - Shows spinner/skeleton while fetching
- [ ] **Success states** - Renders data correctly
- [ ] **Error states** - Shows error message
- [ ] **Empty states** - Shows appropriate message
- [ ] **User interactions** - Buttons, forms work
- [ ] **i18n** - Translations resolve in all locales

---

Update tracking documents to reflect completion.

## Step 7: Update Tracking Documents

| Document | Location | When to Update |
|----------|----------|----------------|
| User Stories | `doc/prd/11-roadmap/mvp-user-stories.md` | Always |
| Feature PRD | `doc/prd/06-feature-requirements/mvp/{feature}.md` | If exists |
| Current State | `doc/prd/11-roadmap/mvp-current-state.md` | For significant features |
| GitHub Issues | Via `gh` CLI | Always |

```bash
gh issue list --search "{feature}" --state open
gh issue close <number> --comment "Completed in PR #<pr-number>"
```

**NOTE: Any body text has to be in a temporary file created and removed as separate commands.**

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Final Checklist

### Structure
- [ ] Created directory structure
- [ ] Created API client
- [ ] Created service interface and implementation
- [ ] Registered service in DI

### Localization
- [ ] Created all 5 locale files (de, el, en, es, fr)
- [ ] Generated initial translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Created locale index
- [ ] Registered in features/locales.ts
- [ ] Ran duplicate checker

### Components & Routing
- [ ] Created components with useTranslation
- [ ] Created main page and test page
- [ ] Added routes
- [ ] Added sidebar navigation (if user-facing)

### Testing
- [ ] Component tests written
- [ ] Service tests written
- [ ] i18n tested with different locales

### Tracking
- [ ] User stories updated
- [ ] Feature PRD updated (if exists)
- [ ] Current state doc updated (if significant)
- [ ] GitHub issues updated

---

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
- [API Client Pattern](../patterns/client/api-client-pattern.md) - Result type handling
- [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md) - Complex state
