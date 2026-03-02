// Base event interface with common properties
export interface BaseEvent {
  id: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Event creation utilities
export function createBaseEvent(id?: string): Omit<BaseEvent, 'timestamp'> {
  return {
    id: id || crypto.randomUUID(),
    metadata: {}
  };
}
