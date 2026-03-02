/* eslint-disable no-console */
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '$/api';
import type { ApiErrorCode } from '$/models';
import { z } from 'zod';

// ============================================================================
// PROTOTYPE: Error Handling Utilities
// (This is the proposed implementation we're testing)
// ============================================================================

interface ErrorHandlingOptions {
  showToast?: boolean;
  context?: string;
}

interface ErrorDisplay {
  message: string;
  status?: number;
  statusText?: string;
  errorCode?: ApiErrorCode;
  title?: string;
  detail?: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  url?: string;
}

/**
 * Prototype: Handle API error with appropriate UI.
 */
function handleApiError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): { message: string; errorCode?: ApiErrorCode; requestId?: string } {
  const { showToast = true, context } = options;

  if (!(error instanceof ApiError)) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    const displayMessage = context ? `${context}: ${message}` : message;
    if (showToast) toast.error(displayMessage);
    return { message: displayMessage };
  }

  // Extract error details
  const errorCode = error.errorCode as ApiErrorCode | undefined;
  const requestId = error.requestId;

  // Internal errors - show generic message, log details
  if (errorCode === 'internal_error') {
    const genericMessage = 'Something went wrong. Please try again later.';
    if (showToast) {
      toast.error(genericMessage, {
        description: `Request ID: ${requestId}`,
      });
    }
    console.error('Internal error:', {
      requestId,
      status: error.status,
      url: error.url,
      detail: error.detail, // Preserved for developer debugging
    });
    return { message: genericMessage, errorCode, requestId };
  }

  // Specific errors - safe to display detail to user
  const message = error.detail || error.title || error.message;
  const displayMessage = context ? `${context}: ${message}` : message;
  
  if (showToast) {
    toast.error(displayMessage);
  }

  return { message: displayMessage, errorCode, requestId };
}

/**
 * Prototype: Handle validation error with field-level details.
 * NOTE: This manually extracts field errors from the response since ApiError doesn't have them yet.
 */
async function handleValidationError(
  error: unknown,
  options: ErrorHandlingOptions = {}
): Promise<{ fieldErrors: Record<string, string> | null; message: string }> {
  if (!(error instanceof ApiError)) {
    handleApiError(error, options);
    return { fieldErrors: null, message: 'Validation failed' };
  }

  // Extract field errors from response body (since ApiError doesn't have them yet)
  let fieldErrors: Record<string, string> | null = null;
  if (error.response) {
    try {
      const body = await error.response.clone().json();
      if (body.errors && typeof body.errors === 'object') {
        fieldErrors = body.errors as Record<string, string>;
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  if (error.errorCode !== 'validation_error' && error.status !== 400) {
    handleApiError(error, options);
    return { fieldErrors: null, message: error.message };
  }

  // Show general validation message
  const message = error.detail || 'Validation failed';
  if (options.showToast) {
    toast.error(message);
  }

  // Return field errors for form display
  return {
    fieldErrors,
    message,
  };
}

/**
 * Prototype: Check if error is a specific error code.
 */
function isErrorCode(error: unknown, code: ApiErrorCode): boolean {
  return error instanceof ApiError && error.errorCode === code;
}

// ============================================================================
// Test API Client
// ============================================================================

interface TestFormData {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  age?: number;
}

interface ErrorScenario {
  id: string;
  name: string;
  description: string;
  method: string;
}

const errorTestApi = {
  async getScenarios(): Promise<ErrorScenario[]> {
    const response = await fetch('/api/dev/error-test/scenarios');
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testValidation(data: TestFormData): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/validation-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testNotFound(id?: number): Promise<unknown> {
    const url = id ? `/api/dev/error-test/not-found?id=${id}` : '/api/dev/error-test/not-found';
    const response = await fetch(url);
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testDuplicate(data: TestFormData): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/duplicate-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testBusinessRule(data: TestFormData): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/business-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testProviderError(provider?: string): Promise<unknown> {
    const url = provider
      ? `/api/dev/error-test/provider-error?provider=${provider}`
      : '/api/dev/error-test/provider-error';
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testInternalError(trigger?: string): Promise<unknown> {
    const url = trigger
      ? `/api/dev/error-test/internal-error?trigger=${trigger}`
      : '/api/dev/error-test/internal-error';
    const response = await fetch(url);
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testAuthError(): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/auth-error');
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testPermissionDenied(resource?: string): Promise<unknown> {
    const url = resource
      ? `/api/dev/error-test/permission-denied?resource=${resource}`
      : '/api/dev/error-test/permission-denied';
    const response = await fetch(url);
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testRateLimit(): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/rate-limit', { method: 'POST' });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },

  async testSuccess(data: TestFormData): Promise<unknown> {
    const response = await fetch('/api/dev/error-test/success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await ApiError.fromResponse(response);
    return response.json();
  },
};

// ============================================================================
// Zod Schema for Form Validation
// ============================================================================

const contactSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().min(0, 'Age must be positive').optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ============================================================================
// Test Page Component
// ============================================================================

export function ErrorHandlingTest() {
  // Plain form state
  const [formData, setFormData] = useState<TestFormData>({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Zod form state
  const [zodFormData, setZodFormData] = useState<ContactFormData>({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [zodFieldErrors, setZodFieldErrors] = useState<Record<string, string>>({});
  
  const [lastError, setLastError] = useState<ErrorDisplay | null>(null);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearState = () => {
    setFieldErrors({});
    setZodFieldErrors({});
    setLastError(null);
    setLastResponse(null);
  };

  const handleInputChange = (field: keyof TestFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleZodInputChange = (field: keyof ContactFormData, value: string | number) => {
    setZodFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (zodFieldErrors[field]) {
      setZodFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const executeTest = async (testFn: () => Promise<unknown>, testName: string) => {
    clearState();
    setIsLoading(true);

    try {
      const result = await testFn();
      setLastResponse(result as Record<string, unknown> | null);
      toast.success(`${testName} succeeded!`);
    } catch (error) {
      console.error(`${testName} error:`, error);

      // Capture full error details for display
      if (error instanceof ApiError) {
        setLastError({
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          errorCode: error.errorCode,
          title: error.title,
          detail: error.detail,
          fieldErrors: error.fieldErrors,
          requestId: error.requestId,
          url: error.url,
        });
      } else {
        setLastError({ message: String(error) });
      }

      // Test error handling strategies
      const result = handleApiError(error, { context: testName });
      console.log('Error handling result:', result);
    } finally {
      setIsLoading(false);
    }
  };

  const testValidationWithHandling = async () => {
    clearState();
    setIsLoading(true);

    try {
      const result = await errorTestApi.testValidation(formData);
      setLastResponse(result as Record<string, unknown> | null);
      toast.success('Validation passed!');
    } catch (error) {
      console.error('Validation error:', error);

      // Extract field errors manually from response (since ApiError doesn't have them yet)
      let extractedFieldErrors: Record<string, string> = {};
      if (error instanceof ApiError && error.response) {
        try {
          const body = await error.response.clone().json();
          if (body.errors && typeof body.errors === 'object') {
            extractedFieldErrors = body.errors as Record<string, string>;
          }
          
          setLastError({
            message: error.message,
            status: error.status,
            errorCode: body.errorCode,
            detail: error.detail,
            fieldErrors: extractedFieldErrors,
            requestId: body.requestId,
          });
        } catch {
          setLastError({
            message: error.message,
            status: error.status,
            detail: error.detail,
          });
        }
      }

      // Test validation error handling
      const { fieldErrors: errors } = await handleValidationError(error, {
        context: 'Form validation',
      });
      if (errors) {
        setFieldErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testDuplicateWithCustomHandling = async () => {
    clearState();
    setIsLoading(true);

    try {
      const result = await errorTestApi.testDuplicate(formData);
      setLastResponse(result as Record<string, unknown> | null);
    } catch (error) {
      console.error('Duplicate error:', error);

      if (error instanceof ApiError) {
        setLastError({
          message: error.message,
          status: error.status,
          errorCode: error.errorCode,
          detail: error.detail,
          requestId: error.requestId,
        });
      }

      // Test specific error code handling
      if (isErrorCode(error, 'duplicate_error')) {
        toast.error('Duplicate detected! Opening modal...', {
          description: 'This would open a modal to view the existing contact.',
        });
      } else {
        handleApiError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testZodValidation = async () => {
    clearState();
    setIsLoading(true);

    try {
      // Step 1: Validate locally with Zod first
      const validationResult = contactSchema.safeParse(zodFormData);
      
      if (!validationResult.success) {
        // Convert Zod errors to field errors
        const errors: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setZodFieldErrors(errors);
        toast.error('Please fix validation errors');
        return;
      }

      // Step 2: Send to API (will also validate server-side)
      const result = await errorTestApi.testValidation(zodFormData);
      setLastResponse(result as Record<string, unknown> | null);
      toast.success('Zod validation passed!');
    } catch (error) {
      console.error('Zod validation error:', error);

      // Extract field errors from API response
      let extractedFieldErrors: Record<string, string> = {};
      if (error instanceof ApiError && error.response) {
        try {
          const body = await error.response.clone().json();
          if (body.errors && typeof body.errors === 'object') {
            extractedFieldErrors = body.errors as Record<string, string>;
          }
          
          setLastError({
            message: error.message,
            status: error.status,
            errorCode: body.errorCode,
            detail: error.detail,
            fieldErrors: extractedFieldErrors,
            requestId: body.requestId,
          });
        } catch {
          setLastError({
            message: error.message,
            status: error.status,
            detail: error.detail,
          });
        }
      }

      // Merge with Zod errors if any
      const { fieldErrors: apiErrors } = await handleValidationError(error, {
        context: 'Zod form validation',
      });
      if (apiErrors) {
        setZodFieldErrors(apiErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Handling Test Harness</h1>
        <p className="text-gray-600">
          Interactive testing environment for the error handling system. Test different error scenarios
          and see how the prototype error handling utilities respond.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Test Controls */}
        <div className="space-y-6">
          {/* Validation Error Test */}
          <section className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Validation Error Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Fill out the form (or leave fields empty) and test validation. Field errors should appear inline.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="text"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {fieldErrors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Age (optional)</label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded ${
                    fieldErrors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="30"
                />
                {fieldErrors.age && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.age}</p>
                )}
              </div>

              <button
                onClick={testValidationWithHandling}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Test Validation Error
              </button>
            </div>
          </section>

          {/* Zod Validation Form */}
          <section className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Zod Validation Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              This form uses Zod for client-side validation before sending to the API. Try submitting
              with empty fields or invalid data.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="text"
                  value={zodFormData.email || ''}
                  onChange={(e) => handleZodInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    zodFieldErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                />
                {zodFieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{zodFieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">First Name *</label>
                <input
                  type="text"
                  value={zodFormData.firstName || ''}
                  onChange={(e) => handleZodInputChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    zodFieldErrors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {zodFieldErrors.firstName && (
                  <p className="text-sm text-red-600 mt-1">{zodFieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name *</label>
                <input
                  type="text"
                  value={zodFormData.lastName || ''}
                  onChange={(e) => handleZodInputChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded ${
                    zodFieldErrors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {zodFieldErrors.lastName && (
                  <p className="text-sm text-red-600 mt-1">{zodFieldErrors.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Age (optional)</label>
                <input
                  type="number"
                  value={zodFormData.age || ''}
                  onChange={(e) =>
                    handleZodInputChange('age', parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 border rounded ${
                    zodFieldErrors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="30"
                />
                {zodFieldErrors.age && (
                  <p className="text-sm text-red-600 mt-1">{zodFieldErrors.age}</p>
                )}
              </div>

              <button
                onClick={testZodValidation}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Test Zod Validation
              </button>

              <div className="text-xs text-gray-500 mt-2 p-2 bg-purple-50 rounded space-y-2">
                <div>
                  <strong>How it works:</strong> Validates with Zod schema locally first (instant
                  feedback), then sends to API for server-side validation. Both client and server
                  errors display in the form.
                </div>
                <div className="border-t border-purple-200 pt-2">
                  <strong>Test server-side validation:</strong> Fill the form with valid data, but:
                  <ul className="list-disc list-inside ml-2 mt-1">
                    <li>Email ending in <code className="bg-purple-200 px-1 rounded">@blocked.com</code> → Server rejects</li>
                    <li>Age over <code className="bg-purple-200 px-1 rounded">120</code> → Server rejects</li>
                    <li>Names longer than 30 characters → Server rejects</li>
                  </ul>
                  <div className="mt-1 text-purple-700">
                    ✨ This demonstrates layered validation: Zod passes, but server has additional rules!
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Error Scenario Buttons */}
          <section className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Error Scenarios</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click each button to trigger a specific error type and observe the handling.
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => executeTest(() => errorTestApi.testSuccess(formData), 'Success')}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-left"
              >
                ✓ Success (Control)
              </button>

              <button
                onClick={() => executeTest(() => errorTestApi.testNotFound(12345), 'Not Found')}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                404 Not Found
              </button>

              <button
                onClick={testDuplicateWithCustomHandling}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                409 Duplicate/Conflict (with custom handling)
              </button>

              <button
                onClick={() =>
                  executeTest(() => errorTestApi.testBusinessRule(formData), 'Business Rule')
                }
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                422 Business Rule Violation
              </button>

              <button
                onClick={() => executeTest(() => errorTestApi.testProviderError(), 'Provider Error')}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                422 External Service Error
              </button>

              <button
                onClick={() =>
                  executeTest(() => errorTestApi.testInternalError('nullref'), 'Internal Error')
                }
                disabled={isLoading}
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50 text-left"
              >
                500 Internal Error (should hide details!)
              </button>

              <button
                onClick={() => executeTest(() => errorTestApi.testAuthError(), 'Auth Error')}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                401 Authentication Error
              </button>

              <button
                onClick={() =>
                  executeTest(() => errorTestApi.testPermissionDenied(), 'Permission Denied')
                }
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                403 Permission Denied
              </button>

              <button
                onClick={() => executeTest(() => errorTestApi.testRateLimit(), 'Rate Limit')}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50 text-left"
              >
                429 Rate Limit Exceeded
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Response Display */}
        <div className="space-y-6">
          {/* Last Error */}
          {lastError !== null && (
            <section className="border rounded-lg p-6 bg-red-50 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-red-900">Last Error</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {lastError.status ?? 'N/A'}{' '}
                  {lastError.statusText ?? ''}
                </div>
                {lastError.errorCode && (
                  <div>
                    <span className="font-medium">Error Code:</span>{' '}
                    <code className="bg-red-100 px-2 py-1 rounded">{lastError.errorCode}</code>
                  </div>
                )}
                {lastError.title && (
                  <div>
                    <span className="font-medium">Title:</span> {lastError.title}
                  </div>
                )}
                {lastError.detail && (
                  <div>
                    <span className="font-medium">Detail:</span> {lastError.detail}
                  </div>
                )}
                {lastError.requestId && (
                  <div>
                    <span className="font-medium">Request ID:</span>{' '}
                    <code className="bg-red-100 px-2 py-1 rounded">{lastError.requestId}</code>
                  </div>
                )}
                {lastError.fieldErrors && (
                  <div>
                    <span className="font-medium">Field Errors:</span>
                    <pre className="mt-2 bg-red-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(lastError.fieldErrors, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Last Success Response */}
          {lastResponse && (
            <section className="border rounded-lg p-6 bg-green-50 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-green-900">Last Success Response</h2>
              <pre className="text-sm bg-green-100 p-4 rounded overflow-auto">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </section>
          )}

          {/* Documentation */}
          <section className="border rounded-lg p-6 bg-blue-50 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Testing Guide</h2>
            <div className="text-sm space-y-2 text-blue-900">
              <p>
                <strong>Two Validation Approaches:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Form 1 (Plain):</strong> Server-side validation only - errors appear after
                  API call
                </li>
                <li>
                  <strong>Form 2 (Zod):</strong> Client-side Zod validation first (instant feedback),
                  then server-side
                </li>
              </ul>

              <p className="mt-4">
                <strong>What to observe:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Toast notifications (top-right corner)</li>
                <li>Field errors display inline (both forms)</li>
                <li>Zod errors appear instantly (no API call)</li>
                <li>Error details in "Last Error" panel</li>
                <li>Console logs (open DevTools)</li>
                <li>
                  Internal errors should show <strong>generic message</strong> in toast
                </li>
                <li>
                  Specific errors should show <strong>detail message</strong> in toast
                </li>
                <li>Request IDs logged for internal errors</li>
              </ul>

              <p className="mt-4">
                <strong>Key behaviors to verify:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Internal errors don't expose implementation details</li>
                <li>Validation errors populate form field errors (both forms)</li>
                <li>Zod validation prevents unnecessary API calls</li>
                <li>Duplicate error triggers custom handling (modal mention)</li>
                <li>All error codes are correctly extracted</li>
                <li>Request IDs are captured and logged</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
