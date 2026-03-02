import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus } from './EventBus';
import {
  createUserSignedInEvent,
  createUserSignedOutEvent,
  createAuthErrorEvent,
  createTokenRefreshedEvent,
  EVENT_TYPES
} from './types';
import type { AuthEvent } from './types';

// Mock user for testing
const mockUser = {
  id: 'user-123',
  userName: 'testuser',
  email: 'test@example.com'
};

describe('InMemoryEventBus', () => {
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });

  describe('publish and subscribe', () => {
    it('should notify global subscribers when events are published', async () => {
      const receivedEvents: any[] = [];
      const callback = (event: any) => receivedEvents.push(event);

      const subscription = eventBus.subscribe(callback);

      const event = createUserSignedInEvent(mockUser);
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);

      subscription.unsubscribe();
    });

    it('should notify multiple global subscribers', async () => {
      const receivedEvents1: any[] = [];
      const receivedEvents2: any[] = [];

      const subscription1 = eventBus.subscribe((event) => receivedEvents1.push(event));
      const subscription2 = eventBus.subscribe((event) => receivedEvents2.push(event));

      const event = createUserSignedInEvent(mockUser);
      await eventBus.publish(event);

      expect(receivedEvents1).toHaveLength(1);
      expect(receivedEvents2).toHaveLength(1);
      expect(receivedEvents1[0]).toBe(event);
      expect(receivedEvents2[0]).toBe(event);

      subscription1.unsubscribe();
      subscription2.unsubscribe();
    });
  });

  describe('subscribeToType', () => {
    it('should notify type-specific subscribers', async () => {
      const receivedEvents: any[] = [];
      const callback = (event: any) => receivedEvents.push(event);

      const subscription = eventBus.subscribeToType(EVENT_TYPES.AUTH.USER_SIGNED_IN, callback);

      const event = createUserSignedInEvent(mockUser);
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);

      subscription.unsubscribe();
    });

    it('should not notify type-specific subscribers for different event types', async () => {
      const receivedEvents: any[] = [];
      const callback = (event: any) => receivedEvents.push(event);

      const subscription = eventBus.subscribeToType(EVENT_TYPES.AUTH.USER_SIGNED_IN, callback);

      const event = createUserSignedOutEvent('user-123');
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(0);

      subscription.unsubscribe();
    });
  });

  describe('domain-specific subscriptions', () => {
    it('should notify auth event subscribers', async () => {
      const receivedEvents: AuthEvent[] = [];
      const callback = (event: AuthEvent) => receivedEvents.push(event);

      const subscription = eventBus.subscribeToAuthEvents(callback);

      const event = createUserSignedInEvent(mockUser);
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);

      subscription.unsubscribe();
    });

    it('should notify auth event subscribers for different auth event types', async () => {
      const receivedEvents: AuthEvent[] = [];
      const callback = (event: AuthEvent) => receivedEvents.push(event);

      const subscription = eventBus.subscribeToAuthEvents(callback);

      const event = createTokenRefreshedEvent('user-123');
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);

      subscription.unsubscribe();
    });

    it('should notify auth event subscribers for error events', async () => {
      const receivedEvents: AuthEvent[] = [];
      const callback = (event: AuthEvent) => receivedEvents.push(event);

      const subscription = eventBus.subscribeToAuthEvents(callback);

      const event = createAuthErrorEvent('Authentication failed', 'AUTH_001');
      await eventBus.publish(event);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event);

      subscription.unsubscribe();
    });
  });

  describe('error handling', () => {
    it('should handle errors in subscribers gracefully', async () => {
      const errorCallback = () => {
        throw new Error('Test error');
      };

      const normalCallback = vi.fn();
      const subscription1 = eventBus.subscribe(errorCallback);
      const subscription2 = eventBus.subscribe(normalCallback);

      const event = createUserSignedInEvent(mockUser);

      // Should not throw
      await expect(eventBus.publish(event)).resolves.not.toThrow();

      // Normal callback should still be called
      expect(normalCallback).toHaveBeenCalledWith(event);

      subscription1.unsubscribe();
      subscription2.unsubscribe();
    });
  });

  describe('unsubscribe', () => {
    it('should stop notifying unsubscribed callbacks', async () => {
      const receivedEvents: any[] = [];
      const callback = (event: any) => receivedEvents.push(event);

      const subscription = eventBus.subscribe(callback);

      const event1 = createUserSignedInEvent(mockUser);
      await eventBus.publish(event1);

      subscription.unsubscribe();

      const event2 = createUserSignedOutEvent('user-123');
      await eventBus.publish(event2);

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toBe(event1);
    });
  });

  describe('utility methods', () => {
    it('should return correct subscription counts', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.subscribe(callback1);
      eventBus.subscribeToAuthEvents(callback2);

      const counts = eventBus.getSubscriptionCounts();

      expect(counts.global).toBe(1);
      expect(counts.auth).toBe(1);
      expect(counts.system).toBe(0);
      expect(counts.typeSpecific).toBe(0);
    });

    it('should clear all subscriptions', () => {
      const callback = vi.fn();

      eventBus.subscribe(callback);
      eventBus.subscribeToAuthEvents(callback);

      eventBus.clear();

      const counts = eventBus.getSubscriptionCounts();

      expect(counts.global).toBe(0);
      expect(counts.auth).toBe(0);
      expect(counts.system).toBe(0);
      expect(counts.typeSpecific).toBe(0);
    });
  });
});
