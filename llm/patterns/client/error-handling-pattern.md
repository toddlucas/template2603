# Client Error Handling Pattern

## Overview

Standardized error handling for API calls that integrates with server-side RFC 9110 Problem Details responses.

## Quick Reference

### Import

```typescript
import { useApiError } from '$/hooks';
import { ApiError, isErrorCode } from '$/api';
```

### Basic Pattern

```typescript
const { handleError } = useApiError();

try {
  const result = await contactsApi.create(data);
  if (result.ok) {
    toast.success('Created');
  } else {
    const error = await ApiError.fromResponse(result.error);
    handleError(error);
  }
} catch (err) {
  handleError(err);
}
```

### Handle Specific Error Codes

```typescript
const { handleError, isErrorCode } = useApiError();

const error = await ApiError.fromResponse(result.error);

if (isErrorCode(error, 'duplicate_error')) {
  setShowDuplicateModal(true);
} else {
  handleError(error);
}
```

### Form Validation Errors

```typescript
const { handleValidation } = useApiError();
const [fieldErrors, setFieldErrors] = useState({});

const error = await ApiError.fromResponse(result.error);
const fields = handleValidation(error);
if (fields) {
  setFieldErrors(fields);
}

// In JSX
<Input error={fieldErrors.email} />
```

### Store Actions

```typescript
import { getErrorMessage } from '$/api/errorHandling';

const error = await ApiError.fromResponse(result.error);
set({ 
  error: getErrorMessage(error),  // Hides internal errors
  isLoading: false 
});
```

## Error Codes

All error codes are typed and exported from `$/models`:

```typescript
type ApiErrorCode = 
  | "validation_error"      // Form validation failures
  | "not_found"            // Resource doesn't exist
  | "duplicate_error"      // Duplicate data (conflict)
  | "business_rule_violation"  // Business logic error
  | "provider_error"       // External service failure
  | "internal_error"       // Server error (show generic)
  | "authentication_error" // Auth failure
  | "permission_denied"    // Authorization failure
  | "rate_limit_exceeded"  // Too many requests
  | "service_unavailable"  // Temporary outage
```

## Key Principles

✅ **DO:**
- Use `useApiError()` hook in components
- Check specific error codes with `isErrorCode()`
- Display field errors for validation failures
- Log request IDs for internal errors

❌ **DON'T:**
- Display internal error details to users
- Hardcode error messages
- Ignore error codes
- Show raw API responses

## API Error Properties

```typescript
interface ApiError {
  // Standard
  status: number;
  statusText: string;
  message: string;
  
  // RFC 9110 Problem Details
  problemType?: string;
  title?: string;
  detail?: string;
  instance?: string;
  
  // Base2 extensions
  errorCode?: ApiErrorCode;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  
  // Type guards
  isInternalError(): boolean;
  isValidationError(): boolean;
  isDuplicateError(): boolean;
  hasFieldErrors(): boolean;
  getUserMessage(): string;  // Hides internal details
}
```

## Full Documentation

See detailed implementation plan: `llm/plans/features/2025-12-27_client-error-handling-implementation-plan.md`

