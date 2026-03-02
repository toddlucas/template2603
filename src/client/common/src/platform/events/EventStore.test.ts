import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventStore } from './EventStore';
import {
  createUserSignedInEvent,
  createUserSignedOutEvent,
  EVENT_TYPES
} from './types';
import {
  isAuthEvent
} from './guards';

// Mock user for testing
const mockUser = {
  id: 'user-123',
  userName: 'testuser',
  email: 'test@example.com'
};

describe('EventStore', () => {
  let eventStore: InMemoryEventStore;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
  });

  describe('appendEvent', () => {
    it('should store events correctly', async () => {
      const authEvent = createUserSignedInEvent(mockUser);

      await eventStore.appendEvent(authEvent);

      const events = await eventStore.queryEvents(() => true);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(authEvent);
    });

    it('should validate required fields', async () => {
      const invalidEvent = {
        id: 'test-id',
        // Missing timestamp
        type: 'user_signed_in',
        user: mockUser
      };

      await expect(eventStore.appendEvent(invalidEvent as any)).rejects.toThrow(
        'Invalid event: missing required fields'
      );
    });

    it('should notify observers when events are appended', async () => {
      const observer = vi.fn();
      eventStore.onEventAppended(observer);

      const authEvent = createUserSignedInEvent(mockUser);

      await eventStore.appendEvent(authEvent);

      expect(observer).toHaveBeenCalledWith(authEvent);
    });
  });

  describe('queryEvents', () => {
    beforeEach(async () => {
      // Add some test events
      await eventStore.appendEvent(createUserSignedInEvent(mockUser));
      await eventStore.appendEvent(createUserSignedOutEvent('user-123'));
    });

    it('should filter events by predicate', async () => {
      const authEvents = await eventStore.queryEvents(isAuthEvent);
      expect(authEvents).toHaveLength(2);
      expect(authEvents.every(isAuthEvent)).toBe(true);
    });

    it('should return all events when predicate is always true', async () => {
      const allEvents = await eventStore.queryEvents(() => true);
      expect(allEvents).toHaveLength(2);
    });

    it('should return empty array when predicate is always false', async () => {
      const noEvents = await eventStore.queryEvents(() => false);
      expect(noEvents).toHaveLength(0);
    });
  });

  describe('getEventsByProperty', () => {
    beforeEach(async () => {
      await eventStore.appendEvent(createUserSignedInEvent(mockUser));
      await eventStore.appendEvent(createUserSignedOutEvent('user-123'));
    });

    it('should filter events by type', async () => {
      const signedInEvents = await eventStore.getEventsByProperty('type', EVENT_TYPES.AUTH.USER_SIGNED_IN);
      expect(signedInEvents).toHaveLength(1);
      expect(signedInEvents[0].type).toBe(EVENT_TYPES.AUTH.USER_SIGNED_IN);
    });

    it('should filter events by different type', async () => {
      const signedOutEvents = await eventStore.getEventsByProperty('type', EVENT_TYPES.AUTH.USER_SIGNED_OUT);
      expect(signedOutEvents).toHaveLength(1);
      expect(signedOutEvents[0].type).toBe(EVENT_TYPES.AUTH.USER_SIGNED_OUT);
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      await eventStore.appendEvent(createUserSignedInEvent(mockUser));
    });

    it('should return all events', () => {
      const events = eventStore.getAllEvents();
      expect(events).toHaveLength(1);
    });

    it('should return correct event count', () => {
      expect(eventStore.getEventCount()).toBe(1);
    });

    it('should clear all events', () => {
      eventStore.clear();
      expect(eventStore.getEventCount()).toBe(0);
    });
  });
});
