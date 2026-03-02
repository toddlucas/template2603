# API Client Pattern

## Overview

This document describes the patterns for making HTTP requests to the backend API from client applications. The API client module provides a thin wrapper around the Fetch API with authentication, error handling, and typed responses.

**Location**: `client/common/src/api/index.ts`

## Core Concepts

### Result Type

The API client uses a discriminated union type for typed responses:

```typescript
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

This pattern:
- **Success** (`ok: true`): Contains the deserialized response in `value`
- **Failure** (`ok: false`): Contains the raw `Response` object in `error`

### Two API Styles

The module provides two styles of HTTP methods:

| Style | Returns | Use Case |
|-------|---------|----------|
| **Raw** (`get`, `post`, etc.) | `Promise<Response>` | When you need full control over response handling |
| **Model** (`getModel`, `postModel`, etc.) | `Promise<Result<T, Response>>` | When you want automatic JSON deserialization |

---

## Available Methods

### Raw Methods (Return `Response`)

```typescript
import { get, post, put, patch, del } from '$/api';

// GET request
const response = await get('/api/resource');

// POST request with body
const response = await post('/api/resource', { name: 'value' });

// PUT request with body
const response = await put('/api/resource', { id: 1, name: 'updated' });

// PATCH request with body
const response = await patch('/api/resource', { name: 'partial update' });

// DELETE request
const response = await del('/api/resource/1');
```

**When to use:**
- Fire-and-forget requests (don't need response body)
- Custom response handling (e.g., streaming, blobs)
- When you need to check multiple status codes

### Model Methods (Return `Result<T, Response>`)

```typescript
import { getModel, postModel, putModel, patchModel, type Result } from '$/api';

// GET with typed response
const result = await getModel<UserModel>('/api/users/1');

// POST with typed request and response
const result = await postModel<CreateRequest, UserModel>('/api/users', { name: 'John' });

// PUT with typed request and response
const result = await putModel<UpdateRequest, UserModel>('/api/users', { id: 1, name: 'Jane' });

// PATCH with typed request and response
const result = await patchModel<PatchRequest, UserModel>('/api/users/1', { name: 'Updated' });
```

**When to use:**
- CRUD operations where you need the response body
- Type-safe API calls with automatic deserialization
- Standard success/error handling patterns

### Multipart Methods (For File Uploads)

```typescript
import { postMultipart, putMultipart } from '$/api';

const formData = new FormData();
formData.append('file', fileBlob);
formData.append('name', 'document.pdf');

const response = await postMultipart('/api/upload', formData);
```

---

## Usage Patterns

### Pattern 1: Simple Model Request

For straightforward API calls where you expect a typed response:

```typescript
import { getModel, type Result } from '$/api';
import type { ContactModel } from '$/models';

export const getContact = async (id: number): Promise<Result<ContactModel, Response>> => {
  return getModel<ContactModel>(`/api/prospecting/contact/${id}`);
};

// Usage in component
const result = await getContact(1);
if (result.ok) {
  console.log('Contact:', result.value);  // ContactModel
} else {
  console.error('Failed:', result.error.status);  // Response
}
```

### Pattern 2: Unwrapping for Service Layer

When your service wants to return just the model (not the Result wrapper):

```typescript
import { getModel } from '$/api';
import type { ContactModel } from '$/models';

export const getContact = async (id: number): Promise<ContactModel> => {
  const result = await getModel<ContactModel>(`/api/prospecting/contact/${id}`);
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Failed to fetch contact: ${result.error.status}`);
};
```

### Pattern 3: Handling Not Found

When an entity might not exist:

```typescript
import { getModel } from '$/api';
import type { ContactModel } from '$/models';

export const findContactByEmail = async (email: string): Promise<ContactModel | null> => {
  const result = await getModel<ContactModel>(
    `/api/prospecting/contact/search/email?email=${encodeURIComponent(email)}`
  );
  
  if (result.ok) {
    return result.value;
  }
  
  // 404 means not found - return null instead of throwing
  if (result.error.status === 404) {
    return null;
  }
  
  // Other errors should throw
  throw new Error(`Failed to find contact: ${result.error.status}`);
};
```

### Pattern 4: Raw Response for Status Checks

When you need to check specific status codes without a body:

```typescript
import { post } from '$/api';

export const sendVerificationEmail = async (email: string): Promise<boolean> => {
  const response = await post('/api/auth/resendConfirmationEmail', { email });
  return response.ok;  // true if 2xx
};
```

### Pattern 5: POST with Typed Response

Creating a resource and receiving the created entity:

```typescript
import { postModel, type Result } from '$/api';
import type { ContactModel } from '$/models';

type CreateContactRequest = Omit<ContactModel, 'id'>;

export const createContact = async (
  model: CreateContactRequest
): Promise<Result<ContactModel, Response>> => {
  return postModel<CreateContactRequest, ContactModel>('/api/prospecting/contact', model);
};

// Usage
const result = await createContact({ firstName: 'John', lastName: 'Doe', ... });
if (result.ok) {
  console.log('Created contact ID:', result.value.id);
}
```

---

## AbortSignal Support

All methods accept an optional `AbortSignal` for request cancellation:

```typescript
import { getModel } from '$/api';

// In a React component with useEffect cleanup
useEffect(() => {
  const controller = new AbortController();
  
  const loadData = async () => {
    const result = await getModel<DataModel>('/api/data', controller.signal);
    if (result.ok) {
      setData(result.value);
    }
  };
  
  loadData();
  
  return () => controller.abort();  // Cleanup on unmount
}, []);
```

---

## Authentication

The API client automatically handles authentication based on the `VITE_AUTH_TYPE` environment variable:

| Auth Type | Behavior |
|-----------|----------|
| `bearer` | Adds `Authorization: Bearer {token}` header |
| (other) | Uses `credentials: 'same-origin'` for cookie auth |

The access token is managed via `setAccessToken()`:

```typescript
import { setAccessToken } from '$/api';

// After login
setAccessToken(response.accessToken);
```

### Global 401 Handling

All requests automatically trigger logout on 401 responses via `authManager.triggerLogout()`.

---

## URL Resolution

The API client resolves URLs relative to the configured scheme/host:

```typescript
import { setSchemeHost, apiUrl } from '$/api';

// Configure base URL (usually in app initialization)
setSchemeHost('https://api.example.com');

// apiUrl() resolves paths
apiUrl('/api/resource');  // → 'https://api.example.com/api/resource'

// When schemeHost is empty (same-origin), paths pass through
apiUrl('/api/resource');  // → '/api/resource'
```

---

## Feature API Module Pattern

When creating a feature's API module, organize methods by entity:

**File**: `features/prospecting/api/contactsApi.ts`

```typescript
import { get, getModel, postModel, putModel, del, type Result } from '$/api';
import type { ContactModel, ContactDetailModel, PagedResult } from '$/models';

// Type aliases for clarity
type CreateContactRequest = Omit<ContactModel, 'id'>;
type UpdateContactRequest = ContactModel;

export const contactsApi = {
  // GET single - returns Result for type safety
  get: (id: number): Promise<Result<ContactModel, Response>> =>
    getModel<ContactModel>(`/api/prospecting/contact/${id}`),

  // GET detail - returns Result
  getDetail: (id: number): Promise<Result<ContactDetailModel, Response>> =>
    getModel<ContactDetailModel>(`/api/prospecting/contact/${id}/detail`),

  // GET list - returns Result with PagedResult
  list: (params?: { page?: number; pageSize?: number; search?: string }): Promise<Result<PagedResult<ContactModel>, Response>> =>
    getModel<PagedResult<ContactModel>>(`/api/prospecting/contact?${new URLSearchParams({
      page: String(params?.page ?? 1),
      pageSize: String(params?.pageSize ?? 10),
      ...(params?.search && { search: params.search }),
    })}`),

  // POST create - returns Result with created entity
  create: (model: CreateContactRequest): Promise<Result<ContactModel, Response>> =>
    postModel<CreateContactRequest, ContactModel>('/api/prospecting/contact', model),

  // PUT update - returns Result with updated entity
  update: (model: UpdateContactRequest): Promise<Result<ContactModel, Response>> =>
    putModel<UpdateContactRequest, ContactModel>('/api/prospecting/contact', model),

  // DELETE - returns raw Response (just need ok status)
  delete: (id: number): Promise<Response> =>
    del(`/api/prospecting/contact/${id}`),

  // Search - may return null
  findByEmail: async (email: string): Promise<ContactModel | null> => {
    const result = await getModel<ContactModel>(
      `/api/prospecting/contact/search/email?email=${encodeURIComponent(email)}`
    );
    return result.ok ? result.value : null;
  },
};
```

---

## Error Handling Best Practices

### ApiError Class

The API module provides a standardized `ApiError` class with RFC 7807 Problem Details support:

```typescript
import { ApiError } from '$/api';

// Create from Response (preferred - extracts problem details)
const error = await ApiError.fromResponse(response, 'Failed to fetch contact');

// Or create directly with status
const error = new ApiError('Failed to fetch contact', 404, 'Not Found');

// Check error type
error.isNotFound();    // status === 404
error.isUnauthorized(); // status === 401
error.isForbidden();   // status === 403
error.isClientError(); // status 4xx
error.isServerError(); // status 5xx

// Access problem details (if available)
error.detail;    // Detailed error message
error.title;     // Error title
error.instance;  // Error instance identifier
```

### In API Module

```typescript
// Let Result propagate - don't catch here
export const getContact = (id: number): Promise<Result<ContactModel, Response>> =>
  getModel<ContactModel>(`/api/prospecting/contact/${id}`);
```

### In Service Layer

```typescript
import { ApiError } from '$/api';

export class ContactsService implements IContactsService {
  async getContact(id: number): Promise<ContactModel> {
    const result = await contactsApi.get(id);
    if (result.ok) {
      return result.value;
    }
    // Create ApiError with detailed message from response
    throw await ApiError.fromResponse(result.error, `Failed to fetch contact ${id}`);
  }
}
```

Or for simpler error handling:

```typescript
async getContact(id: number): Promise<ContactModel> {
  const result = await contactsApi.get(id);
  if (!result.ok) {
    throw new ApiError('Failed to fetch contact', result.error.status, result.error.statusText);
  }
  return result.value;
}
```

### In Component

```typescript
import { ApiError } from '$/api';

const ContactDetail = ({ id }: { id: number }) => {
  const [contact, setContact] = useState<ContactModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await contactsService.getContact(id);
        setContact(data);
      } catch (err) {
        // Use ApiError.extractErrorMessage for user-friendly messages
        setError(ApiError.extractErrorMessage(err));
      }
    };
    load();
  }, [id]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (!contact) return <Loading />;
  return <ContactCard contact={contact} />;
};
```

---

## Migration from Raw to Model Methods

If you have existing code using raw methods:

**Before:**
```typescript
export const getContact = async (id: number): Promise<ContactModel> => {
  const response = await get(`/api/prospecting/contact/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};
```

**After:**
```typescript
export const getContact = async (id: number): Promise<ContactModel> => {
  const result = await getModel<ContactModel>(`/api/prospecting/contact/${id}`);
  if (!result.ok) {
    throw new Error(`HTTP ${result.error.status}`);
  }
  return result.value;
};
```

Or return the Result for more flexibility:
```typescript
export const getContact = (id: number): Promise<Result<ContactModel, Response>> =>
  getModel<ContactModel>(`/api/prospecting/contact/${id}`);
```

---

## Summary

| Method | Returns | JSON Parsing | Use When |
|--------|---------|--------------|----------|
| `get(url)` | `Promise<Response>` | Manual | Need raw response |
| `getModel<T>(url)` | `Promise<Result<T, Response>>` | Automatic | Need typed data |
| `post(url, body)` | `Promise<Response>` | Manual | Fire-and-forget |
| `postModel<Req, Res>(url, body)` | `Promise<Result<Res, Response>>` | Automatic | Create with typed response |
| `put(url, body)` | `Promise<Response>` | Manual | Update without response |
| `putModel<Req, Res>(url, body)` | `Promise<Result<Res, Response>>` | Automatic | Update with typed response |
| `del(url)` | `Promise<Response>` | Manual | Delete (usually no body) |

**Prefer Model methods** for standard CRUD operations where you need the response body.

---

## Related Documentation

- [Client Feature Template](./client-feature-template.md) - Feature structure with API
- [Client Overview](../../overview/client/client-overview.md) - Architecture overview
- [Feature Development Pattern](./feature-development-pattern.md) - Full feature workflow

---

**Last Updated**: 2025-12-07  
**Maintained By**: Engineering Team

