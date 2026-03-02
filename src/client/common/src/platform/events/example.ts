import { InMemoryEventStore } from './EventStore';
import { InMemoryEventBus } from './EventBus';
import {
  createUserSignedInEvent,
  createUserSignedOutEvent,
  createAuthErrorEvent,
  createTokenRefreshedEvent,
  EVENT_TYPES
} from './types';
import {
  isAuthEvent
} from './guards';

// Mock user for examples
const mockUser = {
  id: 'user-123',
  userName: 'exampleuser',
  email: 'user@example.com'
};

// Example: Setting up the event system
export async function setupEventSystem() {
  const eventStore = new InMemoryEventStore();
  const eventBus = new InMemoryEventBus();

  // Connect EventStore to EventBus
  eventStore.onEventAppended((event) => {
    eventBus.publish(event);
  });

  return { eventStore, eventBus };
}

// Example: Subscribing to events
export function setupEventSubscriptions(eventBus: InMemoryEventBus) {
  // Global subscription - receives all events
  const globalSubscription = eventBus.subscribe((event) => {
    console.log('Global event received:', event.type, event.id);
  });

  // Auth event subscription - receives only auth events
  const authSubscription = eventBus.subscribeToAuthEvents((event) => {
    console.log('Auth event received:', event.type, event.id);
  });

  // Type-specific subscription - receives only specific event types
  const signInSubscription = eventBus.subscribeToType(EVENT_TYPES.AUTH.USER_SIGNED_IN, (event) => {
    console.log('User signed in:', (event as any).user?.userName);
  });

  return {
    globalSubscription,
    authSubscription,
    signInSubscription
  };
}

// Example: Publishing events
export async function publishExampleEvents(eventStore: InMemoryEventStore) {
  // Create and publish a user signed in event
  const signInEvent = createUserSignedInEvent(mockUser);
  await eventStore.appendEvent(signInEvent);

  // Create and publish a token refreshed event
  const tokenEvent = createTokenRefreshedEvent('user-123');
  await eventStore.appendEvent(tokenEvent);

  // Create and publish an auth error event
  const errorEvent = createAuthErrorEvent('Authentication failed', 'AUTH_001');
  await eventStore.appendEvent(errorEvent);

  // Create and publish a user signed out event
  const signOutEvent = createUserSignedOutEvent('user-123');
  await eventStore.appendEvent(signOutEvent);
}

// Example: Querying events
export async function queryExampleEvents(eventStore: InMemoryEventStore) {
  // Get all auth events
  const authEvents = await eventStore.queryEvents(isAuthEvent);
  console.log('Auth events count:', authEvents.length);

  // Get events by specific type
  const signInEvents = await eventStore.queryEvents((event) =>
    event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN
  );
  console.log('Sign in events count:', signInEvents.length);

  // Get events by user ID
  const userEvents = await eventStore.queryEvents((event) => {
    if (isAuthEvent(event)) {
      if (event.type === 'user_signed_in' && 'user' in event) {
        return event.user.id === 'user-123';
      } else if ('userId' in event) {
        return event.userId === 'user-123';
      }
    }
    return false;
  });
  console.log('User events count:', userEvents.length);

  // Get recent events (last 10 minutes)
  const recentEvents = await eventStore.queryEvents((event) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return event.timestamp > tenMinutesAgo;
  });
  console.log('Recent events count:', recentEvents.length);
}

// Example: Event filtering utilities
export function filterEventsByType(events: any[], eventType: string) {
  return events.filter(event => event.type === eventType);
}

export function filterEventsByUser(events: any[], userId: string) {
  return events.filter(event => {
    if (isAuthEvent(event)) {
      if (event.type === 'user_signed_in' && 'user' in event) {
        return event.user.id === userId;
      } else if ('userId' in event) {
        return event.userId === userId;
      }
    }
    return false;
  });
}

// Example: Complete workflow
export async function runCompleteExample() {
  console.log('🚀 Setting up event system...');
  const { eventStore, eventBus } = await setupEventSystem();

  console.log('📡 Setting up event subscriptions...');
  const subscriptions = setupEventSubscriptions(eventBus);

  console.log('📤 Publishing example events...');
  await publishExampleEvents(eventStore);

  console.log('🔍 Querying events...');
  await queryExampleEvents(eventStore);

  console.log('🧹 Cleaning up subscriptions...');
  subscriptions.globalSubscription.unsubscribe();
  subscriptions.authSubscription.unsubscribe();
  subscriptions.signInSubscription.unsubscribe();

  console.log('✅ Example completed successfully!');
}

// Example: Error handling
export function setupErrorHandling(eventBus: InMemoryEventBus) {
  // Subscribe with error handling
  const errorProneSubscription = eventBus.subscribe((event) => {
    try {
      // Simulate some processing that might fail
      if (event.type === 'user_signed_in') {
        throw new Error('Processing failed for sign in event');
      }
      console.log('Event processed successfully:', event.type);
    } catch (error) {
      console.error('Error processing event:', error);
      // The event system continues to work even if this subscriber fails
    }
  });

  return errorProneSubscription;
}

// Example: Event metadata usage
export async function demonstrateEventMetadata(eventStore: InMemoryEventStore) {
  // Create an event with custom metadata
  const event = createUserSignedInEvent(mockUser);
  event.metadata = {
    source: 'web-app',
    version: '1.0.0',
    sessionId: 'session-123',
    timestamp: Date.now()
  };

  await eventStore.appendEvent(event);

  // Query events with metadata
  const eventsWithMetadata = await eventStore.queryEvents((event) =>
    !!(event.metadata && event.metadata.source === 'web-app')
  );

  console.log('Events with web-app source:', eventsWithMetadata.length);
  return eventsWithMetadata;
}
