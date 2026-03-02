import { createPlatformContainer, initializePlatformContainer } from './container';
import { TYPES } from './types';
import type { EventStore, EventBus, SystemEvent, AIEvent, FileSystemEvent } from '../events';
import { createUserMessageEvent, createFileCreatedEvent } from '../events';

// Example: Using the event system through DI
export async function demonstrateEventSystemWithDI() {
  console.log('Creating platform container...');
  const container = await createPlatformContainer();

  console.log('Initializing platform container...');
  await initializePlatformContainer(container);

  // Get event system from DI container
  const eventStore = container.get<EventStore>(TYPES.EventStore);
  const eventBus = container.get<EventBus>(TYPES.EventBus);

  // Set up subscriptions
  const globalSubscription = eventBus.subscribe((event: SystemEvent) => {
    console.log('Global event received:', event.type, event.id);
  });

  const aiSubscription = eventBus.subscribeToAIEvents((event: AIEvent) => {
    console.log('AI event received:', event.type, event.conversationId);
  });

  const fileSubscription = eventBus.subscribeToFileEvents((event: FileSystemEvent) => {
    console.log('File event received:', event.type, event.filePath);
  });

  // Publish some events
  console.log('Publishing events...');

  const aiEvent = createUserMessageEvent(
    'conv-1',
    'Hello, AI! Can you help me with my code?'
  );
  await eventStore.appendEvent(aiEvent);

  const fileEvent = createFileCreatedEvent(
    '/workspace/main.ts',
    1024,
    'typescript'
  );
  await eventStore.appendEvent(fileEvent);

  // Query events
  console.log('Querying events...');
  const allEvents = await eventStore.queryEvents(() => true);
  console.log('Total events:', allEvents.length);

  const aiEvents = await eventStore.queryEvents((event: SystemEvent) => event.type.startsWith('ai_'));
  console.log('AI events:', aiEvents.length);

  // Clean up
  globalSubscription.unsubscribe();
  aiSubscription.unsubscribe();
  fileSubscription.unsubscribe();

  console.log('Example completed!');
}

// Example: Service that uses the event system
export class ExampleService {
  constructor(
    private eventStore: EventStore
  ) {}

  async sendUserMessage(conversationId: string, content: string): Promise<void> {
    const event = createUserMessageEvent(
      conversationId,
      content
    );

    await this.eventStore.appendEvent(event);
  }

  async createFile(filePath: string, fileSize?: number): Promise<void> {
    const event = createFileCreatedEvent(
      filePath,
      fileSize
    );

    await this.eventStore.appendEvent(event);
  }

  async getConversationEvents(conversationId: string): Promise<any[]> {
    return this.eventStore.queryEvents((event: SystemEvent) => {
      if (event.type.startsWith('ai_')) {
        return (event as AIEvent).conversationId === conversationId;
      }
      return false;
    });
  }
}

// Example: How to register a service that uses the event system
export function registerExampleService(_container: any): void {
  // This would be done in the container configuration
  // container.bind<ExampleService>(TYPES.ExampleService).to(ExampleService).inSingletonScope();

  // The ExampleService would be injected with EventStore and EventBus
  // constructor(@inject(TYPES.EventStore) eventStore: EventStore,
  //            @inject(TYPES.EventBus) eventBus: EventBus) { ... }
}
