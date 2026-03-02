# i18n Localization Pattern

## Overview

This document describes how to add internationalization (i18n) support to new features and components in the Example client applications. Our i18n system uses **react-i18next** with a layered namespace architecture designed to minimize duplication and maximize reusability.

### Supported Languages

The system currently supports five languages:
- `de` - German (Deutsch)
- `el` - Greek (Ελληνικά)
- `en` - English (default)
- `es` - Spanish (Español)
- `fr` - French (Français)

### Key Principles

1. **Namespace Hierarchy**: Translations are organized in three layers (common → translation → feature)
2. **Automatic Fallback**: If a key isn't found in the current namespace, i18next falls back to `translation`, then `common`
3. **Promote, Don't Duplicate**: As strings become more general-purpose, promote them to higher-level namespaces
4. **All Languages Always**: Always create all 5 language files, even if initially copying from English

## Namespace Architecture

### Three-Layer Hierarchy

Our i18n system uses three levels of namespaces:

```
┌─────────────────────────────────────────────┐
│  Feature Namespaces (most specific)         │
│  - organization, identity, contacts, etc.   │
│  - Feature-specific strings only            │
└─────────────────────────────────────────────┘
                    ↓ fallback
┌─────────────────────────────────────────────┐
│  Translation Namespace (app-level)          │
│  - Menu items, page titles, common actions  │
│  - App-specific but not feature-specific    │
└─────────────────────────────────────────────┘
                    ↓ fallback
┌─────────────────────────────────────────────┐
│  Common Namespace (most generic)            │
│  - UI component labels (Edit, Delete, etc.) │
│  - Truly reusable across all apps           │
└─────────────────────────────────────────────┘
```

### When to Use Which Namespace

**Feature Namespace** (`organization`, `identity`, etc.)
- ✅ Feature-specific business terms: "Organization Name", "Manage organizations and their hierarchy"
- ✅ Feature-specific actions: "Add Child Organization", "View Members"
- ✅ Feature-specific labels: "Organization ID", "Parent Organization"

**Translation Namespace** (app default)
- ✅ Menu items: "Dashboard", "Settings", "Profile"
- ✅ Common page elements: "Search", "Filter", "Results"
- ✅ Generic actions that appear across features: "Save Changes", "Cancel", "Confirm"

**Common Namespace**
- ✅ Generic UI component text: "Edit", "Delete", "Show", "per page"
- ✅ Standard buttons and controls used across ALL client apps
- ✅ Truly generic strings with no business context

### Promotion Strategy

**Start Specific → Move to General as Needed**

1. Start with strings in feature namespaces
2. When you notice a string could be used by another feature → promote to `translation`
3. When a string becomes truly generic UI text → promote to `common`
4. Use `bin/i18n_dupes.py` to detect duplicates requiring promotion

## Adding i18n to a New Feature

Follow these steps when creating a new feature that needs localization support.

### Step 1: Create Locales Directory Structure

In your feature folder, create the locales directory with all language files:

```
features/your-feature/
  ├── api/
  ├── store/
  ├── views/
  └── locales/
      ├── de.jsonc
      ├── el.jsonc
      ├── en.jsonc
      ├── es.jsonc
      ├── fr.jsonc
      └── index.ts
```

### Step 2: Create Language Files

Create all five `.jsonc` files. Start with English (`en.jsonc`) as your reference:

**`features/your-feature/locales/en.jsonc`**
```jsonc
{
    // Fallbacks to translation namespace - commented out means use fallback
    // "Search": "Search",
    // "Actions": "Actions",

    // Feature list page
    "Manage your feature items": "Manage your feature items",
    "Search by name": "Search by name",
    "Error loading items": "Error loading items",
    "No items found": "No items found",

    // Table headers
    "Feature Name": "Feature Name",
    "Feature Code": "Feature Code",
    "Created Date": "Created Date",

    // Detail view
    "Feature Information": "Feature Information",
    "Basic details about this item": "Basic details about this item",
    "Feature ID": "Feature ID"
}
```

**Key Guidelines:**
- Use **JSONC format** (JSON with comments)
- Use comments to organize sections
- Comment out keys that should fall back to `translation` or `common` namespaces
- Use natural language for keys: `"Organization Name"` not `"orgName"` or `"org_name"`
- Keep quotes consistent (double quotes)

**For other languages**, initially you can copy `en.jsonc` content (marking for future translation):

**`features/your-feature/locales/de.jsonc`**
```jsonc
{
    // TODO: German translations
    "Manage your feature items": "Manage your feature items",
    "Search by name": "Search by name",
    // ... copy from en.jsonc initially
}
```

### Step 3: Create the Locales Index

Create `features/your-feature/locales/index.ts` to export all translations:

```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const yourFeature = {
  de: { yourFeature: de },
  el: { yourFeature: el },
  en: { yourFeature: en },
  es: { yourFeature: es },
  fr: { yourFeature: fr },
};
```

**Important**: The double nesting (`{ yourFeature: de }`) creates the namespace structure that i18next expects.

### Step 4: Register Feature in App-Level Locales

Update `src/features/locales.ts` to include your feature:

```typescript
import { identity } from "../features/identity/locales";
import { organization } from "../features/organization/locales";
import { yourFeature } from "../features/your-feature/locales";  // Add import

export const features = {
  de: { ...identity.de, ...organization.de, ...yourFeature.de },  // Add spread
  el: { ...identity.el, ...organization.el, ...yourFeature.el },
  en: { ...identity.en, ...organization.en, ...yourFeature.en },
  es: { ...identity.es, ...organization.es, ...yourFeature.es },
  fr: { ...identity.fr, ...organization.fr, ...yourFeature.fr },
};
```

### Step 5: Use Translations in Components

In your feature's views and components, use the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

const YourFeatureList = () => {
  const { t } = useTranslation("yourFeature");  // Use your feature namespace

  return (
    <div>
      <PageHeader
        title={t("Your Features")}
        subtitle={t("Manage your feature items")}
      />
      <table>
        <thead>
          <tr>
            <th>{t("Feature Name")}</th>
            <th>{t("Feature Code")}</th>
            <th>{t("Actions")}</th>  {/* Falls back to translation/common */}
          </tr>
        </thead>
      </table>
    </div>
  );
};
```

**Key Points:**
- Pass your feature name as the namespace: `useTranslation("yourFeature")`
- Use `t("Key")` to translate strings
- Keys not found in your namespace automatically fall back to `translation` and `common`
- TypeScript will provide autocomplete for all available keys (via `i18next.d.ts`)

## Adding Localized Components to Existing Features

When a feature already has i18n support and you're adding new views or components:

### Simple Process

1. **Add keys to existing language files**
   - Edit all 5 `.jsonc` files in `features/your-feature/locales/`
   - Keep keys organized with comments

2. **Use in your component**
   - Import and use `useTranslation("yourFeature")`

### Example: Adding a New Table Column

**`features/organization/locales/en.jsonc`**
```jsonc
{
    // Existing keys...
    "Organization Name": "Organization Name",
    "Code": "Code",
    
    // New column - add this
    "Last Updated": "Last Updated",
}
```

**`features/organization/views/OrganizationList.tsx`**
```tsx
const { t } = useTranslation("organization");

// In your column definitions
const columns = [
  { header: t("Organization Name"), accessorKey: "name" },
  { header: t("Code"), accessorKey: "code" },
  { header: t("Last Updated"), accessorKey: "updatedAt" },  // New column
];
```

### Before and After Check

**Before adding new keys**, check if they already exist:
1. Check `common` namespace: `client/common/src/locales/en.jsonc`
2. Check `translation` namespace: `locales/translation/en.jsonc`
3. Only create new keys if they don't exist elsewhere

## App-Level Components (Translation Namespace)

For components that aren't part of a specific feature but are app-specific:

### File Locations

**Admin App:**
- `src/locales/translation/en.jsonc` - Main app translations
- `src/locales/sample/en.jsonc` - Sample/template content

**Web App:**
- `src/locales/translation/en.jsonc` - Main app translations

### Usage

Use `useTranslation()` with no parameter (translation is the default) or explicitly:

```tsx
import { useTranslation } from 'react-i18next';

const AppNavigation = () => {
  const { t } = useTranslation("translation");  // Explicit
  // or
  const { t } = useTranslation();  // Implicit - defaults to "translation"

  return (
    <nav>
      <Link to="/dashboard">{t("Dashboard")}</Link>
      <Link to="/settings">{t("Settings")}</Link>
    </nav>
  );
};
```

### When to Use Translation Namespace

Use the `translation` namespace for:
- Menu items and navigation labels
- Page titles that appear across the app
- Common actions that aren't feature-specific but aren't generic enough for `common`
- App-specific terminology

## Common Library Components

For truly reusable UI components shared across **all client apps** (admin, web, etc.):

### File Location

**Common Library:**
```
client/common/src/locales/
  ├── de.jsonc
  ├── el.jsonc
  ├── en.jsonc
  ├── es.jsonc
  ├── fr.jsonc
  └── index.ts
```

### Example: Common Library Locales

**`client/common/src/locales/en.jsonc`**
```jsonc
{
    "Menu": "Menu",

    // Buttons
    "Edit": "Edit",
    "Delete": "Delete",
    "Save": "Save",
    "Cancel": "Cancel",

    // Table components
    "Show": "Show",
    "per page": "per page",
    "Next": "Next",
    "Previous": "Previous"
}
```

**`client/common/src/locales/index.ts`**
```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const common = {
  de: { common: de },
  el: { common: el },
  en: { common: en },
  es: { common: es },
  fr: { common: fr },
};
```

### Usage in Common Components

**`client/common/src/components/tables/PageSizeSelector.tsx`**
```tsx
import { useTranslation } from 'react-i18next';

const PageSizeSelector = ({ pageSize, onPageSizeChange, options = [5, 10, 25, 50] }) => {
  const { t } = useTranslation("common");  // Use common namespace
  
  return (
    <div>
      <span>{t("Show")}:</span>
      <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span>{t("per page")}</span>
    </div>
  );
};
```

### When to Use Common Namespace

Use the `common` namespace for:
- Generic UI component labels (Edit, Delete, Save, Cancel)
- Table/pagination controls
- Standard form labels
- Truly generic strings with zero business context
- Anything that would be identical across admin, web, and any future client apps

## Avoiding Duplicates: The Promotion Strategy

### The Problem

As features grow, you'll find the same strings appearing in multiple places:
- "Edit" button in every feature
- "Search" placeholder in multiple lists
- "Actions" column header everywhere

### The Solution: Promote Strings Up the Hierarchy

**Workflow:**

1. **Start Specific**: Create strings in feature namespaces initially
2. **Detect Duplicates**: Use `bin/i18n_dupes.py` to find duplicates
3. **Promote**: Move duplicated strings to appropriate higher namespace
4. **Update References**: Comment out keys in feature files to use fallback
5. **Verify**: Run duplicate checker again

### Using the Duplicate Detection Tool

**Location**: `bin/i18n_dupes.py`

**Basic Usage:**

```bash
# From repository root
python bin/i18n_dupes.py

# Analyze specific directory
python bin/i18n_dupes.py --dir main/src/client/admin

# Check only English translations
python bin/i18n_dupes.py --locale en

# Exclude certain files
python bin/i18n_dupes.py --exclude "*/sample/*"

# Check multiple locales
python bin/i18n_dupes.py -l en -l de
```

**Output Example:**

```
Found 15 translation file(s) to analyze...
Analyzing 5 locale(s): de, el, en, es, fr

🔍 DUPLICATES ACROSS FILES (PER LOCALE):

🌐 Locale: EN
──────────────────────────────────────────────────

  ⚠️  "Edit" appears in 3 file(s):
     - Actions in main/src/client/admin/src/features/organization/locales/en.jsonc
     - Actions in main/src/client/admin/src/features/identity/locales/en.jsonc
     - Edit in main/src/client/common/src/locales/en.jsonc
```

### How to Resolve Duplicates

**Example: "Edit" Button Duplicate**

**Before (Duplicated):**

`features/organization/locales/en.jsonc`:
```jsonc
{
    "Edit": "Edit",
    "Organization Name": "Organization Name"
}
```

`features/identity/locales/en.jsonc`:
```jsonc
{
    "Edit": "Edit",
    "User Name": "User Name"
}
```

**After (Promoted to Common):**

`client/common/src/locales/en.jsonc`:
```jsonc
{
    "Edit": "Edit",
    "Delete": "Delete"
}
```

`features/organization/locales/en.jsonc`:
```jsonc
{
    // Fallback to common namespace
    // "Edit": "Edit",
    
    "Organization Name": "Organization Name"
}
```

`features/identity/locales/en.jsonc`:
```jsonc
{
    // Fallback to common namespace
    // "Edit": "Edit",
    
    "User Name": "User Name"
}
```

**Components continue to work** due to automatic fallback! No code changes needed:

```tsx
const { t } = useTranslation("organization");
// t("Edit") still works - falls back to common namespace automatically
```

## Best Practices

### File Organization

✅ **DO:**
- Always create all 5 language files when starting a feature
- Use comments to organize sections within JSONC files
- Comment out keys that should fall back to higher namespaces
- Keep keys alphabetically or logically grouped

❌ **DON'T:**
- Create only English translations
- Mix different languages in one file
- Use nested JSON objects (keep it flat)

### Key Naming

✅ **DO:**
- Use natural language: `"Organization Name"`, `"Search by name"`
- Use sentence case or title case as appropriate
- Be descriptive and specific within feature context

❌ **DON'T:**
- Use camelCase: `"organizationName"`
- Use snake_case: `"organization_name"`
- Use cryptic abbreviations: `"orgNm"`

### Checking for Existing Keys

**Before creating a new translation key:**

1. Check common namespace: `client/common/src/locales/en.jsonc`
2. Check translation namespace: `locales/translation/en.jsonc`
3. Search codebase for similar strings
4. Run duplicate checker: `python bin/i18n_dupes.py -l en`

### Comments in JSONC

Use comments effectively:

```jsonc
{
    // Fallbacks to translation namespace
    // "Search": "Search",
    // "Actions": "Actions",

    // Page header
    "Manage organizations": "Manage organizations",
    "Organizations hierarchy view": "Organizations hierarchy view",

    // Table columns
    "Organization Name": "Organization Name",
    "Code": "Code",
    "Status": "Status",

    // Detail view
    "Organization Information": "Organization Information",
    "Organization Details": "Organization Details"
}
```

### TypeScript Integration

The `i18next.d.ts` file provides type safety:

```typescript
import { defaultNS } from "./i18n";
import { resources } from "./locales";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: typeof resources["en"];
  }
}
```

This gives you:
- Autocomplete for translation keys
- Type checking for namespace names
- Compile-time errors for missing keys

## Complete Examples

### Example 1: Adding i18n to a New "Contacts" Feature

**Step-by-step walkthrough:**

**1. Create directory structure:**
```
features/contacts/
  ├── api/
  ├── store/
  ├── views/
  └── locales/
      ├── de.jsonc
      ├── el.jsonc
      ├── en.jsonc
      ├── es.jsonc
      ├── fr.jsonc
      └── index.ts
```

**2. Create `features/contacts/locales/en.jsonc`:**
```jsonc
{
    // Fallbacks to translation/common
    // "Edit": "Edit",
    // "Delete": "Delete",
    // "Actions": "Actions",

    // Contacts list page
    "Manage your contacts": "Manage your contacts",
    "Search by contact name or email": "Search by contact name or email",
    "Error loading contacts": "Error loading contacts",
    "No contacts found": "No contacts found",

    // Table headers
    "Contact Name": "Contact Name",
    "Company": "Company",
    "Email Address": "Email Address",
    "Phone Number": "Phone Number",
    "Last Contacted": "Last Contacted",

    // Detail view
    "Contact Information": "Contact Information",
    "Basic information about this contact": "Basic information about this contact",
    "Contact ID": "Contact ID",

    // Actions
    "Add Contact": "Add Contact",
    "Send Email": "Send Email",
    "Schedule Call": "Schedule Call"
}
```

**3. Copy to other language files (initially):**
```bash
# Copy en.jsonc to other languages (mark for translation later)
cp features/contacts/locales/en.jsonc features/contacts/locales/de.jsonc
cp features/contacts/locales/en.jsonc features/contacts/locales/el.jsonc
cp features/contacts/locales/en.jsonc features/contacts/locales/es.jsonc
cp features/contacts/locales/en.jsonc features/contacts/locales/fr.jsonc
```

**4. Create `features/contacts/locales/index.ts`:**
```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const contacts = {
  de: { contacts: de },
  el: { contacts: el },
  en: { contacts: en },
  es: { contacts: es },
  fr: { contacts: fr },
};
```

**5. Update `src/features/locales.ts`:**
```typescript
import { identity } from "../features/identity/locales";
import { organization } from "../features/organization/locales";
import { contacts } from "../features/contacts/locales";

export const features = {
  de: { ...identity.de, ...organization.de, ...contacts.de },
  el: { ...identity.el, ...organization.el, ...contacts.el },
  en: { ...identity.en, ...organization.en, ...contacts.en },
  es: { ...identity.es, ...organization.es, ...contacts.es },
  fr: { ...identity.fr, ...organization.fr, ...contacts.fr },
};
```

**6. Use in component `features/contacts/views/ContactList.tsx`:**
```tsx
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '$/components/ui/button';
import { useContactStore } from '../store';

const ContactList = () => {
  const { t } = useTranslation("contacts");
  const { contacts, fetchContacts } = useContactStore();

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div>
      <PageHeader
        title={t("Contacts")}  {/* Falls back to translation */}
        subtitle={t("Manage your contacts")}
      >
        <Button>{t("Add Contact")}</Button>
      </PageHeader>

      <table>
        <thead>
          <tr>
            <th>{t("Contact Name")}</th>
            <th>{t("Company")}</th>
            <th>{t("Email Address")}</th>
            <th>{t("Phone Number")}</th>
            <th>{t("Actions")}</th>  {/* Falls back to common */}
          </tr>
        </thead>
        <tbody>
          {contacts.map(contact => (
            <tr key={contact.id}>
              <td>{contact.name}</td>
              <td>{contact.company}</td>
              <td>{contact.email}</td>
              <td>{contact.phone}</td>
              <td>
                <Button variant="ghost">{t("Edit")}</Button>  {/* Falls back to common */}
                <Button variant="ghost">{t("Delete")}</Button>  {/* Falls back to common */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactList;
```

### Example 2: Adding a View to Existing Feature

Adding an "OrganizationArchive" view to the existing organization feature:

**1. Add keys to `features/organization/locales/en.jsonc`:**
```jsonc
{
    // Existing keys...
    "Organization Name": "Organization Name",
    "Code": "Code",

    // Archive view - NEW SECTION
    "Archived Organizations": "Archived Organizations",
    "View archived and deleted organizations": "View archived and deleted organizations",
    "Restore Organization": "Restore Organization",
    "Permanently Delete": "Permanently Delete",
    "Archived Date": "Archived Date",
    "Archived By": "Archived By"
}
```

**2. Add to other language files (de.jsonc, el.jsonc, etc.)**

**3. Create component `features/organization/views/OrganizationArchive.tsx`:**
```tsx
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/layout/PageHeader';

const OrganizationArchive = () => {
  const { t } = useTranslation("organization");  // Same namespace

  return (
    <div>
      <PageHeader
        title={t("Archived Organizations")}
        subtitle={t("View archived and deleted organizations")}
      />
      
      <table>
        <thead>
          <tr>
            <th>{t("Organization Name")}</th>  {/* Existing key */}
            <th>{t("Code")}</th>  {/* Existing key */}
            <th>{t("Archived Date")}</th>  {/* New key */}
            <th>{t("Archived By")}</th>  {/* New key */}
            <th>{t("Actions")}</th>  {/* Falls back to common */}
          </tr>
        </thead>
      </table>
    </div>
  );
};

export default OrganizationArchive;
```

### Example 3: Creating a Reusable Common Component

Creating a generic search input component:

**1. Add to `client/common/src/locales/en.jsonc`:**
```jsonc
{
    "Menu": "Menu",
    "Edit": "Edit",
    "Delete": "Delete",
    
    // Search component
    "Search": "Search",
    "Clear search": "Clear search",
    "No results": "No results"
}
```

**2. Create component `client/common/src/components/SearchInput.tsx`:**
```tsx
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => {
  const { t } = useTranslation("common");

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t("Search")}
        className="pl-10 pr-10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label={t("Clear search")}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X />
        </button>
      )}
    </div>
  );
};
```

**3. Use in any feature:**
```tsx
import { SearchInput } from '$/components/SearchInput';

// In organization feature
const { t } = useTranslation("organization");
<SearchInput 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder={t("Search by organization name")}
/>

// In contacts feature
const { t } = useTranslation("contacts");
<SearchInput 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder={t("Search by contact name or email")}
/>
```

## Troubleshooting

### Translation Key Not Found

**Problem:** Console warning: `Translation key "MyKey" not found in namespace "myfeature"`

**Solutions:**
1. Check the key exists in `features/myfeature/locales/en.jsonc`
2. Verify the namespace name matches the feature export name
3. Check `features/locales.ts` includes your feature
4. Ensure `locales/index.ts` in your feature exports correctly

### Autocomplete Not Working

**Problem:** No TypeScript autocomplete for translation keys

**Solutions:**
1. Check `i18next.d.ts` exists in `src/` directory
2. Verify `i18next.d.ts` imports resources correctly
3. Restart TypeScript server in your editor
4. Rebuild the project: `npm run build`

### Fallback Not Working

**Problem:** Keys in common/translation aren't accessible from feature namespace

**Solutions:**
1. Check `i18n.ts` configuration includes fallback:
   ```typescript
   fallbackNS: ["translation", "common"],
   ```
2. Verify the key exists in the fallback namespace
3. Check namespace export structure is correct

### Duplicate Strings Not Detected

**Problem:** Duplicate checker doesn't find obvious duplicates

**Solutions:**
1. Run with verbose output: `python bin/i18n_dupes.py -l en`
2. Check you're analyzing the correct directory
3. Ensure files aren't excluded by `--exclude` patterns
4. Remember: exact match required (case-sensitive)

### Changes Not Reflecting

**Problem:** Updated translations don't appear in the app

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Restart dev server
4. Check for JSONC syntax errors in language files
5. Verify imports are correct in `locales/index.ts`

### Namespace Resolution Issues

**Problem:** Component shows wrong translations or English only

**Solutions:**
1. Check you're using correct namespace in `useTranslation("namespaceName")`
2. Verify namespace name matches the export in feature's `locales/index.ts`
3. Check resources are merged correctly in `locales/index.ts` at app level
4. Look for typos in namespace names (case-sensitive)

## Quick Reference Checklists

### ✅ New Feature i18n Setup Checklist

Setting up i18n for a brand new feature:

- [ ] Create `features/your-feature/locales/` directory
- [ ] Create all 5 language files: `de.jsonc`, `el.jsonc`, `en.jsonc`, `es.jsonc`, `fr.jsonc`
- [ ] Create `features/your-feature/locales/index.ts` with proper exports
- [ ] Add feature import to `src/features/locales.ts`
- [ ] Spread feature into all 5 language objects in `features/locales.ts`
- [ ] Use `useTranslation("yourFeature")` in components
- [ ] Check for existing keys in `common` and `translation` before creating new ones
- [ ] Add comments to organize sections in JSONC files
- [ ] Comment out keys that should fall back to higher namespaces
- [ ] Run duplicate checker: `python bin/i18n_dupes.py -l en`

### ✅ Adding Keys to Existing Feature Checklist

Adding translations to a feature that already has i18n:

- [ ] Check if key exists in `common` namespace first
- [ ] Check if key exists in `translation` namespace second
- [ ] Add new keys to `en.jsonc` first (as reference)
- [ ] Copy keys to other 4 language files (`de`, `el`, `es`, `fr`)
- [ ] Add comments to organize new keys
- [ ] Use `t("Your New Key")` in component with appropriate namespace
- [ ] Test in browser with language switcher
- [ ] Run duplicate checker: `python bin/i18n_dupes.py -l en`

### ✅ Before Committing Checklist

Run these checks before committing i18n changes:

- [ ] All 5 language files updated (even if copying English initially)
- [ ] No duplicate strings across files: `python bin/i18n_dupes.py`
- [ ] Keys use natural language, not camelCase/snake_case
- [ ] Comments organize sections clearly
- [ ] Generic strings promoted to appropriate namespace level
- [ ] TypeScript compiles without errors
- [ ] App runs and switches languages correctly
- [ ] No console warnings about missing translations
- [ ] Followed project code style and conventions

### ✅ Promoting Strings Checklist

Moving duplicated strings to higher namespaces:

- [ ] Run duplicate checker to identify duplicates
- [ ] Determine appropriate target namespace (`common` vs `translation`)
- [ ] Add key to target namespace in all 5 languages
- [ ] Comment out key in source feature files (all 5 languages)
- [ ] Add comment explaining fallback
- [ ] Test that components still work (due to automatic fallback)
- [ ] Re-run duplicate checker to verify fix
- [ ] Update any documentation referencing the moved keys

## Content Locale (Dual Locale System)

Some features need to display content in a different language than the UI. For example, a Greek-speaking user might create an email sequence targeting English-speaking recipients. In this case:
- **UI Locale**: Greek (buttons, labels, validation messages)
- **Content Locale**: English (email placeholders, suggested content, AI prompts)

### Architecture

The content locale system adds a second namespace suffix convention:

```
┌─────────────────────────────────────────────┐
│  Feature Namespace (UI strings)             │
│  e.g., "orchestration"                      │
│  - Labels, buttons, validation messages     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Feature Content Namespace                  │
│  e.g., "orchestration-content"              │
│  - Placeholder text, suggested content      │
│  - Insertable text (suggestions)            │
│  - AI prompt examples                       │
└─────────────────────────────────────────────┘
```

### Folder Structure

Content locale files live in a `content/` subfolder within the feature's locales:

```
features/orchestration/locales/
├── en.jsonc                    # UI strings (namespace: "orchestration")
├── el.jsonc
├── content/                    # Content strings (namespace: "orchestration-content")
│   ├── en.jsonc
│   ├── el.jsonc
│   ├── de.jsonc
│   ├── es.jsonc
│   ├── fr.jsonc
│   └── index.ts
└── index.ts
```

### Content Locale Files

**`features/orchestration/locales/content/en.jsonc`**
```jsonc
{
    // Email step content (insertable/example text)
    "Subject placeholder": "e.g., Quick question about {{company}}",
    "Email body placeholder": "Hi {{firstName}},\n\nI wanted to reach out because...",
    "AI context placeholder": "Describe what you want to communicate...",

    // Task step content
    "Task placeholder": "e.g., Call the contact to follow up on the proposal",

    // Suggested tasks (text that gets inserted when clicked)
    "suggested.call": "Call the contact to follow up",
    "suggested.linkedin": "Send a personalized LinkedIn message",
    "suggested.meeting": "Schedule a meeting"
}
```

### Content Locale Index

**`features/orchestration/locales/content/index.ts`**
```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

// Export with "-content" suffix namespace
export const orchestrationContent = {
  de: { "orchestration-content": de },
  el: { "orchestration-content": el },
  en: { "orchestration-content": en },
  es: { "orchestration-content": es },
  fr: { "orchestration-content": fr },
};
```

### Feature Locale Index (Updated)

**`features/orchestration/locales/index.ts`**
```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";
import { orchestrationContent } from "./content";

export const orchestration = {
  de: { orchestration: de, ...orchestrationContent.de },
  el: { orchestration: el, ...orchestrationContent.el },
  en: { orchestration: en, ...orchestrationContent.en },
  es: { orchestration: es, ...orchestrationContent.es },
  fr: { orchestration: fr, ...orchestrationContent.fr },
};
```

### Using the Content Locale Hook

Use `useContentTranslation` for content strings that should follow the content locale:

```tsx
import { useTranslation } from 'react-i18next';
import { useContentTranslation } from '$/hooks';

const EmailStepForm = ({ contentLocale }: { contentLocale?: string }) => {
  // UI strings - follows user's UI locale
  const { t } = useTranslation("orchestration");
  
  // Content strings - follows the specified content locale
  // The "-content" suffix is added automatically
  const { tc } = useContentTranslation("orchestration", contentLocale);

  return (
    <div>
      {/* UI label - displays in user's language */}
      <Label>{t('Subject')}</Label>
      
      {/* Placeholder - displays in content language */}
      <Input placeholder={tc('Subject placeholder')} />
      
      {/* UI hint - displays in user's language */}
      <p>{t('Subject hint')}</p>
    </div>
  );
};
```

### When to Use Content Locale

**Use `t()` (UI locale) for:**
- Labels, headings, titles
- Buttons and actions
- Validation messages
- Help text explaining how to use the feature
- Status indicators

**Use `tc()` (content locale) for:**
- Placeholder text (examples of what to type)
- Suggested content buttons (text that will be inserted)
- Template examples
- AI prompt context examples
- Anything that will become part of the user's content

### Storing Content Locale

The content locale is typically stored on the entity being edited (e.g., `Sequence.contentLocale`):

```typescript
// Server model (C#)
public class SequenceModel {
    // ... other fields
    
    /// <summary>
    /// The content locale for this sequence (e.g., "en", "es").
    /// When null, defaults to team content locale (or "en" if not set).
    /// </summary>
    [StringLength(10)]
    public string? ContentLocale { get; set; }
}
```

### Default Content Locale

The `useContentTranslation` hook uses `DEFAULT_CONTENT_LOCALE` ("en") when no content locale is specified:

```typescript
// From $/hooks/useContentTranslation.ts
export const DEFAULT_CONTENT_LOCALE = "en";

export const useContentTranslation = (
  namespace: string,
  contentLocale?: string | null
) => {
  const { i18n } = useTranslation();
  const resolvedLocale = contentLocale || DEFAULT_CONTENT_LOCALE;
  const tc = i18n.getFixedT(resolvedLocale, `${namespace}-content`);
  return { tc, contentLocale: resolvedLocale };
};
```

### Language Name Localization

To display language names in the UI locale (e.g., showing "Greek" in English UI vs "Ελληνικά" in Greek UI), use the `language.{code}` keys in the common namespace:

**`client/common/src/locales/en.jsonc`**
```jsonc
{
    // Language names (in English)
    "language.en": "English",
    "language.el": "Greek",
    "language.es": "Spanish",
    "language.fr": "French",
    "language.de": "German"
}
```

**`client/common/src/locales/el.jsonc`**
```jsonc
{
    // Language names (in Greek)
    "language.en": "Αγγλικά",
    "language.el": "Ελληνικά",
    "language.es": "Ισπανικά",
    "language.fr": "Γαλλικά",
    "language.de": "Γερμανικά"
}
```

Use in components:

```tsx
// Display language name in current UI locale
const { t } = useTranslation("common");
<span>{t(`language.${sequence.contentLocale || 'en'}`)}</span>
```

Or use the `LanguageSelect` component which handles this automatically:

```tsx
import { LanguageSelect } from '$/components';
import { availableLanguages } from '$/constants/languages';

<LanguageSelect
  languages={availableLanguages}
  value={contentLocale}
  onValueChange={setContentLocale}
  placeholder={t('Select a language')}
/>
```

### Content Locale Checklist

When adding content locale support to a feature:

- [ ] Create `locales/content/` folder in feature
- [ ] Create all 5 content locale files (de, el, en, es, fr .jsonc)
- [ ] Create `locales/content/index.ts` with `-content` namespace suffix
- [ ] Update `locales/index.ts` to spread content namespace
- [ ] Add `contentLocale` field to the entity model (server + client)
- [ ] Add content locale column mapping in entity's `OnModelCreating`
- [ ] Add content locale to mapper's `UpdateFrom` method
- [ ] Create database migration for new column
- [ ] Add language selector UI to the form
- [ ] Use `useContentTranslation` hook in components with content strings
- [ ] Add `language.{code}` keys to common locales if not present

## App-Level Lazy Loading (Modular Architecture)

For applications using the modular app architecture (with separate apps like Example, Mail, etc.), translations can be lazy-loaded per app to reduce initial bundle size.

### Architecture Overview

**Current Implementation:**
- Shared translations (common, auth, frame) load upfront
- App-specific translations (example features, mail features) load when user switches to that app
- Translations are bundled with their associated app routes

**Benefits:**
- Reduced initial bundle by 30-50KB (compressed)
- Better code-splitting alignment with lazy routes
- Users only download translations for apps they actually use

### Implementation

See [i18n-lazy-loading-plan.md](../../overview/client/apps/i18n-lazy-loading-plan.md) for:
- Complete implementation plan
- Code examples
- Testing strategy
- Performance impact analysis

### Key Differences

When using app-level lazy loading:

1. **Feature locale aggregation:**
   ```typescript
   // apps/example/locales/index.ts
   export const exampleLocales = {
     en: { ...analytics.en, ...prospecting.en, ...orchestration.en },
     // ... other languages
   };
   ```

2. **App config with loadLocales:**
   ```typescript
   // apps/example/index.ts
   export const exampleApp: AppConfig = {
     id: 'example',
     loadLocales: async () => {
       const { exampleLocales } = await import('#example/locales');
       await loadAppLocales('example', exampleLocales);
     },
   };
   ```

3. **Automatic loading on app switch:**
   - AppContext calls `app.loadLocales()` when switching apps
   - Once loaded, translations are cached in i18next
   - No reload needed on subsequent app switches

### Feature Development

When adding features to an app with lazy-loaded locales:
- Create feature locales as normal (follow this guide)
- Add feature to app's `locales/index.ts` aggregator
- App will automatically include feature translations when loaded

## Related Documentation

- [Feature Development Pattern](./feature-development-pattern.md) - Full feature development workflow
- [Understanding the Codebase](../../start/understanding-codebase.md) - Architecture overview
- [New Feature Guide](../../start/new-feature.md) - Complete feature creation process
- [App-Level i18n Lazy Loading Plan](../../overview/client/apps/i18n-lazy-loading-plan.md) - Modular app translation loading

## Summary

**Remember:**
1. **Start specific** - Create strings in feature namespaces initially
2. **Use all 5 languages** - Always create de, el, en, es, fr files
3. **Check for existing keys** - Look in common and translation before creating new ones
4. **Promote duplicates** - Move general-purpose strings to higher namespaces
5. **Use the tool** - Run `i18n_dupes.py` regularly to catch duplicates
6. **Let fallback work** - Comment out keys in features that exist in common/translation
7. **Natural language keys** - Use readable strings, not code-style identifiers
8. **Separate UI from content** - Use content locale for insertable text, placeholders, and suggestions

The i18n system is designed to be simple and maintainable. Follow these patterns and your translations will be organized, reusable, and easy to maintain across the application.

