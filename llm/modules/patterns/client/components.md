# Client Components

> **Module**: Patterns / Client  
> **Domain**: Component development  
> **Token target**: 500-700

## Purpose

Defines patterns for API clients, services, and React components.

## Content to Include

### API Client

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

### Service Interface & Implementation

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

```typescript
// services/{Entity}Service.ts
@injectable()
export class {Entity}Service implements I{Entity}Service {
  async get(id: number): Promise<EntityModel> {
    const result = await {entity}Api.get(id);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to get');
    return result.value;
  }
  // ... other methods follow same pattern
}
```

### DI Registration

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

### Component Pattern

```tsx
// components/{entity}/{Entity}List.tsx
import { useTranslation } from 'react-i18next';
import { useContainer } from '$/platform/di/ContainerContext';
import { TYPES } from '$/platform/di/types';

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
      {/* ... */}
    </Table>
  );
};
```

### Adding to Existing Feature

When adding a component to an existing feature:

1. Check existing services—reuse if possible
2. Add translations to existing locale files
3. Follow established component patterns in the feature
4. Place in appropriate subfolder under `components/`

## Backlink

- [Client Feature Template](../../../patterns/client/client-feature-template.md) - Complete examples
- [API Client Pattern](../../../patterns/client/api-client-pattern.md) - Result type handling

