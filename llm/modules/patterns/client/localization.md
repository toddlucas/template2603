# Client Localization

> **Module**: Patterns / Client  
> **Domain**: i18n setup  
> **Token target**: 400-500

## Purpose

Defines i18n setup for new features and adding translations to existing features.

## Content to Include

### New Feature Setup

#### 1. Create Language Files

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

#### 1b. Generate Initial Translations

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

**Review markers:**
- `REVIEW: AI_TRANSLATED` - Initial translation by AI model, needs native speaker review
- Remove the comment line after human verification

**Translation priority:**
1. User-facing UI text (labels, buttons, messages)
2. Error messages
3. Tooltips and help text

#### 2. Create Locale Index

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

#### 3. Register in App

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

### Adding to Existing Feature

#### 1. Check Existing Keys First

Before adding a key, check if it exists:
- `common` namespace: Edit, Delete, Save, Cancel, Actions, Search
- `translation` namespace: Dashboard, Settings, navigation items

#### 2. Add to All 5 Files

```jsonc
// Add to en.jsonc (and other languages)
{
    // ... existing keys ...
    
    "New Component Title": "New Component Title",
    "New field label": "New field label"
}
```

#### 3. Use in Component

```tsx
const { t } = useTranslation("{feature}");
return <h1>{t("New Component Title")}</h1>;
```

### Usage Pattern

```tsx
import { useTranslation } from 'react-i18next';

const Component: React.FC = () => {
  const { t } = useTranslation("{feature}");  // Feature namespace
  
  return (
    <div>
      <h1>{t("Feature specific key")}</h1>
      <button>{t("Edit")}</button>  {/* Falls back to common */}
    </div>
  );
};
```

### Run Duplicate Checker

```bash
python bin/i18n_dupes.py -l en
```

## Backlink

- [i18n Localization Pattern](../../../patterns/client/i18n-localization-pattern.md) - Full i18n reference

