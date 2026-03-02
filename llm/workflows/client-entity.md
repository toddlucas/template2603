# Client Entity Workflow

Workflow for adding a new entity (API client, service, components, views, translations) to an existing client feature.

## Prerequisites

Before starting:
1. **Existing feature**: Which namespace? (prospecting, orchestration, etc.)
2. **Server API**: Are the backend endpoints ready for the new entity?
3. **New entity name**: Should match server entity name
4. **Service approach**: Add to existing service or create new service class?

### Decision Tree

```
Service Organization:

├─ Entity has distinct CRUD operations
│  └─ Create new {Entity}Api and {Entity}Service
│
├─ Entity operations are part of parent workflow
│  └─ Add methods to existing parent service
│
└─ Unsure?
    └─ Prefer separate API client and service for clarity
```

## File Structure Overview

For a new entity `{entity}` in existing feature `{feature}`:

```
client/{app}/src/features/{feature}/
├── api/
│   └── {entity}Api.ts              # NEW
├── components/
│   └── {entity}/                   # NEW directory
│       ├── {Entity}List.tsx
│       └── {Entity}Form.tsx
├── services/
│   ├── I{Entity}Service.ts         # NEW
│   └── {Entity}Service.ts          # NEW
├── views/
│   └── {Entity}Page.tsx            # NEW
├── locales/
│   ├── de.jsonc                    # UPDATE (add new keys)
│   ├── el.jsonc                    # UPDATE
│   ├── en.jsonc                    # UPDATE
│   ├── es.jsonc                    # UPDATE
│   └── fr.jsonc                    # UPDATE
└── index.ts                        # UPDATE (export new entity)
```

---

## Step 1: Localization

### 1.1 Check Existing Keys First

Before adding a key, check if it exists:
- `common` namespace: Edit, Delete, Save, Cancel, Actions, Search
- `translation` namespace: Dashboard, Settings, navigation items

### 1.2 Add to All 5 Files

```jsonc
// Add to en.jsonc (and other languages)
{
    // ... existing keys ...
    
    // New entity keys
    "New Entity Name": "New Entity Name",
    "New Entity description": "New Entity description",
    "New field label": "New field label",
    "Add New Entity": "Add New Entity",
    "Edit New Entity": "Edit New Entity"
}
```

### 1.2b Generate Translations for New Keys

Translate the new keys in each non-English file. Mark AI-generated translations for review:

```jsonc
// Add to de.jsonc (and el, es, fr)
{
    // ... existing keys ...
    
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "New Entity Name": "Neuer Entitätsname",
    "New Entity description": "Beschreibung der neuen Entität",
    "Add New Entity": "Neue Entität hinzufügen"
}
```

> Remove `REVIEW: AI_TRANSLATED` comment after native speaker verification.

### 1.3 Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

---

With translations ready, build the API client and service.

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
container.bind<I{Entity}Service>(TYPES.{Entity}Service)
  .to({Entity}Service)
  .inSingletonScope();
```

---

## Step 4: Components

### 4.1 Create Component Directory

```bash
mkdir -p client/{app}/src/features/{feature}/components/{entity}
```

### 4.2 List Component

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
          <TableHead>{t("New field label")}</TableHead>
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

### 4.3 Form Component

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
          <Label htmlFor="name">{t("New field label")}</Label>
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

Wire up routing for the new entity pages.

## Step 5: Routing

### 5.1 Create Page

```tsx
// views/{Entity}Page.tsx
import { {Entity}List } from '../components/{entity}/{Entity}List';

const {Entity}Page: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("New Entity Name")}</h1>
      <{Entity}List />
    </div>
  );
};

export default {Entity}Page;
```

### 5.2 Register Routes

```tsx
// {app}/src/routes/index.tsx
import {Entity}Page from '$/features/{feature}/views/{Entity}Page';

// Add to routes configuration
<Route path="{feature}/{entity}" element={<{Entity}Page />} />
```

### 5.3 Add Sidebar Navigation (if needed)

```typescript
// {app}/src/constants/sidebar-data.ts
{
  title: "{Entity}s",
  path: "/{feature}/{entity}",
  icon: Users,
},
```

---

Write tests to verify the implementation.

## Step 6: Testing

> **Note:** Use Vitest and React Testing Library.

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

  it('renders items when loaded', async () => {
    mockService.list.mockResolvedValue({
      data: [{ id: 1, name: 'Item 1' }],
      totalCount: 1,
    });

    render(
      <TestProviders>
        <{Entity}List />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
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
});
```

### What to Test Checklist

- [ ] **Loading states** - Shows spinner while fetching
- [ ] **Success states** - Renders data correctly
- [ ] **Error states** - Shows error message
- [ ] **Empty states** - Shows appropriate message
- [ ] **i18n** - Translations resolve

---

Update tracking documents to reflect completion.

## Step 7: Update Tracking Documents

| Document | Location |
|----------|----------|
| User Stories | `doc/prd/11-roadmap/mvp-user-stories.md` |
| Feature PRD | `doc/prd/06-feature-requirements/mvp/{feature}.md` |
| GitHub Issues | Via `gh` CLI |

```bash
gh issue list --search "{entity}" --state open
gh issue close <number> --comment "Completed in PR #<pr-number>"
```

**NOTE: Any body text has to be in a temporary file created and removed as separate commands.**

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Final Checklist

### API & Service
- [ ] Created API client for new entity
- [ ] Created service interface and implementation
- [ ] Registered service in DI container

### Localization
- [ ] Added new entity keys to all 5 locale files
- [ ] Generated translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

### Components & Routing
- [ ] Created components directory for new entity
- [ ] Created list/form/detail components as needed
- [ ] Created main page for entity
- [ ] Added routes for new pages
- [ ] Added sidebar navigation (if user-facing)

### Testing
- [ ] Component tests written
- [ ] Service tests written
- [ ] i18n tested with different locales

### Tracking
- [ ] User stories updated
- [ ] Feature PRD updated (if exists)
- [ ] GitHub issues updated

---

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
- [API Client Pattern](../patterns/client/api-client-pattern.md) - Result type handling
- [Modular Zustand Store Pattern](../patterns/client/modular-zustand-store-pattern.md) - Complex state
