# Client Feature Template

## Overview

This is a comprehensive, copy-paste-ready template for building new client features. It consolidates all patterns into a single walkthrough, covering both new feature setup and adding components to existing features.

**Time estimate**: 
- New feature: 2-3 hours
- Adding to existing feature: 30-60 minutes

## Prerequisites

Before starting, determine:
1. **Is this a new feature or addition to existing?**
   - New feature → Follow full setup (Steps 1-8)
   - Adding to existing → Skip to "Adding to Existing Feature" section
2. **Feature namespace**: Should match server namespace (e.g., `prospecting`, `orchestration`)
3. **Which app?**: 
   - `web` — User-facing features (contacts, sequences, campaigns, inbox)
   - `admin` — Internal/administrative features (user management, system config)
   - `common` — Shared components used by both apps

> **Note**: Feature names should match server namespaces to reduce folder proliferation. For example, `Contact` entities on the server live in the `Prospecting` namespace, so the client feature is `prospecting/` containing contact components.

---

## Part 1: New Feature Setup

### File Structure

For a new feature called `prospecting` (containing contacts, sequences, etc.):

```
client/common/src/features/prospecting/
├── api/
│   ├── contactsApi.ts           # Contacts API client
│   ├── sequencesApi.ts          # Sequences API client (future)
│   └── types.ts                 # API types (if not using TypeGen)
├── components/
│   ├── contacts/                # Contact-specific components
│   │   ├── ContactCard.tsx
│   │   ├── ContactList.tsx
│   │   └── ContactForm.tsx
│   └── sequences/               # Sequence components (future)
├── services/
│   ├── IContactsService.ts      # Service interface
│   └── ContactsService.ts       # Service implementation
├── stores/
│   └── contactsStore.ts         # Zustand store (if needed)
├── views/
│   ├── ContactsPage.tsx         # Contacts page
│   ├── ProspectingTestPage.tsx  # Development test page
│   └── SequencesPage.tsx        # Sequences page (future)
├── locales/
│   ├── de.jsonc                 # German translations
│   ├── el.jsonc                 # Greek translations
│   ├── en.jsonc                 # English translations
│   ├── es.jsonc                 # Spanish translations
│   ├── fr.jsonc                 # French translations
│   └── index.ts                 # Locale exports
└── index.ts                     # Feature exports
```

---

## Step 1: Create Directory Structure

```bash
mkdir -p client/common/src/features/prospecting/{api,components/contacts,services,stores,views,locales}
```

---

## Step 2: API Client

**📖 See also**: [API Client Pattern](./api-client-pattern.md) for comprehensive API documentation.

**File**: `client/common/src/features/prospecting/api/contactsApi.ts`

```typescript
import { getModel, postModel, putModel, del, makePageQueryString, type Result } from '$/api';
import type { ContactModel, ContactDetailModel, PagedResult, PagedQuery } from '$/models';

// Type aliases for clarity
type CreateContactRequest = Omit<ContactModel, 'id'>;
type UpdateContactRequest = ContactModel;

export const contactsApi = {
  // GET single - returns Result<T, Response>
  get: (id: number): Promise<Result<ContactModel, Response>> =>
    getModel<ContactModel>(`/api/prospecting/contact/${id}`),

  // GET detail
  getDetail: (id: number): Promise<Result<ContactDetailModel, Response>> =>
    getModel<ContactDetailModel>(`/api/prospecting/contact/${id}/detail`),

  // GET list with pagination
  list: (query: PagedQuery): Promise<Result<PagedResult<ContactModel>, Response>> =>
    getModel<PagedResult<ContactModel>>(
      `/api/prospecting/contact${makePageQueryString(query)}`
    ),

  // POST create - returns created entity
  create: (model: CreateContactRequest): Promise<Result<ContactModel, Response>> =>
    postModel<CreateContactRequest, ContactModel>('/api/prospecting/contact', model),

  // PUT update - returns updated entity
  update: (model: UpdateContactRequest): Promise<Result<ContactModel, Response>> =>
    putModel<UpdateContactRequest, ContactModel>('/api/prospecting/contact', model),

  // DELETE - returns raw Response (just need ok status)
  delete: (id: number): Promise<Response> =>
    del(`/api/prospecting/contact/${id}`),

  // Search - unwrap Result, return null if not found
  findByEmail: async (email: string): Promise<ContactModel | null> => {
    const result = await getModel<ContactModel>(
      `/api/prospecting/contact/search/email?email=${encodeURIComponent(email)}`
    );
    // Return value if ok, null if 404, throw otherwise
    if (result.ok) return result.value;
    if (result.error.status === 404) return null;
    throw new Error(`Failed to find contact: ${result.error.status}`);
  },
};
```

### Result Type Pattern

The API uses a `Result<T, E>` type for typed responses:

```typescript
type Result<T, E> =
  | { ok: true; value: T }   // Success: deserialized model
  | { ok: false; error: E }; // Failure: raw Response object
```

**Usage:**
```typescript
const result = await contactsApi.get(id);
if (result.ok) {
  console.log('Contact:', result.value);  // ContactModel
} else {
  console.error('Failed:', result.error.status);  // Response.status
}
```

---

## Step 3: Service Layer

### Interface

**File**: `client/common/src/features/prospecting/services/IContactsService.ts`

```typescript
import type { ContactModel, ContactDetailModel, PagedResult, PagedQuery } from '$/models';

export interface IContactsService {
  getContact(id: number): Promise<ContactModel>;
  getContactDetail(id: number): Promise<ContactDetailModel>;
  listContacts(query: PagedQuery): Promise<PagedResult<ContactModel>>;
  createContact(model: Omit<ContactModel, 'id'>): Promise<ContactModel>;
  updateContact(model: ContactModel): Promise<ContactModel>;
  deleteContact(id: number): Promise<void>;
  findByEmail(email: string): Promise<ContactModel | null>;
}
```

### Implementation

**File**: `client/common/src/features/prospecting/services/ContactsService.ts`

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from '$/platform/di/types';
import type { IConfigurationService } from '$/platform/config/services/IConfigurationService';
import type { IContactsService } from './IContactsService';
import { contactsApi } from '../api/contactsApi';
import { ApiError } from '$/api';
import type { ContactModel, ContactDetailModel, PagedResult, PagedQuery } from '$/models';

@injectable()
export class ContactsService implements IContactsService {
  constructor(
    @inject(TYPES.ConfigurationService) private configService: IConfigurationService
  ) {}

  async getContact(id: number): Promise<ContactModel> {
    const result = await contactsApi.get(id);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to get contact');
    return result.value;
  }

  async getContactDetail(id: number): Promise<ContactDetailModel> {
    const result = await contactsApi.getDetail(id);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to get contact detail');
    return result.value;
  }

  async listContacts(query: PagedQuery): Promise<PagedResult<ContactModel>> {
    const result = await contactsApi.list(query);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to list contacts');
    return result.value;
  }

  async createContact(model: Omit<ContactModel, 'id'>): Promise<ContactModel> {
    const result = await contactsApi.create(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to create contact');
    return result.value;
  }

  async updateContact(model: ContactModel): Promise<ContactModel> {
    const result = await contactsApi.update(model);
    if (!result.ok) throw await ApiError.fromResponse(result.error, 'Failed to update contact');
    return result.value;
  }

  async deleteContact(id: number): Promise<void> {
    const response = await contactsApi.delete(id);
    if (!response.ok) {
      throw await ApiError.fromResponse(response, 'Failed to delete contact');
    }
  }

  async findByEmail(email: string): Promise<ContactModel | null> {
    // findByEmail already handles null case in API layer
    return contactsApi.findByEmail(email);
  }
}
```

### Service Pattern Notes

- **Services unwrap Results**: Convert `Result<T, Response>` to `Promise<T>` with error handling
- **`ApiError`**: Use the provided `ApiError` class for consistent error types
- **Components catch errors**: Use try/catch in components for user-facing error handling

---

## Step 4: Register Service in DI

**File**: `client/common/src/platform/di/types.ts`

Add the service symbol:

```typescript
export const TYPES = {
  // ... existing types
  ContactsService: Symbol.for('ContactsService'),
} as const;
```

**File**: `client/common/src/platform/di/container.ts`

Register the service:

```typescript
import { ContactsService } from '$/features/prospecting/services/ContactsService';
import type { IContactsService } from '$/features/prospecting/services/IContactsService';

// In the container setup
container.bind<IContactsService>(TYPES.ContactsService)
  .to(ContactsService)
  .inSingletonScope();
```

---

## Step 5: Localization Setup (New Feature)

### 5.1 Create Language Files

**File**: `client/common/src/features/prospecting/locales/en.jsonc`

```jsonc
{
    // Fallbacks to translation/common namespace
    // "Edit": "Edit",
    // "Delete": "Delete",
    // "Actions": "Actions",
    // "Search": "Search",

    // Feature-level
    "Prospecting": "Prospecting",
    "Manage your outreach and sales pipeline": "Manage your outreach and sales pipeline",

    // Contacts section
    "Contacts": "Contacts",
    "Manage your contacts and prospects": "Manage your contacts and prospects",

    // Table headers
    "Contact Name": "Contact Name",
    "Company": "Company",
    "Email Address": "Email Address",
    "Job Title": "Job Title",
    "Last Contacted": "Last Contacted",

    // Form labels
    "First Name": "First Name",
    "Last Name": "Last Name",

    // Messages
    "Contact created successfully": "Contact created successfully",
    "Contact updated successfully": "Contact updated successfully",
    "Contact deleted successfully": "Contact deleted successfully",
    "Error loading contacts": "Error loading contacts",
    "No contacts found": "No contacts found",

    // Actions
    "Add Contact": "Add Contact",
    "Edit Contact": "Edit Contact",
    "Delete Contact": "Delete Contact",
    "View Details": "View Details",

    // Search
    "Search by name, email, or company": "Search by name, email, or company"
}
```

**Create other language files** by copying `en.jsonc`:

```bash
cp en.jsonc de.jsonc  # German
cp en.jsonc el.jsonc  # Greek
cp en.jsonc es.jsonc  # Spanish
cp en.jsonc fr.jsonc  # French
```

> **Note**: Initially copy English content to other languages. Mark them with `// TODO: Translation needed` comments. Real translations should be added later.

### 5.2 Create Locales Index

**File**: `client/common/src/features/prospecting/locales/index.ts`

```typescript
import de from "./de.jsonc";
import el from "./el.jsonc";
import en from "./en.jsonc";
import es from "./es.jsonc";
import fr from "./fr.jsonc";

export const prospecting = {
  de: { prospecting: de },
  el: { prospecting: el },
  en: { prospecting: en },
  es: { prospecting: es },
  fr: { prospecting: fr },
};
```

### 5.3 Register Feature Locales

**File**: `client/admin/src/features/locales.ts` (or web/common)

```typescript
import { identity } from "../features/identity/locales";
import { organization } from "../features/organization/locales";
import { prospecting } from "../features/prospecting/locales";  // Add import

export const features = {
  de: { ...identity.de, ...organization.de, ...prospecting.de },  // Add spread
  el: { ...identity.el, ...organization.el, ...prospecting.el },
  en: { ...identity.en, ...organization.en, ...prospecting.en },
  es: { ...identity.es, ...organization.es, ...prospecting.es },
  fr: { ...identity.fr, ...organization.fr, ...prospecting.fr },
};
```

---

## Step 6: Components

### Main Component

**File**: `client/common/src/features/prospecting/components/contacts/ContactList.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContainer } from '$/platform/di/ContainerContext';
import { TYPES } from '$/platform/di/types';
import type { IContactsService } from '../services/IContactsService';
import type { ContactModel, PagedResult } from '$/models';
import { Button } from '$/components/ui/button';
import { Input } from '$/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '$/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$/components/ui/table';
import { Badge } from '$/components/ui/badge';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

interface ContactListProps {
  onSelectContact?: (contact: ContactModel) => void;
  onEditContact?: (contact: ContactModel) => void;
}

export const ContactList: React.FC<ContactListProps> = ({ 
  onSelectContact,
  onEditContact 
}) => {
  const { t } = useTranslation("prospecting");  // Use feature namespace
  const container = useContainer();
  const contactsService = container.get<IContactsService>(TYPES.ContactsService);

  const [contacts, setContacts] = useState<ContactModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadContacts();
  }, [page, searchTerm]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await contactsService.listContacts({
        page,
        limit: 10,
        search: searchTerm || undefined,
      });
      setContacts(result.data);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (err) {
      setError(t("Error loading contacts"));
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("Are you sure you want to delete this contact?"))) {
      return;
    }
    try {
      await contactsService.deleteContact(id);
      loadContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("Contacts")}</CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t("Add Contact")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("Search by name, email, or company")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && contacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t("No contacts found")}
          </div>
        )}

        {/* Table */}
        {!loading && !error && contacts.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Contact Name")}</TableHead>
                <TableHead>{t("Email Address")}</TableHead>
                <TableHead>{t("Company")}</TableHead>
                <TableHead>{t("Job Title")}</TableHead>
                <TableHead>{t("Actions")}</TableHead>  {/* Falls back to common */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow 
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectContact?.(contact)}
                >
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>{contact.title}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditContact?.(contact);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">{t("Edit")}</span>  {/* Falls back to common */}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">{t("Delete")}</span>  {/* Falls back to common */}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              {t("Previous")}  {/* Falls back to common */}
            </Button>
            <span className="py-2 px-4">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              {t("Next")}  {/* Falls back to common */}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### Key i18n Points

1. **Use feature namespace**: `useTranslation("prospecting")`
2. **Fallback works automatically**: Keys like `"Edit"`, `"Delete"`, `"Actions"` fall back to `common` namespace
3. **Screen reader text**: Use `t()` for accessibility text too
4. **Don't duplicate**: Check if a key exists in `common` or `translation` before adding to feature

---

## Step 7: Views

### Main Page

**File**: `client/common/src/features/prospecting/views/ContactsPage.tsx`

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContactList } from '../components/contacts/ContactList';
import { ContactForm } from '../components/contacts/ContactForm';
import type { ContactModel } from '$/models';
import PageHeader from '$/components/layout/PageHeader';

const ContactsPage: React.FC = () => {
  const { t } = useTranslation("prospecting");
  const [selectedContact, setSelectedContact] = useState<ContactModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={t("Contacts")}
        subtitle={t("Manage your contacts and prospects")}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ContactList
            onSelectContact={setSelectedContact}
            onEditContact={(contact) => {
              setSelectedContact(contact);
              setIsEditing(true);
            }}
          />
        </div>
        
        {selectedContact && (
          <div>
            <ContactForm
              contact={selectedContact}
              isEditing={isEditing}
              onSave={() => {
                setIsEditing(false);
                // Refresh list
              }}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsPage;
```

### Test Page

**File**: `client/common/src/features/prospecting/views/ProspectingTestPage.tsx`

```tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ContactList } from '../components/contacts/ContactList';
import { Card, CardContent, CardHeader, CardTitle } from '$/components/ui/card';
import { Button } from '$/components/ui/button';
import { Separator } from '$/components/ui/separator';

const ProspectingTestPage: React.FC = () => {
  const { t } = useTranslation("prospecting");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Prospecting Feature Test Page</h1>
      
      {/* Test Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => console.log('Create test contact')}>
              Create Test Contact
            </Button>
            <Button variant="secondary" onClick={() => console.log('Refresh')}>
              Refresh List
            </Button>
            <Button variant="destructive" onClick={() => console.log('Clear all')}>
              Clear Test Data
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Feature */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contact List Component</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactList 
            onSelectContact={(contact) => console.log('Selected:', contact)}
            onEditContact={(contact) => console.log('Edit:', contact)}
          />
        </CardContent>
      </Card>
      
      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Locale</h3>
            <p className="text-sm text-muted-foreground">
              Namespace: prospecting
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-semibold mb-2">i18n Test</h3>
            <ul className="text-sm space-y-1">
              <li>Feature key: "{t("Contacts")}"</li>
              <li>Fallback key (common): "{t("Edit")}"</li>
              <li>Missing key test: "{t("NonExistentKey")}"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProspectingTestPage;
```

---

## Step 8: Routing

**File**: Update your app's routes (e.g., `client/web/src/routes/index.tsx`)

```tsx
import ContactsPage from '$/features/prospecting/views/ContactsPage';
import ProspectingTestPage from '$/features/prospecting/views/ProspectingTestPage';

// Add routes
<Route path="prospecting/contacts" element={<ContactsPage />} />
<Route path="test/prospecting" element={<ProspectingTestPage />} />
```

### Sidebar Navigation

If your feature needs a navigation link in the sidebar, update the sidebar configuration:

**File**: `client/web/src/constants/sidebar-data.ts` (or similar)

```typescript
// Add to the appropriate section
{
  title: "Contacts",
  url: "/prospecting/contacts",
  icon: Users,  // Import from lucide-react
},
```

> **Note**: Not all features need sidebar links. Test pages and internal tools typically don't need navigation entries.

---

## Part 2: Adding to Existing Feature

When adding components to a feature that already has i18n set up, you only need to:

### 1. Add Translation Keys

**File**: Edit existing `locales/en.jsonc` (and other language files)

```jsonc
{
    // ... existing keys ...
    
    // New component - Contact Detail View
    "Contact Details": "Contact Details",
    "View all information about this contact": "View all information about this contact",
    "Contact History": "Contact History",
    "Recent Activity": "Recent Activity",
    "No activity yet": "No activity yet"
}
```

**Important**: 
- Check if the key already exists in `common` or `translation` namespace first
- If it exists, don't add it—just use it (fallback handles it)
- Update ALL 5 language files when adding new keys

### 2. Use in Component

```tsx
import { useTranslation } from 'react-i18next';

const ContactDetail: React.FC<{ contact: ContactModel }> = ({ contact }) => {
  const { t } = useTranslation("prospecting");  // Same namespace as feature
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Contact Details")}</CardTitle>
        <CardDescription>{t("View all information about this contact")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ... */}
        <Button>{t("Edit")}</Button>  {/* Falls back to common */}
      </CardContent>
    </Card>
  );
};
```

### Quick Checklist for Adding to Existing Feature

- [ ] Check if translation keys exist in `common` or `translation` first
- [ ] Add new keys to `en.jsonc` in the feature's `locales/` folder
- [ ] Add same keys to other language files (`de.jsonc`, `el.jsonc`, `es.jsonc`, `fr.jsonc`)
- [ ] Use `useTranslation("featureName")` in your component
- [ ] Verify keys work by testing in browser with different locales

---

## i18n Quick Reference

### Namespace Hierarchy

```
Feature namespace (prospecting)
    ↓ fallback
Translation namespace (app-level)
    ↓ fallback
Common namespace (generic UI)
```

### When to Use Which Namespace

| Namespace | Use For | Examples |
|-----------|---------|----------|
| **Feature** (prospecting) | Feature-specific terms | "Contact Name", "Add Contact" |
| **Translation** | App-wide terms | "Dashboard", "Settings" |
| **Common** | Generic UI text | "Edit", "Delete", "Save", "Cancel" |

### Common Patterns

```tsx
// Feature namespace - specify explicitly
const { t } = useTranslation("prospecting");
t("Contact Name")  // From prospecting namespace

// Keys not found fall back automatically
t("Edit")          // Falls back to common namespace
t("Save")          // Falls back to common namespace

// Explicitly use different namespace (rare)
t("Dashboard", { ns: "translation" })
```

### Duplicate Detection

Run periodically to find duplicates that should be promoted:

```bash
python bin/i18n_dupes.py -l en
```

**See**: [i18n Localization Pattern](./i18n-localization-pattern.md) for comprehensive i18n documentation.

---

## Zustand Store (Optional)

For complex state management, add a Zustand store:

**File**: `client/common/src/features/prospecting/stores/contactsStore.ts`

```typescript
import { create } from 'zustand';
import type { ContactModel } from '$/models';

interface ContactsState {
  contacts: ContactModel[];
  selectedContact: ContactModel | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setContacts: (contacts: ContactModel[]) => void;
  selectContact: (contact: ContactModel | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  addContact: (contact: ContactModel) => void;
  updateContact: (contact: ContactModel) => void;
  removeContact: (id: number) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  selectedContact: null,
  isLoading: false,
  error: null,

  setContacts: (contacts) => set({ contacts }),
  selectContact: (contact) => set({ selectedContact: contact }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, contact],
  })),
  
  updateContact: (updated) => set((state) => ({
    contacts: state.contacts.map((c) => 
      c.id === updated.id ? updated : c
    ),
    selectedContact: state.selectedContact?.id === updated.id 
      ? updated 
      : state.selectedContact,
  })),
  
  removeContact: (id) => set((state) => ({
    contacts: state.contacts.filter((c) => c.id !== id),
    selectedContact: state.selectedContact?.id === id 
      ? null 
      : state.selectedContact,
  })),
}));
```

**See**: [Modular Zustand Store Pattern](./modular-zustand-store-pattern.md) for advanced patterns.

---

## Checklist

### New Feature Setup

- [ ] Created directory structure (`features/prospecting/`)
- [ ] Created API client (`api/contactsApi.ts`)
- [ ] Created service interface and implementation (`ContactsService`)
- [ ] Registered service in DI container
- [ ] Created all 5 locale files (de, el, en, es, fr)
- [ ] Created locale index (`locales/index.ts`)
- [ ] Registered feature locales in app's `features/locales.ts`
- [ ] Created main components in entity subfolder (`components/contacts/`)
- [ ] Created main page and test page
- [ ] Added routes
- [ ] Added sidebar navigation link (if user-facing feature)
- [ ] Tested i18n with different locales

### Adding to Existing Feature

- [ ] Checked `common` and `translation` namespaces for existing keys
- [ ] Added new keys to all 5 locale files
- [ ] Used `useTranslation("featureName")` in component
- [ ] Tested component renders correctly
- [ ] Ran duplicate checker: `python bin/i18n_dupes.py -l en`

---

## Feature Namespace Mapping

Client features should match server namespaces:

| Server Namespace | Client Feature | Contains |
|------------------|----------------|----------|
| `Prospecting` | `prospecting/` | Contacts, Sequences, Campaigns |
| `Orchestration` | `orchestration/` | Workflows, Automations |
| `Access` | `access/` | Organizations, Members |
| `Business` | `business/` | Entities, Roles |

---

## Testing

Testing is essential for feature quality. Add tests alongside your components and services.

**📖 See also**: [Testing Patterns](./testing-patterns.md) for comprehensive testing documentation.

### Test File Locations

Tests are colocated with their source files:

```
features/prospecting/
├── api/
│   ├── contactsApi.ts
│   └── contactsApi.test.ts          # API client tests
├── services/
│   ├── ContactsService.ts
│   └── ContactsService.test.ts      # Service tests
├── components/contacts/
│   ├── ContactList.tsx
│   └── ContactList.test.tsx         # Component tests
└── views/
    ├── ContactsPage.tsx
    └── ContactsPage.test.tsx        # Page/view tests
```

### Component Test Example

```typescript
// components/contacts/ContactList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactList } from './ContactList';

// Mock the DI container
vi.mock('$/platform/di/ContainerContext', () => ({
  useContainer: () => ({
    get: vi.fn(() => mockContactsService),
  }),
}));

const mockContactsService = {
  listContacts: vi.fn(),
  deleteContact: vi.fn(),
};

describe('ContactList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactsService.listContacts.mockResolvedValue({
      data: [
        { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      ],
      total: 2,
    });
  });

  it('should render contacts from service', async () => {
    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('should show empty state when no contacts', async () => {
    mockContactsService.listContacts.mockResolvedValue({ data: [], total: 0 });

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
    });
  });

  it('should call onSelectContact when row is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<ContactList onSelectContact={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await user.click(screen.getByText('John Doe'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, firstName: 'John' })
    );
  });

  it('should handle delete with confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => true);

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockContactsService.deleteContact).toHaveBeenCalledWith(1);
  });

  it('should show error state on load failure', async () => {
    mockContactsService.listContacts.mockRejectedValue(new Error('Network error'));

    render(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText(/error loading contacts/i)).toBeInTheDocument();
    });
  });
});
```

### Service Test Example

```typescript
// services/ContactsService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactsService } from './ContactsService';
import { contactsApi } from '../api/contactsApi';
import { ApiError } from '$/api';

vi.mock('../api/contactsApi');

describe('ContactsService', () => {
  let service: ContactsService;
  const mockConfigService = { get: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContactsService(mockConfigService as any);
  });

  describe('getContact', () => {
    it('should return contact on success', async () => {
      const mockContact = { id: 1, firstName: 'John', email: 'john@example.com' };
      vi.mocked(contactsApi.get).mockResolvedValue({ ok: true, value: mockContact });

      const result = await service.getContact(1);

      expect(result).toEqual(mockContact);
      expect(contactsApi.get).toHaveBeenCalledWith(1);
    });

    it('should throw ApiError on failure', async () => {
      const mockResponse = { status: 404, json: vi.fn() } as any;
      vi.mocked(contactsApi.get).mockResolvedValue({ ok: false, error: mockResponse });

      await expect(service.getContact(999)).rejects.toThrow();
    });
  });

  describe('createContact', () => {
    it('should create and return new contact', async () => {
      const input = { firstName: 'New', lastName: 'User', email: 'new@example.com' };
      const created = { id: 3, ...input };
      vi.mocked(contactsApi.create).mockResolvedValue({ ok: true, value: created });

      const result = await service.createContact(input);

      expect(result).toEqual(created);
      expect(contactsApi.create).toHaveBeenCalledWith(input);
    });
  });
});
```

### Testing i18n

```typescript
// Test that translations are used correctly
import { useTranslation } from 'react-i18next';

// In your test setup, mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,  // Returns key as-is for testing
    i18n: { language: 'en' },
  }),
}));

// Or for more realistic testing, set up i18next with test resources
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

beforeAll(() => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: {
        prospecting: {
          'Contacts': 'Contacts',
          'Add Contact': 'Add Contact',
          'No contacts found': 'No contacts found',
        },
      },
    },
  });
});
```

### Running Tests

```bash
# Run all client tests
npm test -- run

# Run tests for a specific feature
npm test -- --filter="prospecting"

# Run tests in watch mode
npm test -- --watch

# or
npm test

# Run with coverage
npm test -- --coverage
```

### Test Checklist

- [ ] Component renders correctly with mock data
- [ ] Loading state displays while fetching
- [ ] Empty state displays when no data
- [ ] Error state displays on failure
- [ ] User interactions trigger correct callbacks
- [ ] Form validation works correctly
- [ ] i18n keys resolve (no missing translations)
- [ ] Accessibility: keyboard navigation works
- [ ] Service methods handle success and error cases

---

## Related Documentation

- [Feature Development Pattern](./feature-development-pattern.md) - Full feature architecture
- [API Client Pattern](./api-client-pattern.md) - HTTP requests and Result type handling
- [i18n Localization Pattern](./i18n-localization-pattern.md) - Comprehensive i18n guide
- [UI Components Pattern](./ui-components-pattern.md) - Using shadcn/ui components
- [Modular Zustand Store Pattern](./modular-zustand-store-pattern.md) - State management
- [Testing Patterns](./testing-patterns.md) - Comprehensive testing guide
- [Client Overview](../../overview/client/client-overview.md) - Client architecture

---

**Last Updated**: 2025-12-07  
**Maintained By**: Engineering Team
