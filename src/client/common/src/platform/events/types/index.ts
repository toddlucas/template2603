// Re-export base types
export * from './base';

// Re-export domain-specific event types
export * from './auth';

// Import all event types for the union
import { type AuthEvent, AUTH_EVENT_TYPES } from './auth';

// Event type constants for consistency
export const EVENT_TYPES = {
  ...AUTH_EVENT_TYPES
} as const;

// ============================================================================
// System Event Union
// ============================================================================

/**
 * Discriminated union of all system events
 */
export type SystemEvent
  = AuthEvent
  ;

export type EventCategory =
  | 'auth_event'
  | 'system_event' // fallback
  ;
