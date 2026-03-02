import { LOG_CONFIG, LOG_LEVELS } from '../logging';
import type { SystemEvent } from './types';

export interface EventStore {
  // Core operations
  appendEvent(event: SystemEvent): Promise<void>;

  // Querying
  queryEvents(predicate: (event: SystemEvent) => boolean): Promise<SystemEvent[]>;
  getEventsByProperty<K extends keyof SystemEvent>(
    property: K,
    value: SystemEvent[K]
  ): Promise<SystemEvent[]>;

  // Observation
  onEventAppended(callback: (event: SystemEvent) => void): void;

  // Persistence
  save(): Promise<void>;
  load(): Promise<void>;
}

export class InMemoryEventStore implements EventStore {
  private events: SystemEvent[] = [];
  private observers: Set<(event: SystemEvent) => void> = new Set();

  async appendEvent(event: SystemEvent): Promise<void> {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.VERBOSE) console.log('📤 [EVENT] EventStore: Appending event:', event.type, event.id);

    // Validate event
    if (!event.id || !event.timestamp) {
      throw new Error('Invalid event: missing required fields');
    }

    // Add event to store
    this.events.push(event);

    // Notify observers
    for (const observer of this.observers) {
      try {
        observer(event);
      } catch (error) {
        console.error('Error in event observer:', error);
      }
    }
  }

  async queryEvents(predicate: (event: SystemEvent) => boolean): Promise<SystemEvent[]> {
    return this.events.filter(predicate);
  }

  async getEventsByProperty<K extends keyof SystemEvent>(
    property: K,
    value: SystemEvent[K]
  ): Promise<SystemEvent[]> {
    return this.events.filter(event => event[property] === value);
  }

  onEventAppended(callback: (event: SystemEvent) => void): void {
    this.observers.add(callback);
  }

  // Remove observer (useful for cleanup)
  removeObserver(callback: (event: SystemEvent) => void): void {
    this.observers.delete(callback);
  }

  // Get all events (useful for debugging/testing)
  getAllEvents(): SystemEvent[] {
    return [...this.events];
  }

  // Get event count (useful for monitoring)
  getEventCount(): number {
    return this.events.length;
  }

  // Clear all events (useful for testing)
  clear(): void {
    this.events = [];
  }

  // Persistence methods (basic implementation)
  async save(): Promise<void> {
    // TODO: Implement file-based persistence
    console.log('EventStore.save() - not yet implemented');
  }

  async load(): Promise<void> {
    // TODO: Implement file-based loading
    console.log('EventStore.load() - not yet implemented');
  }
}
