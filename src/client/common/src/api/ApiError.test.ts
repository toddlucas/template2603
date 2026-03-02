import { describe, it, expect } from 'vitest';
import { ApiError } from './ApiError';

describe('ApiError', () => {
  describe('fromResponse', () => {
    it('extracts errorCode from Problem Details response', async () => {
      const response = new Response(
        JSON.stringify({
          status: 409,
          title: 'Conflict',
          detail: 'Email already exists',
          errorCode: 'duplicate_error',
          requestId: 'abc123',
        }),
        { status: 409 }
      );

      const error = await ApiError.fromResponse(response);
      
      expect(error.errorCode).toBe('duplicate_error');
      expect(error.isDuplicateError()).toBe(true);
      expect(error.requestId).toBe('abc123');
      expect(error.detail).toBe('Email already exists');
    });

    it('extracts field errors from validation response', async () => {
      const response = new Response(
        JSON.stringify({
          status: 400,
          detail: 'Validation failed',
          errorCode: 'validation_error',
          errors: {
            email: 'Email is required',
            firstName: 'First name is required',
          },
        }),
        { status: 400 }
      );

      const error = await ApiError.fromResponse(response);
      
      expect(error.isValidationError()).toBe(true);
      expect(error.hasFieldErrors()).toBe(true);
      expect(error.fieldErrors).toEqual({
        email: 'Email is required',
        firstName: 'First name is required',
      });
    });

    it('hides internal error details in getUserMessage()', async () => {
      const response = new Response(
        JSON.stringify({
          status: 500,
          detail: 'NullReferenceException at line 42',
          errorCode: 'internal_error',
          requestId: 'xyz789',
        }),
        { status: 500 }
      );

      const error = await ApiError.fromResponse(response);
      
      expect(error.isInternalError()).toBe(true);
      expect(error.getUserMessage()).toBe('Something went wrong. Please try again later.');
      // Original detail is preserved for logging
      expect(error.detail).toBe('NullReferenceException at line 42');
      expect(error.requestId).toBe('xyz789');
    });

    it('returns user-safe message for specific errors', async () => {
      const response = new Response(
        JSON.stringify({
          status: 409,
          detail: 'A contact with this email already exists',
          errorCode: 'duplicate_error',
        }),
        { status: 409 }
      );

      const error = await ApiError.fromResponse(response);
      
      expect(error.getUserMessage()).toBe('A contact with this email already exists');
      expect(error.isInternalError()).toBe(false);
    });

    it('handles response with no body', async () => {
      const response = new Response(null, { status: 500, statusText: 'Internal Server Error' });

      const error = await ApiError.fromResponse(response);
      
      expect(error.status).toBe(500);
      expect(error.message).toBe('HTTP 500: Internal Server Error');
    });

    it('handles non-JSON response body', async () => {
      const response = new Response('Plain text error', { status: 400 });

      const error = await ApiError.fromResponse(response);
      
      expect(error.status).toBe(400);
      expect(error.message).toBe('Plain text error');
    });
  });

  describe('Type Guards', () => {
    it('correctly identifies error types by errorCode', async () => {
      const validationError = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'validation_error' }), { status: 400 })
      );
      expect(validationError.isValidationError()).toBe(true);
      expect(validationError.isDuplicateError()).toBe(false);

      const duplicateError = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'duplicate_error' }), { status: 409 })
      );
      expect(duplicateError.isDuplicateError()).toBe(true);
      expect(duplicateError.isValidationError()).toBe(false);

      const businessError = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'business_rule_violation' }), { status: 400 })
      );
      expect(businessError.isBusinessRuleViolation()).toBe(true);

      const providerError = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'provider_error' }), { status: 502 })
      );
      expect(providerError.isProviderError()).toBe(true);
    });

    it('identifies not found by status or errorCode', async () => {
      const notFoundByStatus = await ApiError.fromResponse(
        new Response(null, { status: 404 })
      );
      expect(notFoundByStatus.isNotFound()).toBe(true);

      const notFoundByCode = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'not_found' }), { status: 404 })
      );
      expect(notFoundByCode.isNotFound()).toBe(true);
    });

    it('identifies unauthorized by status or errorCode', async () => {
      const unauthorizedByStatus = await ApiError.fromResponse(
        new Response(null, { status: 401 })
      );
      expect(unauthorizedByStatus.isUnauthorized()).toBe(true);

      const unauthorizedByCode = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'authentication_error' }), { status: 401 })
      );
      expect(unauthorizedByCode.isUnauthorized()).toBe(true);
    });

    it('identifies forbidden by status or errorCode', async () => {
      const forbiddenByStatus = await ApiError.fromResponse(
        new Response(null, { status: 403 })
      );
      expect(forbiddenByStatus.isForbidden()).toBe(true);

      const forbiddenByCode = await ApiError.fromResponse(
        new Response(JSON.stringify({ errorCode: 'permission_denied' }), { status: 403 })
      );
      expect(forbiddenByCode.isForbidden()).toBe(true);
    });

    it('identifies client and server errors', async () => {
      const clientError = await ApiError.fromResponse(
        new Response(null, { status: 400 })
      );
      expect(clientError.isClientError()).toBe(true);
      expect(clientError.isServerError()).toBe(false);

      const serverError = await ApiError.fromResponse(
        new Response(null, { status: 500 })
      );
      expect(serverError.isServerError()).toBe(true);
      expect(serverError.isClientError()).toBe(false);
    });
  });

  describe('extractErrorMessage', () => {
    it('hides internal error details', async () => {
      const internalError = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            errorCode: 'internal_error',
            detail: 'Database connection failed: timeout',
          }),
          { status: 500 }
        )
      );

      const message = ApiError.extractErrorMessage(internalError);
      expect(message).toBe('Something went wrong. Please try again later.');
      expect(message).not.toContain('Database');
      expect(message).not.toContain('timeout');
    });

    it('shows specific error messages', async () => {
      const specificError = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            errorCode: 'duplicate_error',
            detail: 'Email is already in use',
          }),
          { status: 409 }
        )
      );

      const message = ApiError.extractErrorMessage(specificError);
      expect(message).toBe('Email is already in use');
    });

    it('handles non-ApiError instances', () => {
      const regularError = new Error('Regular error message');
      expect(ApiError.extractErrorMessage(regularError)).toBe('Regular error message');

      expect(ApiError.extractErrorMessage('string error')).toBe('An unknown error occurred');
      expect(ApiError.extractErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('prefers detail over title', async () => {
      const error = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            title: 'Bad Request',
            detail: 'Email is required',
          }),
          { status: 400 }
        )
      );

      expect(ApiError.extractErrorMessage(error)).toBe('Email is required');
    });
  });

  describe('isProblemDetails', () => {
    it('returns true when Problem Details fields are present', async () => {
      const error = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            type: 'https://example.com/problems/validation',
            title: 'Validation Error',
            detail: 'Invalid input',
          }),
          { status: 400 }
        )
      );

      expect(error.isProblemDetails).toBe(true);
    });

    it('returns false when no Problem Details fields are present', async () => {
      const error = await ApiError.fromResponse(
        new Response(null, { status: 500 })
      );

      expect(error.isProblemDetails).toBe(false);
    });
  });

  describe('hasFieldErrors', () => {
    it('returns true when field errors exist', async () => {
      const error = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            errorCode: 'validation_error',
            errors: { email: 'Required' },
          }),
          { status: 400 }
        )
      );

      expect(error.hasFieldErrors()).toBe(true);
    });

    it('returns false when no field errors exist', async () => {
      const error = await ApiError.fromResponse(
        new Response(
          JSON.stringify({ errorCode: 'validation_error' }),
          { status: 400 }
        )
      );

      expect(error.hasFieldErrors()).toBe(false);
    });

    it('returns false when fieldErrors is empty object', async () => {
      const error = await ApiError.fromResponse(
        new Response(
          JSON.stringify({
            errorCode: 'validation_error',
            errors: {},
          }),
          { status: 400 }
        )
      );

      expect(error.hasFieldErrors()).toBe(false);
    });
  });
});
