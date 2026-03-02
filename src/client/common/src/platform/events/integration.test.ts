import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventStore } from './EventStore';
import { InMemoryEventBus } from './EventBus';
import {
  createUserSignedInEvent,
  createUserSignedOutEvent,
  createAuthErrorEvent,
  createTokenRefreshedEvent,
  EVENT_TYPES
} from './types';

// Mock user for testing
const mockUser = {
  id: 'user-123',
  userName: 'testuser',
  email: 'test@example.com'
};

describe('EventStore + EventBus Integration', () => {
  let eventStore: InMemoryEventStore;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    eventBus = new InMemoryEventBus();
  });

  describe('EventStore observes EventBus', () => {
    it('should notify EventBus when events are appended', async () => {
      const busCallback = vi.fn();
      eventBus.subscribe(busCallback);

      // Connect EventStore to EventBus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      const authEvent = createUserSignedInEvent(mockUser);

      await eventStore.appendEvent(authEvent);

      expect(busCallback).toHaveBeenCalledWith(authEvent);
    });

    it('should handle multiple events in sequence', async () => {
      const busCallback = vi.fn();
      eventBus.subscribe(busCallback);

      // Connect EventStore to EventBus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      const authEvent1 = createUserSignedInEvent(mockUser);
      const authEvent2 = createUserSignedOutEvent('user-123');

      await eventStore.appendEvent(authEvent1);
      await eventStore.appendEvent(authEvent2);

      expect(busCallback).toHaveBeenCalledTimes(2);
      expect(busCallback).toHaveBeenNthCalledWith(1, authEvent1);
      expect(busCallback).toHaveBeenNthCalledWith(2, authEvent2);
    });
  });

  describe('Type-safe subscriptions', () => {
    it('should handle auth event subscriptions correctly', async () => {
      const authCallback = vi.fn();

      eventBus.subscribeToAuthEvents(authCallback);

      // Connect EventStore to EventBus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      const authEvent1 = createUserSignedInEvent(mockUser);
      const authEvent2 = createTokenRefreshedEvent('user-123');

      await eventStore.appendEvent(authEvent1);
      await eventStore.appendEvent(authEvent2);

      expect(authCallback).toHaveBeenCalledWith(authEvent1);
      expect(authCallback).toHaveBeenCalledWith(authEvent2);
    });
  });

  describe('Event querying and filtering', () => {
    beforeEach(async () => {
      // Add some test events
      await eventStore.appendEvent(createUserSignedInEvent(mockUser));
      await eventStore.appendEvent(createUserSignedOutEvent('user-123'));
      await eventStore.appendEvent(createAuthErrorEvent('Test error', 'AUTH_001'));
    });

    it('should query events by type', async () => {
      const signedInEvents = await eventStore.queryEvents((event) =>
        event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN
      );
      expect(signedInEvents).toHaveLength(1);
      expect(signedInEvents[0].type).toBe(EVENT_TYPES.AUTH.USER_SIGNED_IN);
    });

    it('should query all events', async () => {
      const allEvents = await eventStore.queryEvents(() => true);
      expect(allEvents).toHaveLength(3);
    });
  });

  describe('Error handling', () => {
    it('should handle errors in EventBus subscribers gracefully', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const normalCallback = vi.fn();

      eventBus.subscribe(errorCallback);
      eventBus.subscribe(normalCallback);

      // Connect EventStore to EventBus
      eventStore.onEventAppended((event) => {
        eventBus.publish(event);
      });

      const authEvent = createUserSignedInEvent(mockUser);

      // Should not throw
      await expect(eventStore.appendEvent(authEvent)).resolves.not.toThrow();

      // Normal callback should still be called
      expect(normalCallback).toHaveBeenCalledWith(authEvent);
    });
  });
});
