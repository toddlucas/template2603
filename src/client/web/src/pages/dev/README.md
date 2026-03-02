# Error Handling Test Harness

**Purpose**: Interactive testing environment for the proposed error handling system.

## Overview

This test harness allows you to:
- Test all error scenarios from the server
- Evaluate the proposed client error handling patterns
- Make informed decisions before full implementation
- Iterate on error handling UX

## Files

- **ErrorTestController.cs** (Server) - Test endpoints that simulate all error types
- **ErrorHandlingTest.tsx** (Client) - Interactive test page with forms and buttons

## How to Use

### 1. Start the Application

```bash
# From workspace root
cd main
./dev.sh   # or dev.cmd on Windows
```

### 2. Navigate to Test Page

Once logged in, go to:
```
http://localhost:5173/test/error-handling
```

### 3. Test Different Scenarios

**Validation Error Tests (Two Forms):**

**Form 1 - Plain Validation:**
- Fill out the form (or leave fields empty)
- Click "Test Validation Error"
- Observe: Field errors appear inline after API call, toast shows general message

**Form 2 - Zod Validation:**
- Fill out the purple form (or leave fields empty)
- Click "Test Zod Validation"
- Observe: 
  - Client-side errors appear instantly (before API call)
  - If client validation passes, server validation runs
  - Both client and server errors display in the form

**Test Layered Validation (Zod Passes, Server Fails):**
To demonstrate defense-in-depth, try these inputs that pass Zod but fail server validation:
- **Email**: `test@blocked.com` (valid format, but blocked domain)
- **Age**: `150` (positive number, but over max of 120)
- **Name**: Any name over 30 characters (Zod doesn't limit, server does)

These show why server-side validation is still needed even with client-side validation!

**Error Scenario Buttons:**
- Click each button to trigger a specific error type
- Observe: Toast notifications, error details panel, console logs
- Pay attention to **internal errors** - they should show generic messages

### 4. What to Look For

✅ **Good Behaviors:**
- Internal errors (500) show "Something went wrong" - **not** implementation details
- Specific errors show the actual error message
- Field errors populate form fields correctly (both forms)
- Zod validation provides instant feedback without API call
- Server validation still runs even after Zod passes
- Request IDs are logged for debugging
- Duplicate error triggers custom handling (modal mention)

❌ **Issues to Watch For:**
- Internal error details exposed in UI
- Missing error codes
- Field errors not populating
- Toast messages not appearing
- Zod validation not preventing invalid API calls

## Current Status

### Server ✅ Complete
- All test endpoints working
- Returns proper Problem Details responses
- Error codes correctly set

### Client ⚠️ Prototype Only
The client implementation is a **prototype** to demonstrate the proposed patterns.

**Two Validation Examples:**
1. **Plain form** - Server-side validation only (errors after API call)
2. **Zod form** - Client-side validation first (instant feedback) + server-side validation

**Field Error Extraction:**
Since `ApiError` doesn't have `fieldErrors` yet, the test page manually extracts them from the response body. This demonstrates how the final implementation will work.

**Known Linter Errors:**
The `ErrorHandlingTest.tsx` file has TypeScript errors for missing properties:
- `error.errorCode` - Not yet on ApiError
- `error.fieldErrors` - Not yet on ApiError (manually extracted from response)
- `error.requestId` - Not yet on ApiError

These errors are **expected** and will be resolved when Phase 1 of the client implementation is complete (see plan below).

## Implementation Plan Reference

See: `llm/plans/features/2025-12-27_client-error-handling-implementation-plan.md`

**Phases:**
1. **Phase 1**: Enhanced ApiError class (2-3 days) - Will fix the linter errors
2. **Phase 2**: Centralized utilities (1-2 days)
3. **Phase 3**: React hook (1-2 days)
4. **Phase 4**: Migration (2-3 weeks incremental)

## Test Endpoints

All endpoints are at `/api/dev/error-test/`:

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/scenarios` | GET | 200 | List all test scenarios |
| `/validation-error` | POST | 400 | Test validation with field errors |
| `/not-found` | GET | 404 | Test resource not found |
| `/duplicate-error` | POST | 409 | Test duplicate/conflict |
| `/business-rule` | POST | 422 | Test business rule violation |
| `/provider-error` | POST | 422 | Test external service error |
| `/internal-error` | GET | 500 | Test internal server error |
| `/auth-error` | GET | 401 | Test authentication error |
| `/permission-denied` | GET | 403 | Test authorization error |
| `/rate-limit` | POST | 429 | Test rate limiting |
| `/success` | POST | 200 | Control test (success) |
| `/delay` | GET | 200 | Test loading states |

## Security Note

⚠️ **DEVELOPMENT ONLY**

The `ErrorTestController` is for development and testing only. It should be:
- Removed before production deployment, or
- Protected behind `#if DEBUG` directives, or
- Disabled in production via configuration

## Feedback & Iteration

As you test:
1. Note any UX issues or improvements
2. Test with different data to ensure robustness
3. Check console logs for unexpected errors
4. Verify toast notifications are clear and actionable

Use your findings to refine the error handling patterns before full implementation.

## Next Steps

Once satisfied with the prototype:
1. Answer open questions in the implementation plan
2. Implement Phase 1 (enhanced ApiError)
3. Run tests to validate behavior
4. Proceed with remaining phases

## Questions?

Refer to:
- Implementation Plan: `llm/plans/features/2025-12-27_client-error-handling-implementation-plan.md`
- Complete Summary: `llm/notes/2025-12-27_error-handling-complete-summary.md`
- Server Pattern: `llm/patterns/server/exception-handling-pattern.md`

