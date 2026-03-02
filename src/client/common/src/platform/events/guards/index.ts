import type { SystemEvent } from '../types';

export * from './auth';

// ============================================================================
// Event Filtering Utilities
// ============================================================================

export function filterByEventType<T extends SystemEvent>(
  events: SystemEvent[],
  type: T['type']
): T[] {
  return events.filter((event): event is T => event.type === type);
}
