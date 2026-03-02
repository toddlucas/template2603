# Client Modification Workflow

Workflow for modifying existing client components—adding UI elements, operations, or small enhancements to existing entities.

## Prerequisites

Before starting:
1. **Identify the existing feature**: Which namespace and entity?
2. **Check existing translations**: Does the key exist in common or translation?
3. **Review existing components**: Understand patterns in use

### Decision Tree

```
What are you modifying?

├─ New UI element in existing component
│  └─ Steps: Check i18n → Add translations → Update component
│
├─ New page/view for existing entity
│  └─ Steps: Check i18n → Add translations → Create view → Add route
│
├─ New API operation for existing entity
│  └─ Steps: Add to API client → Add to service → Use in component
│
├─ New entity in existing feature
│  └─ Use client-entity workflow instead
│
└─ New feature
    └─ Use client-feature workflow instead
```

---

## Step 1: Localization

### i18n Quick Check

Before adding a translation key:

1. **Check `common` namespace** (generic UI):
   - Edit, Delete, Save, Cancel, Actions, Search, etc.

2. **Check `translation` namespace** (app-wide):
   - Dashboard, Settings, navigation items

3. **Only add to feature namespace** if truly feature-specific

### Add to All 5 Files

If key doesn't exist, add to all locale files:

```jsonc
// Add to en.jsonc
{
    // ... existing keys ...
    
    "New Component Title": "New Component Title",
    "New field label": "New field label",
    "New action button": "New action button"
}
```

### Generate Translations for New Keys

Translate the new keys in each non-English file. Mark AI-generated translations for review:

```jsonc
// Add to de.jsonc (and el, es, fr)
{
    // ... existing keys ...
    
    // REVIEW: AI_TRANSLATED - Verify translations with native speaker
    "New Component Title": "Neuer Komponententitel",
    "New field label": "Neue Feldbezeichnung",
    "New action button": "Neue Aktionsschaltfläche"
}
```

> Remove `REVIEW: AI_TRANSLATED` comment after native speaker verification.

### Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

---

With translations in place, build or update the component.

## Step 2: Component Updates

### Adding UI Element

```tsx
// In existing component
import { useTranslation } from 'react-i18next';

const ExistingComponent: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <div>
      {/* Existing content */}
      
      {/* New element */}
      <div className="mt-4">
        <h3>{t("New Component Title")}</h3>
        <Button onClick={handleNewAction}>
          {t("New action button")}
        </Button>
      </div>
    </div>
  );
};
```

### Adding New Component

```tsx
// components/{entity}/NewComponent.tsx
import { useTranslation } from 'react-i18next';

export const NewComponent: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("New Component Title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

### Adding API Operation

```typescript
// In existing api/{entity}Api.ts
export const {entity}Api = {
  // ... existing methods ...

  // New operation
  newOperation: (id: number, data: OperationData): Promise<Result<EntityModel, Response>> =>
    postModel(`/api/{namespace}/{entity}/${id}/action`, data),
};
```

```typescript
// In existing services/{Entity}Service.ts
async newOperation(id: number, data: OperationData): Promise<EntityModel> {
  const result = await {entity}Api.newOperation(id, data);
  if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to perform operation');
  return result.value;
}
```

### Creating New Page

```tsx
// views/NewView.tsx
import { useTranslation } from 'react-i18next';

const NewView: React.FC = () => {
  const { t } = useTranslation("{feature}");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("New Component Title")}</h1>
      {/* Page content */}
    </div>
  );
};

export default NewView;
```

```tsx
// Add route in {app}/src/routes/index.tsx
<Route path="{feature}/new-view" element={<NewView />} />
```

---

Update tests for the new functionality.

## Step 3: Testing

### Update Existing Tests

```tsx
// In existing test file
describe('ExistingComponent', () => {
  // ... existing tests ...

  it('renders new element', () => {
    render(
      <TestProviders>
        <ExistingComponent />
      </TestProviders>
    );

    expect(screen.getByText(/new component title/i)).toBeInTheDocument();
  });

  it('handles new action', async () => {
    render(
      <TestProviders>
        <ExistingComponent />
      </TestProviders>
    );

    const button = screen.getByRole('button', { name: /new action/i });
    await userEvent.click(button);

    // Assert expected behavior
  });
});
```

### Verify i18n Keys Resolve

```tsx
it('renders with correct translations', async () => {
  render(
    <TestProviders locale="en">
      <ExistingComponent />
    </TestProviders>
  );

  // Verify no raw translation keys are shown
  expect(screen.queryByText(/New Component Title$/)).not.toBeInTheDocument();
});
```

---

Update tracking documents.

## Step 4: Update Tracking Documents

| Document | Location |
|----------|----------|
| User Stories | `doc/prd/11-roadmap/mvp-user-stories.md` |
| GitHub Issues | Via `gh` CLI |

```bash
gh issue comment <number> --body "Added new feature to component. PR #<pr-number>"
```

**⚠️ Always confirm with the user before closing or modifying GitHub issues.**

---

## Checklist

### Localization
- [ ] Checked common namespace for existing keys
- [ ] Checked translation namespace for existing keys
- [ ] Added new keys to all 5 locale files
- [ ] Generated translations with `REVIEW: AI_TRANSLATED` marker
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

### Component
- [ ] Updated component with useTranslation("{feature}")
- [ ] Connected to existing services
- [ ] Integrated with parent component or route

### Testing
- [ ] Component tests updated
- [ ] Verified i18n keys resolve

### Tracking
- [ ] User stories updated
- [ ] GitHub issues updated

---

## Backlinks for Deep Dives

- [Client Feature Template](../patterns/client/client-feature-template.md) - Full reference
- [i18n Localization Pattern](../patterns/client/i18n-localization-pattern.md) - Comprehensive i18n
