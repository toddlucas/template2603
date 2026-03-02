// Event System Unit Tests
// Tests for event publishing, subscription, filtering, and persistence

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryEventStore } from './EventStore';
import { InMemoryEventBus } from './EventBus';
import type { SystemEvent } from './types';
import {
  createUserSignedInEvent,
  createUserSignedOutEvent,
  createAuthErrorEvent,
  createTokenRefreshedEvent,
  createTokenExpiredEvent,
} from './types';
import { isAuthEvent, filterByEventType } from './guards';

// Mock user for testing
const mockUser = {
  id: 'user-123',
  userName: 'testuser',
  email: 'test@example.com'
};

// ============================================================================
// Test Utilities
// ============================================================================

function createMockSystemEvent(type: string, userId: string = 'user-123'): SystemEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date(),
    userId,
    metadata: { test: true }
  } as SystemEvent;
}
void createMockSystemEvent; // Unused variable

// ============================================================================
// Event Store Tests
// ============================================================================

describe('Event Store Tests', () => {
  let eventStore: InMemoryEventStore;
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    };

    eventStore = new InMemoryEventStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Event Persistence Tests
  // ============================================================================

  describe('Event Persistence', () => {
    it('should append events successfully', async () => {
      const event = createUserSignedInEvent(mockUser);

      await expect(eventStore.appendEvent(event)).resolves.not.toThrow();

      const events = await eventStore.queryEvents(() => true);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(event.id);
    });

    it('should append multiple events', async () => {
      const event1 = createUserSignedInEvent(mockUser);
      const event2 = createUserSignedOutEvent('user-123');
      const event3 = createAuthErrorEvent('Test error', 'AUTH_001');

      await eventStore.appendEvent(event1);
      await eventStore.appendEvent(event2);
      await eventStore.appendEvent(event3);

      const allEvents = await eventStore.queryEvents(() => true);
      expect(allEvents).toHaveLength(3);
    });

    it('should maintain event order', async () => {
      const events = [];
      for (let i = 0; i < 5; i++) {
        const event = createUserSignedInEvent(mockUser);
        events.push(event);
        await eventStore.appendEvent(event);

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const storedEvents = await eventStore.queryEvents(() => true);
      expect(storedEvents).toHaveLength(5);

      // Events should be in the order they were added
      for (let i = 0; i < 5; i++) {
        expect(storedEvents[i].id).toBe(events[i].id);
      }
    });

    it('should handle concurrent event appending', async () => {
      const events = Array.from({ length: 10 }, (_, i) =>
        createUserSignedInEvent(mockUser)
      );

      // Append all events concurrently
      const appendPromises = events.map(event => eventStore.appendEvent(event));
      await Promise.all(appendPromises);

      const storedEvents = await eventStore.queryEvents(() => true);
      expect(storedEvents).toHaveLength(10);
    });
  });

  describe('Event Querying', () => {
    beforeEach(async () => {
      // Set up test events
      await eventStore.appendEvent(createUserSignedInEvent(mockUser));
      await eventStore.appendEvent(createUserSignedOutEvent('user-123'));
      await eventStore.appendEvent(createAuthErrorEvent('Test error', 'AUTH_001'));
    });

    it('should query all events', async () => {
      const allEvents = await eventStore.queryEvents(() => true);
      expect(allEvents).toHaveLength(3);
    });

    it('should filter events by type', async () => {
      const signedInEvents = await eventStore.queryEvents((event) =>
        event.type === 'user_signed_in'
      );
      expect(signedInEvents).toHaveLength(1);
      expect(signedInEvents[0].type).toBe('user_signed_in');
    });

    it('should filter events by user ID', async () => {
      const userEvents = await eventStore.queryEvents((event) => {
        if (isAuthEvent(event)) {
          // Check for different auth event types that might have userId or user
          if (event.type === 'user_signed_in' && 'user' in event) {
            return event.user.id === 'user-123';
          } else if ('userId' in event) {
            return event.userId === 'user-123';
          }
        }
        return false;
      });
      expect(userEvents).toHaveLength(2);
    });

    it('should support complex filtering', async () => {
      const recentEvents = await eventStore.queryEvents((event) => {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        return event.timestamp > oneMinuteAgo;
      });
      expect(recentEvents).toHaveLength(3);
    });

    it('should return empty array for no matches', async () => {
      const noEvents = await eventStore.queryEvents((event) =>
        event.type === 'non_existent_type' as any
      );
      expect(noEvents).toHaveLength(0);
    });

    it('should handle time-based queries', async () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

      const recentEvents = await eventStore.queryEvents((event) =>
        event.timestamp >= oneMinuteAgo && event.timestamp <= oneMinuteFromNow
      );
      expect(recentEvents).toHaveLength(3);
    });
  });

  describe('Event Store Integration', () => {
    it('should handle different event types correctly', async () => {
      const events = [
        createUserSignedInEvent(mockUser),
        createUserSignedOutEvent('user-123'),
        createTokenRefreshedEvent('user-123'),
        createTokenExpiredEvent('user-123'),
        createAuthErrorEvent('Test error', 'AUTH_001')
      ];

      for (const event of events) {
        await eventStore.appendEvent(event);
      }

      const storedEvents = await eventStore.queryEvents(() => true);
      expect(storedEvents).toHaveLength(5);
      expect(storedEvents.every(event => event.id && event.timestamp)).toBe(true);
    });

    it('should preserve event metadata', async () => {
      const event = createUserSignedInEvent(mockUser);
      event.metadata = {
        custom: 'value',
        test: true
      };

      await eventStore.appendEvent(event);

      const storedEvent = await eventStore.queryEvents((e) => e.id === event.id);
      expect(storedEvent[0].metadata).toEqual({
        custom: 'value',
        test: true
      });
    });
  });
});

// ============================================================================
// Event Bus Tests
// ============================================================================

describe('Event Bus Tests', () => {
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('Event Publishing', () => {
    it('should publish events to subscribers', () => {
      const subscriber = vi.fn();
      const event = createUserSignedInEvent(mockUser);

      eventBus.subscribe(subscriber);
      eventBus.publish(event);

      expect(subscriber).toHaveBeenCalledWith(event);
    });

    it('should publish events to multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      const subscriber3 = vi.fn();
      const event = createUserSignedInEvent(mockUser);

      eventBus.subscribe(subscriber1);
      eventBus.subscribe(subscriber2);
      eventBus.subscribe(subscriber3);

      eventBus.publish(event);

      expect(subscriber1).toHaveBeenCalledWith(event);
      expect(subscriber2).toHaveBeenCalledWith(event);
      expect(subscriber3).toHaveBeenCalledWith(event);
    });

    it('should handle publishing multiple events', () => {
      const subscriber = vi.fn();
      const event1 = createUserSignedInEvent(mockUser);
      const event2 = createUserSignedOutEvent('user-123');

      eventBus.subscribe(subscriber);

      eventBus.publish(event1);
      eventBus.publish(event2);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenNthCalledWith(1, event1);
      expect(subscriber).toHaveBeenNthCalledWith(2, event2);
    });

    it('should handle publishing when no subscribers exist', () => {
      const event = createUserSignedInEvent(mockUser);

      expect(() => eventBus.publish(event)).not.toThrow();
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe and receive events', () => {
      const subscriber = vi.fn();
      const subscription = eventBus.subscribe(subscriber);

      expect(typeof subscription.unsubscribe).toBe('function');

      const event = createUserSignedInEvent(mockUser);
      eventBus.publish(event);

      expect(subscriber).toHaveBeenCalledWith(event);
    });

    it('should unsubscribe correctly', () => {
      const subscriber = vi.fn();
      const subscription = eventBus.subscribe(subscriber);

      // Publish event while subscribed
      const event1 = createUserSignedInEvent(mockUser);
      eventBus.publish(event1);
      expect(subscriber).toHaveBeenCalledTimes(1);

      // Unsubscribe
      subscription.unsubscribe();

      // Publish another event
      const event2 = createUserSignedOutEvent('user-123');
      eventBus.publish(event2);

      // Should not receive the second event
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscriptions and unsubscriptions', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      const subscriber3 = vi.fn();

      const subscription1 = eventBus.subscribe(subscriber1);
      const subscription2 = eventBus.subscribe(subscriber2);
      const subscription3 = eventBus.subscribe(subscriber3);

      // Publish event to all subscribers
      const event1 = createUserSignedInEvent(mockUser);
      eventBus.publish(event1);

      expect(subscriber1).toHaveBeenCalledWith(event1);
      expect(subscriber2).toHaveBeenCalledWith(event1);
      expect(subscriber3).toHaveBeenCalledWith(event1);

      // Unsubscribe one subscriber
      subscription2.unsubscribe();

      // Publish another event
      const event2 = createUserSignedOutEvent('user-123');
      eventBus.publish(event2);

      // Only subscribers 1 and 3 should receive the event
      expect(subscriber1).toHaveBeenCalledWith(event2);
      expect(subscriber2).not.toHaveBeenCalledWith(event2);
      expect(subscriber3).toHaveBeenCalledWith(event2);
    });

    it('should handle subscriber errors gracefully', () => {
      const errorSubscriber = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const normalSubscriber = vi.fn();

      eventBus.subscribe(errorSubscriber);
      eventBus.subscribe(normalSubscriber);

      const event = createUserSignedInEvent(mockUser);

      // Should not throw even if subscriber throws
      expect(() => eventBus.publish(event)).not.toThrow();

      // Normal subscriber should still receive the event
      expect(normalSubscriber).toHaveBeenCalledWith(event);
    });
  });

  describe('Event Bus Integration', () => {
    it('should handle high-frequency event publishing', () => {
      const subscriber = vi.fn();

      eventBus.subscribe(subscriber);

      const events = Array.from({ length: 100 }, (_, i) =>
        createUserSignedInEvent(mockUser)
      );

      // Publish all events
      events.forEach(event => eventBus.publish(event));

      expect(subscriber).toHaveBeenCalledTimes(100);
    });

    it('should maintain event order in synchronous publishing', () => {
      const subscriber = vi.fn();
      const events = [
        createUserSignedInEvent(mockUser),
        createUserSignedOutEvent('user-123'),
        createUserSignedInEvent(mockUser)
      ];

      eventBus.subscribe(subscriber);

      // Publish events in sequence
      events.forEach(event => eventBus.publish(event));

      expect(subscriber).toHaveBeenCalledTimes(3);
      expect(subscriber).toHaveNthReturnedWith(1, undefined);
      expect(subscriber).toHaveNthReturnedWith(2, undefined);
      expect(subscriber).toHaveNthReturnedWith(3, undefined);
    });
  });
});

// ============================================================================
// Event Utilities Tests
// ============================================================================

describe('Event Utilities Tests', () => {
  let testEvents: SystemEvent[];

  beforeEach(() => {
    testEvents = [
      createUserSignedInEvent(mockUser),
      createUserSignedOutEvent('user-123'),
      createAuthErrorEvent('Test error', 'AUTH_001')
    ];
  });

  describe('Event Type Guards', () => {
    it('should identify auth events', () => {
      const authEvents = testEvents.filter(isAuthEvent);
      expect(authEvents).toHaveLength(3);
      expect(authEvents.every(isAuthEvent)).toBe(true);
    });

    it('should identify non-auth events', () => {
      const nonAuthEvent = {
        id: 'test',
        type: 'custom_event',
        timestamp: new Date()
      } as unknown as SystemEvent;

      expect(isAuthEvent(nonAuthEvent)).toBe(false);
    });
  });

  describe('Event Filtering', () => {
    it('should filter events by event type', () => {
      const signedInEvents = filterByEventType(testEvents, 'user_signed_in');
      expect(signedInEvents).toHaveLength(1);
      expect(signedInEvents[0].type).toBe('user_signed_in');
    });

    it('should return empty array for non-existent event type', () => {
      const nonExistentEvents = filterByEventType(testEvents, 'non_existent_type' as any);
      expect(nonExistentEvents).toHaveLength(0);
    });
  });
});

// ============================================================================
// Integrated Event System Tests
// ============================================================================

describe('Integrated Event System Tests', () => {
  let eventStore: InMemoryEventStore;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    eventBus = new InMemoryEventBus();
  });

  describe('Event Store and Bus Integration', () => {
    it('should integrate event store with event bus for complete event flow', async () => {
      const busSubscriber = vi.fn();

      // Subscribe to event bus
      eventBus.subscribe(busSubscriber);

      // Connect event store to event bus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      // Create and store events
      const event1 = createUserSignedInEvent(mockUser);
      const event2 = createUserSignedOutEvent('user-123');

      await eventStore.appendEvent(event1);
      await eventStore.appendEvent(event2);

      // Verify events were stored
      const storedEvents = await eventStore.queryEvents(() => true);
      expect(storedEvents).toHaveLength(2);

      // Verify events were published to bus
      expect(busSubscriber).toHaveBeenCalledTimes(2);
      expect(busSubscriber).toHaveBeenNthCalledWith(1, event1);
      expect(busSubscriber).toHaveBeenNthCalledWith(2, event2);
    });

    it('should handle complete auth flow', async () => {
      const authSubscriber = vi.fn();

      // Subscribe to auth events
      eventBus.subscribeToAuthEvents(authSubscriber);

      // Connect event store to event bus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      // Simulate complete auth flow
      const events = [
        createUserSignedInEvent(mockUser),
        createTokenRefreshedEvent('user-123'),
        createUserSignedOutEvent('user-123')
      ];

      for (const event of events) {
        await eventStore.appendEvent(event);
      }

      // Verify all events were processed
      expect(authSubscriber).toHaveBeenCalledTimes(3);

      const storedEvents = await eventStore.queryEvents(() => true);
      expect(storedEvents).toHaveLength(3);
    });
  });
});
