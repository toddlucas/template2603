import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPlatformContainer, initializePlatformContainer, Container } from './container';
import { TYPES } from './types';
import type { EventStore, EventBus } from '../events';
import { createTokenRefreshedEvent, createAuthErrorEvent } from '../events';
import type { ConfigurationService } from '../config/services/ConfigurationService';
import { defaultCoreConfig } from '../config/defaults';

// Helper function to create a mock configuration service for testing
function createMockConfigService(): ConfigurationService {
  return {
    getConfig: () => defaultCoreConfig,
    getSection: (section) => defaultCoreConfig[section],
    updateSection: async () => {},
    load: async () => {},
    save: async () => {},
    reload: async () => {},
    isLoaded: () => true,
    validateConfig: () => ({ success: true, data: defaultCoreConfig, warnings: [] })
  };
}

describe('Platform Container', () => {
  let container: Container;

  beforeEach(async () => {
    container = await createPlatformContainer();

    // Bind mock configuration service (similar to web container pattern)
    const mockConfigService = createMockConfigService();
    container.bind<ConfigurationService>(TYPES.ConfigurationService).toConstantValue(mockConfigService);
  });

  describe('Event System Registration', () => {
    it('should register EventStore', () => {
      const eventStore = container.get<EventStore>(TYPES.EventStore);
      expect(eventStore).toBeDefined();
      expect(typeof eventStore.appendEvent).toBe('function');
      expect(typeof eventStore.queryEvents).toBe('function');
    });

    it('should register EventBus', () => {
      const eventBus = container.get<EventBus>(TYPES.EventBus);
      expect(eventBus).toBeDefined();
      expect(typeof eventBus.publish).toBe('function');
      expect(typeof eventBus.subscribe).toBe('function');
    });

    it('should register EventStore and EventBus as singletons', () => {
      const eventStore1 = container.get<EventStore>(TYPES.EventStore);
      const eventStore2 = container.get<EventStore>(TYPES.EventStore);
      expect(eventStore1).toBe(eventStore2);

      const eventBus1 = container.get<EventBus>(TYPES.EventBus);
      const eventBus2 = container.get<EventBus>(TYPES.EventBus);
      expect(eventBus1).toBe(eventBus2);
    });
  });

  describe('Event System Initialization', () => {
    it('should initialize successfully without automatic EventStore-EventBus connection', async () => {
      const eventStore = container.get<EventStore>(TYPES.EventStore);
      const eventBus = container.get<EventBus>(TYPES.EventBus);

      // Set up a subscriber to verify events are NOT automatically published
      const subscriber = vi.fn();
      eventBus.subscribe(subscriber);

      // Initialize the container
      await initializePlatformContainer(container);

      // Append an event to the store
      const authEvent = createTokenRefreshedEvent('user-1');
      await eventStore.appendEvent(authEvent);

      // Verify the event was NOT automatically published to subscribers
      expect(subscriber).not.toHaveBeenCalled();

      // But verify the event was stored correctly
      const storedEvents = await eventStore.queryEvents((event) =>
        'userId' in event && event.userId === 'user-1'
      );
      expect(storedEvents).toHaveLength(1);
      expect(storedEvents[0]).toEqual(authEvent);
    });

    it('should allow manual event publishing when needed', async () => {
      const eventStore = container.get<EventStore>(TYPES.EventStore);
      const eventBus = container.get<EventBus>(TYPES.EventBus);

      const subscriber = vi.fn();
      eventBus.subscribe(subscriber);

      await initializePlatformContainer(container);

      // Create and store events
      const event1 = createTokenRefreshedEvent('user-1');
      const event2 = createAuthErrorEvent('Authentication failed', 'AUTH_001');

      await eventStore.appendEvent(event1);
      await eventStore.appendEvent(event2);

      // Events should not be automatically published
      expect(subscriber).not.toHaveBeenCalled();

      // But can be manually published when the coordinator decides
      await eventBus.publish(event1);
      await eventBus.publish(event2);

      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenNthCalledWith(1, event1);
      expect(subscriber).toHaveBeenNthCalledWith(2, event2);
    });
  });

  describe('Configuration Service', () => {
    it('should accept externally provided ConfigurationService', () => {
      // Verify that the configuration service was bound externally (in beforeEach)
      const configService = container.get<ConfigurationService>(TYPES.ConfigurationService);
      expect(configService).toBeDefined();
      expect(configService.getConfig()).toEqual(defaultCoreConfig);
    });
  });
});
