import type { SystemEvent } from '../types';
import type { AuthEvent } from '../types/auth';
import { AUTH_EVENT_TYPES } from '../types/auth';

/**
 * Type guard to check if an event is an auth event
 */
export function isAuthEvent(event: SystemEvent): event is AuthEvent {
  return event.type.startsWith('user_') ||
         event.type.startsWith('token_') ||
         event.type.startsWith('auth_') ||
         event.type.startsWith('login_') ||
         event.type.startsWith('registration_');
}

/**
 * Type guard to check if an event is a user signed in event
 */
export function isUserSignedInEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.USER_SIGNED_IN;
}

/**
 * Type guard to check if an event is a user signed out event
 */
export function isUserSignedOutEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.USER_SIGNED_OUT;
}

/**
 * Type guard to check if an event is a user session restored event
 */
export function isUserSessionRestoredEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.USER_SESSION_RESTORED;
}

/**
 * Type guard to check if an event is a user session expired event
 */
export function isUserSessionExpiredEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.USER_SESSION_EXPIRED;
}

/**
 * Type guard to check if an event is a token refreshed event
 */
export function isTokenRefreshedEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.TOKEN_REFRESHED;
}

/**
 * Type guard to check if an event is a token expired event
 */
export function isTokenExpiredEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.TOKEN_EXPIRED;
}

/**
 * Type guard to check if an event is an auth error event
 */
export function isAuthErrorEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.AUTH_ERROR;
}

/**
 * Type guard to check if an event is a login failed event
 */
export function isLoginFailedEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.LOGIN_FAILED;
}

/**
 * Type guard to check if an event is a registration failed event
 */
export function isRegistrationFailedEvent(event: SystemEvent): event is AuthEvent {
  return event.type === AUTH_EVENT_TYPES.AUTH.REGISTRATION_FAILED;
}
