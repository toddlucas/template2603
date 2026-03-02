import { Container } from "inversify";
import { TYPES } from "../platform/di/types";
import { type EventBus } from "../platform/events/EventBus";
import { useAuthStore } from "../features/auth/stores/authStore";

export function initializeStores(container: Container) {
  // Initialize auth store with event bus
  const eventBus = container.get<EventBus>(TYPES.EventBus);
  useAuthStore.getState().initialize(eventBus);

  // Initialize auth store from session storage.
  // NOTE: This happens after the other stores are initialized
  // because it may fire events that they listen for.
  useAuthStore.getState().initializeFromStorage();

  // REVIEW: Is this a pattern we want to implement?
  // Return cleanup functions for testing
  const result = {
    cleanup: () => {
      // Add any additional cleanup functions here
    }
  };

  void result; // Unused for now
  // return result;
  return Promise.resolve();
}
