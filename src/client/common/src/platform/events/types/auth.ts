import { type BaseEvent, createBaseEvent } from './base';
import type { IdentityUserModel } from '../../../models/identity-user-model';

export const AUTH_EVENT_TYPES = {
  AUTH: {
    // User authentication events
    USER_SIGNED_IN: 'user_signed_in',
    USER_SIGNED_OUT: 'user_signed_out',
    USER_SESSION_RESTORED: 'user_session_restored',
    USER_SESSION_EXPIRED: 'user_session_expired',

    // Token events
    TOKEN_REFRESHED: 'token_refreshed',
    TOKEN_EXPIRED: 'token_expired',

    // Error events
    AUTH_ERROR: 'auth_error',
    LOGIN_FAILED: 'login_failed',
    REGISTRATION_FAILED: 'registration_failed'
  }
} as const;

// ============================================================================
// Authentication Events
// ============================================================================

/**
 * Event when a user successfully signs in
 */
export interface UserSignedInEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.USER_SIGNED_IN;
  user: IdentityUserModel<string>;
  timestamp: Date;
}

/**
 * Event when a user signs out
 */
export interface UserSignedOutEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.USER_SIGNED_OUT;
  userId?: string;
  timestamp: Date;
}

/**
 * Event when a user session is restored from storage
 */
export interface UserSessionRestoredEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.USER_SESSION_RESTORED;
  user: IdentityUserModel<string>;
  timestamp: Date;
}

/**
 * Event when a user session expires
 */
export interface UserSessionExpiredEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.USER_SESSION_EXPIRED;
  userId?: string;
  timestamp: Date;
}

/**
 * Event when a token is refreshed
 */
export interface TokenRefreshedEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.TOKEN_REFRESHED;
  userId: string;
  timestamp: Date;
}

/**
 * Event when a token expires
 */
export interface TokenExpiredEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.TOKEN_EXPIRED;
  userId?: string;
  timestamp: Date;
}

/**
 * Event when an authentication error occurs
 */
export interface AuthErrorEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.AUTH_ERROR;
  error: string;
  errorCode?: string;
  timestamp: Date;
}

/**
 * Event when login fails
 */
export interface LoginFailedEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.LOGIN_FAILED;
  error: string;
  errorCode?: string;
  timestamp: Date;
}

/**
 * Event when registration fails
 */
export interface RegistrationFailedEvent extends BaseEvent {
  type: typeof AUTH_EVENT_TYPES.AUTH.REGISTRATION_FAILED;
  error: string;
  errorCode?: string;
  timestamp: Date;
}

// ============================================================================
// Auth Event Union
// ============================================================================

/**
 * Union of all authentication events
 */
export type AuthEvent
  = UserSignedInEvent
  | UserSignedOutEvent
  | UserSessionRestoredEvent
  | UserSessionExpiredEvent
  | TokenRefreshedEvent
  | TokenExpiredEvent
  | AuthErrorEvent
  | LoginFailedEvent
  | RegistrationFailedEvent
  ;

// ============================================================================
// Event Creation Utilities
// ============================================================================

/**
 * Create a user signed in event
 */
export function createUserSignedInEvent(user: IdentityUserModel<string>): UserSignedInEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.USER_SIGNED_IN,
    user,
    timestamp: new Date()
  };
}

/**
 * Create a user signed out event
 */
export function createUserSignedOutEvent(userId?: string): UserSignedOutEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.USER_SIGNED_OUT,
    userId,
    timestamp: new Date()
  };
}

/**
 * Create a user session restored event
 */
export function createUserSessionRestoredEvent(user: IdentityUserModel<string>): UserSessionRestoredEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.USER_SESSION_RESTORED,
    user,
    timestamp: new Date()
  };
}

/**
 * Create a user session expired event
 */
export function createUserSessionExpiredEvent(userId?: string): UserSessionExpiredEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.USER_SESSION_EXPIRED,
    userId,
    timestamp: new Date()
  };
}

/**
 * Create a token refreshed event
 */
export function createTokenRefreshedEvent(userId: string): TokenRefreshedEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.TOKEN_REFRESHED,
    userId,
    timestamp: new Date()
  };
}

/**
 * Create a token expired event
 */
export function createTokenExpiredEvent(userId?: string): TokenExpiredEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.TOKEN_EXPIRED,
    userId,
    timestamp: new Date()
  };
}

/**
 * Create an auth error event
 */
export function createAuthErrorEvent(error: string, errorCode?: string): AuthErrorEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.AUTH_ERROR,
    error,
    errorCode,
    timestamp: new Date()
  };
}

/**
 * Create a login failed event
 */
export function createLoginFailedEvent(error: string, errorCode?: string): LoginFailedEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.LOGIN_FAILED,
    error,
    errorCode,
    timestamp: new Date()
  };
}

/**
 * Create a registration failed event
 */
export function createRegistrationFailedEvent(error: string, errorCode?: string): RegistrationFailedEvent {
  return {
    ...createBaseEvent(),
    type: AUTH_EVENT_TYPES.AUTH.REGISTRATION_FAILED,
    error,
    errorCode,
    timestamp: new Date()
  };
}
