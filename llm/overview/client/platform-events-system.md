# Platform Events System - Usage Guide

## Overview

The Platform Events System provides a type-safe, event-driven foundation for real-time state management across the application. It enables components to communicate through events while maintaining clean separation of concerns.

## Quick Start

### Basic Setup

```typescript
import { createPlatformContainer, initializePlatformContainer } from '@/platform/di/container';
import { TYPES } from '@/platform/di/types';
import type { EventStore, EventBus } from '@/platform/events';

// Create and initialize the DI container
const container = await createPlatformContainer();
await initializePlatformContainer(container);

// Get the event system services
const eventStore = container.get<EventStore>(TYPES.EventStore);
const eventBus = container.get<EventBus>(TYPES.EventBus);
```

### Publishing Events

```typescript
import { createUserSignedInEvent, createUserSignedOutEvent, EVENT_TYPES } from '@/platform/events';

// Publish a user signed in event
const signInEvent = createUserSignedInEvent({
  id: 'user-123',
  userName: 'john.doe',
  email: 'john@example.com'
});
await eventStore.appendEvent(signInEvent);

// Publish a user signed out event
const signOutEvent = createUserSignedOutEvent('user-123');
await eventStore.appendEvent(signOutEvent);
```

### Subscribing to Events

```typescript
// Subscribe to all events
const globalSubscription = eventBus.subscribe((event) => {
  console.log('Event received:', event.type, event.id);
});

// Subscribe to specific event types
const signInSubscription = eventBus.subscribeToType(EVENT_TYPES.AUTH.USER_SIGNED_IN, (event) => {
  console.log('User signed in:', event.user.userName);
});

// Subscribe to domain-specific events
const authSubscription = eventBus.subscribeToAuthEvents((event) => {
  console.log('Auth event:', event.type, event.id);
});

// Don't forget to unsubscribe when done
globalSubscription.unsubscribe();
signInSubscription.unsubscribe();
authSubscription.unsubscribe();
```

## Event Types

### Available Event Types

The system currently supports authentication events:

#### Auth Events
- `user_signed_in` - User successfully signs in
- `user_signed_out` - User signs out
- `user_session_restored` - User session is restored
- `user_session_expired` - User session expires
- `token_refreshed` - Authentication token is refreshed
- `token_expired` - Authentication token expires
- `auth_error` - Authentication error occurs
- `login_failed` - Login attempt fails
- `registration_failed` - User registration fails

### Creating Events

```typescript
import { 
  createUserSignedInEvent, 
  createUserSignedOutEvent, 
  createAuthErrorEvent, 
  createTokenRefreshedEvent,
  EVENT_TYPES 
} from '@/platform/events';

// User sign in event
const user = {
  id: 'user-123',
  userName: 'john.doe',
  email: 'john@example.com'
};

const signInEvent = createUserSignedInEvent(user);

// User sign out event
const signOutEvent = createUserSignedOutEvent('user-123');

// Auth error event
const errorEvent = createAuthErrorEvent('Invalid credentials', 'AUTH_001');

// Token refresh event
const tokenEvent = createTokenRefreshedEvent('user-123');
```

## Subscription Patterns

### Global Subscription
Receive all events in the system:

```typescript
const subscription = eventBus.subscribe((event) => {
  // Handle any event type
  console.log('Event:', event.type, event.id, event.timestamp);
});
```

### Type-Specific Subscription
Subscribe to a specific event type:

```typescript
const subscription = eventBus.subscribeToType(EVENT_TYPES.AUTH.USER_SIGNED_IN, (event) => {
  // TypeScript knows this is a UserSignedInEvent
  console.log('User signed in:', event.user.userName);
  console.log('User ID:', event.user.id);
});
```

### Domain-Specific Subscription
Subscribe to all events in a domain:

```typescript
// All auth events
const authSubscription = eventBus.subscribeToAuthEvents((event) => {
  // TypeScript knows this is an AuthEvent
  console.log('Auth event:', event.type, event.id);
  
  // Handle different auth event types
  switch (event.type) {
    case EVENT_TYPES.AUTH.USER_SIGNED_IN:
      console.log('User signed in:', event.user?.userName);
      break;
    case EVENT_TYPES.AUTH.USER_SIGNED_OUT:
      console.log('User signed out:', event.userId);
      break;
    case EVENT_TYPES.AUTH.AUTH_ERROR:
      console.log('Auth error:', event.message, event.errorCode);
      break;
  }
});
```

## Querying Events

### Query All Events
```typescript
const allEvents = await eventStore.queryEvents(() => true);
console.log('Total events:', allEvents.length);
```

### Query by Event Type
```typescript
import { isAuthEvent } from '@/platform/events';

const authEvents = await eventStore.queryEvents(isAuthEvent);
```

### Query by Property
```typescript
// Get all events of a specific type
const signInEvents = await eventStore.getEventsByProperty('type', EVENT_TYPES.AUTH.USER_SIGNED_IN);

// Get all events for a specific user
const userEvents = await eventStore.queryEvents((event) => {
  if (isAuthEvent(event)) {
    if (event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN && 'user' in event) {
      return event.user.id === 'user-123';
    } else if ('userId' in event) {
      return event.userId === 'user-123';
    }
  }
  return false;
});
```

### Advanced Queries
```typescript
// Get recent events (last 10 minutes)
const recentEvents = await eventStore.queryEvents((event) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return event.timestamp > tenMinutesAgo;
});

// Get auth error events
const errorEvents = await eventStore.queryEvents((event) => {
  if (isAuthEvent(event)) {
    return event.type === EVENT_TYPES.AUTH.AUTH_ERROR;
  }
  return false;
});
```

## Service Integration

### Creating Services That Use Events

```typescript
import { injectable, inject } from 'inversify';
import { TYPES } from '@/platform/di/types';
import type { EventStore, EventBus } from '@/platform/events';
import { createUserSignedInEvent, EVENT_TYPES } from '@/platform/events';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.EventStore) private eventStore: EventStore,
    @inject(TYPES.EventBus) private eventBus: EventBus
  ) {}

  async signInUser(user: { id: string; userName: string; email: string }): Promise<void> {
    const event = createUserSignedInEvent(user);
    await this.eventStore.appendEvent(event);
  }

  async getUserAuthHistory(userId: string): Promise<any[]> {
    return this.eventStore.queryEvents((event) => {
      if (isAuthEvent(event)) {
        if (event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN && 'user' in event) {
          return event.user.id === userId;
        } else if ('userId' in event) {
          return event.userId === userId;
        }
      }
      return false;
    });
  }
}
```

### React Component Integration

```typescript
import { useEffect, useState } from 'react';
import { useContainer } from '@/platform/di/ContainerContext';
import { TYPES } from '@/platform/di/types';
import type { EventBus, AuthEvent } from '@/platform/events';

export function AuthStatus() {
  const container = useContainer();
  const eventBus = container.get<EventBus>(TYPES.EventBus);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);

  useEffect(() => {
    const subscription = eventBus.subscribeToAuthEvents((event) => {
      setAuthEvents(prev => [...prev, event]);
    });

    return () => subscription.unsubscribe();
  }, [eventBus]);

  return (
    <div>
      <h3>Recent Auth Events</h3>
      {authEvents.map(event => (
        <div key={event.id}>
          {event.type}: {event.id}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### Graceful Error Handling
The event system handles errors gracefully:

```typescript
// Even if a subscriber throws an error, other subscribers still receive events
const errorSubscription = eventBus.subscribe(() => {
  throw new Error('Something went wrong');
});

const normalSubscription = eventBus.subscribe((event) => {
  console.log('Event received:', event.type);
});

// Both subscriptions are called, but errors are logged and don't break the system
await eventStore.appendEvent(createUserSignedInEvent(mockUser));
```

### Validation
Events are automatically validated:

```typescript
// This will throw an error - missing required fields
const invalidEvent = {
  id: 'test',
  // Missing timestamp and type
};

await eventStore.appendEvent(invalidEvent); // Throws error
```

## Best Practices

### 1. Always Unsubscribe
```typescript
const subscription = eventBus.subscribe((event) => {
  // Handle event
});

// Clean up when component unmounts or service is destroyed
subscription.unsubscribe();
```

### 2. Use Type-Safe Subscriptions
```typescript
// Good - TypeScript knows the event type
const subscription = eventBus.subscribeToAuthEvents((event) => {
  if (event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN) {
    console.log(event.user.userName); // TypeScript knows this exists
  }
});

// Avoid - Less type safety
const subscription = eventBus.subscribe((event) => {
  if (event.type.startsWith('user_')) {
    console.log((event as any).user?.userName); // Type assertion needed
  }
});
```

### 3. Use Event Creation Utilities
```typescript
// Good - Uses utility functions
const event = createUserSignedInEvent({
  id: 'user-123',
  userName: 'john.doe',
  email: 'john@example.com'
});

// Avoid - Manual event creation
const event = {
  id: crypto.randomUUID(),
  timestamp: new Date(),
  type: 'user_signed_in',
  user: { id: 'user-123', userName: 'john.doe', email: 'john@example.com' }
};
```

### 4. Query Events Efficiently
```typescript
// Good - Use type guards for efficient filtering
const authEvents = await eventStore.queryEvents(isAuthEvent);

// Good - Use specific property queries
const signInEvents = await eventStore.getEventsByProperty('type', EVENT_TYPES.AUTH.USER_SIGNED_IN);

// Avoid - Inefficient filtering
const signInEvents = await eventStore.queryEvents((event) => {
  return event.type === 'user_signed_in';
});
```

### 5. Handle Event Ordering
Events are stored in the order they were created:

```typescript
// Events maintain their chronological order
await eventStore.appendEvent(createUserSignedInEvent(mockUser)); // Event 1
await eventStore.appendEvent(createTokenRefreshedEvent('user-123')); // Event 2
await eventStore.appendEvent(createUserSignedOutEvent('user-123')); // Event 3

const events = await eventStore.queryEvents(() => true);
// events[0] is the first event, events[2] is the last event
```

## Common Patterns

### Authentication Flow Pattern
```typescript
class AuthManager {
  constructor(private eventStore: EventStore, private eventBus: EventBus) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.eventBus.subscribeToAuthEvents((event) => {
      this.handleAuthEvent(event);
    });
  }

  async signInUser(user: { id: string; userName: string; email: string }) {
    const event = createUserSignedInEvent(user);
    await this.eventStore.appendEvent(event);
  }

  async signOutUser(userId: string) {
    const event = createUserSignedOutEvent(userId);
    await this.eventStore.appendEvent(event);
  }

  async getUserAuthHistory(userId: string) {
    return this.eventStore.queryEvents((event) => {
      if (isAuthEvent(event)) {
        if (event.type === EVENT_TYPES.AUTH.USER_SIGNED_IN && 'user' in event) {
          return event.user.id === userId;
        } else if ('userId' in event) {
          return event.userId === userId;
        }
      }
      return false;
    });
  }
}
```

### Session Monitoring Pattern
```typescript
class SessionMonitor {
  constructor(private eventBus: EventBus) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.eventBus.subscribeToAuthEvents((event) => {
      this.handleAuthEvent(event);
    });
  }

  private handleAuthEvent(event: AuthEvent) {
    switch (event.type) {
      case EVENT_TYPES.AUTH.USER_SIGNED_IN:
        this.onUserSignedIn(event);
        break;
      case EVENT_TYPES.AUTH.USER_SIGNED_OUT:
        this.onUserSignedOut(event);
        break;
      case EVENT_TYPES.AUTH.TOKEN_EXPIRED:
        this.onTokenExpired(event);
        break;
      case EVENT_TYPES.AUTH.AUTH_ERROR:
        this.onAuthError(event);
        break;
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Events Not Being Received
- Check that you're subscribed to the correct event type
- Verify the EventStore is connected to the EventBus
- Ensure you haven't unsubscribed prematurely

#### Type Errors
- Use the provided type guards (`isAuthEvent`)
- Use domain-specific subscription methods for better type safety
- Import event types from `@/platform/events`

#### Performance Issues
- Unsubscribe from events when no longer needed
- Use specific event type subscriptions instead of global subscriptions
- Use efficient query patterns with type guards

The Platform Events System provides a robust foundation for building reactive, event-driven applications with full type safety and excellent developer experience, focused on authentication event management.
