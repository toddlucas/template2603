import type {
  SystemEvent,
  AuthEvent,
  EventCategory,
} from './types';
import {
  isAuthEvent
} from './guards';
import { LOG_CONFIG, LOG_LEVELS } from '../logging';

export interface EventSubscription {
  unsubscribe(): void;
}

export interface EventBus {
  // Core methods
  on<K extends SystemEvent['type']>(eventType: K, handler: (event: Extract<SystemEvent, { type: K }>) => void): EventSubscription;
  onCategory<C extends EventCategory>(category: C, handler: (event: EventCategoryMap[C]) => void): EventSubscription;

  // Simple emission method
  emit(event: SystemEvent): Promise<void>;

  // Backward compatibility (alias for emit)
  publish(event: SystemEvent): Promise<void>;

  // Legacy methods for backward compatibility
  subscribe(callback: (event: SystemEvent) => void): EventSubscription;
  subscribeToType<T extends SystemEvent>(eventType: T['type'], callback: (event: T) => void): EventSubscription;
  subscribeToAuthEvents(callback: (event: AuthEvent) => void): EventSubscription;

  // Utility methods
  clear(): void;
}

// Type mapping for categories
export interface EventCategoryMap {
  auth_event: AuthEvent;
  system_event: SystemEvent;
}

export class InMemoryEventBus implements EventBus {
  // Separate maps for different subscription types
  private typeSubscriptions: Map<SystemEvent['type'], Set<(event: SystemEvent) => void>> = new Map();
  private categorySubscriptions: Map<EventCategory, Set<(event: SystemEvent) => void>> = new Map();
  private globalSubscriptions: Set<(event: SystemEvent) => void> = new Set();

  // Core methods
  on<K extends SystemEvent['type']>(eventType: K, handler: (event: Extract<SystemEvent, { type: K }>) => void): EventSubscription {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.VERBOSE) console.log('📤 [EVENT] EventBus: Subscribing to event type:', eventType);

    if (!this.typeSubscriptions.has(eventType)) {
      this.typeSubscriptions.set(eventType, new Set());
    }
    const subscribers = this.typeSubscriptions.get(eventType)!;
    subscribers.add(handler as (event: SystemEvent) => void);

    return {
      unsubscribe: () => {
        subscribers.delete(handler as (event: SystemEvent) => void);
      }
    };
  }

  onCategory<C extends EventCategory>(category: C, handler: (event: EventCategoryMap[C]) => void): EventSubscription {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.VERBOSE) console.log('📤 [EVENT] EventBus: Subscribing to category:', category);

    if (!this.categorySubscriptions.has(category)) {
      this.categorySubscriptions.set(category, new Set());
    }
    const subscribers = this.categorySubscriptions.get(category)!;
    subscribers.add(handler as (event: SystemEvent) => void);

    return {
      unsubscribe: () => {
        subscribers.delete(handler as (event: SystemEvent) => void);
      }
    };
  }

  async emit(event: SystemEvent): Promise<void> {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.DEBUG) console.log('📤 [EVENT] EventBus: Emitting event:', event.type, event.id);

    // Validate event
    if (!event.id || !event.timestamp) {
      throw new Error('Invalid event: missing required fields');
    }

    // 1. Notify type-specific subscribers
    const typeSubscribers = this.typeSubscriptions.get(event.type);
    if (typeSubscribers) {
      for (const callback of typeSubscribers) {
        try {
          callback(event);
        } catch (error) {
          if (LOG_CONFIG.EVENT >= LOG_LEVELS.ERROR) console.error('❌ [EVENT] EventBus: Error in type-specific event subscriber:', error);
        }
      }
    }

    // 2. Notify category subscribers
    const category = this.getEventCategory(event);
    if (category) {
      const categorySubscribers = this.categorySubscriptions.get(category);
      if (categorySubscribers) {
        for (const callback of categorySubscribers) {
          try {
            callback(event);
          } catch (error) {
            if (LOG_CONFIG.EVENT >= LOG_LEVELS.ERROR) console.error('❌ [EVENT] EventBus: Error in category event subscriber:', error);
          }
        }
      }
    }

    // 3. Notify global subscribers
    for (const callback of this.globalSubscriptions) {
      try {
        callback(event);
      } catch (error) {
        if (LOG_CONFIG.EVENT >= LOG_LEVELS.ERROR) console.error('❌ [EVENT] EventBus: Error in global event subscriber:', error);
      }
    }
  }

  // Backward compatibility (alias for emit)
  async publish(event: SystemEvent): Promise<void> {
    return this.emit(event);
  }

  // Legacy methods for backward compatibility
  subscribe(callback: (event: SystemEvent) => void): EventSubscription {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.VERBOSE) console.log('📤 [EVENT] EventBus: Subscribing to global event:', callback);

    this.globalSubscriptions.add(callback);
    return {
      unsubscribe: () => {
        this.globalSubscriptions.delete(callback);
      }
    };
  }

  subscribeToType<T extends SystemEvent>(eventType: T['type'], callback: (event: T) => void): EventSubscription {
    if (LOG_CONFIG.EVENT >= LOG_LEVELS.VERBOSE) console.log('📤 [EVENT] EventBus: Subscribing to type:', eventType, callback);

    if (!this.typeSubscriptions.has(eventType)) {
      this.typeSubscriptions.set(eventType, new Set());
    }
    const subscribers = this.typeSubscriptions.get(eventType)!;
    subscribers.add(callback as (event: SystemEvent) => void);
    return {
      unsubscribe: () => {
        subscribers.delete(callback as (event: SystemEvent) => void);
      }
    };
  }

  // Domain-specific wrappers (thin wrappers around onCategory)
  subscribeToAuthEvents(callback: (event: AuthEvent) => void): EventSubscription {
    return this.onCategory('auth_event', callback);
  }

  // Utility methods for monitoring and debugging
  getSubscriptionCounts(): Record<string, number> {
    return {
      global: this.globalSubscriptions.size,
      typeSpecific: this.typeSubscriptions.size,
      auth: this.categorySubscriptions.get('auth_event')?.size || 0,
      system: this.categorySubscriptions.get('system_event')?.size || 0
    };
  }

  // Clear all subscriptions (useful for testing)
  clear(): void {
    this.globalSubscriptions.clear();
    this.typeSubscriptions.clear();
    this.categorySubscriptions.clear();
  }

  // Helper method to determine event category using existing type guards
  private getEventCategory(event: SystemEvent): EventCategory | null {
    if (isAuthEvent(event)) {
      return 'auth_event';
    } else {
      return 'system_event';
    }
  }
}
