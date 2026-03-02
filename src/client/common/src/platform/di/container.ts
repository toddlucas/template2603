import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { LOG_CONFIG, LOG_LEVELS } from '../logging';

import type { ConfigurationService } from '../config/services/ConfigurationService';
import { setAccessToken, setSchemeHost } from '../../api';

import { InMemoryEventStore, type EventStore } from '../events/EventStore';
import { InMemoryEventBus, type EventBus } from '../events/EventBus';

export async function createPlatformContainer(): Promise<Container> {
  const container = new Container();

  // Register event system
  container.bind<EventStore>(TYPES.EventStore).to(InMemoryEventStore).inSingletonScope();
  container.bind<EventBus>(TYPES.EventBus).to(InMemoryEventBus).inSingletonScope();

  return container;
}

export async function initializePlatformContainer(container: Container): Promise<void> {
  // Initialize shared services
  try {
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log('🔧 [PLATFORM] Initializing shared services');

    const configService = container.get<ConfigurationService>(TYPES.ConfigurationService);
    const config = configService.getConfig();
    setSchemeHost(config.api.baseUrl);

    if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
      const accessToken = sessionStorage.getItem("authAccessToken");
      if (accessToken) {
        setAccessToken(accessToken);
      }
    } else {
      // const accessToken = sessionStorage.getItem("authUserModel");
      // if (accessToken) {
      //   setAccessToken(accessToken);
      // }
    }

    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) {
      console.log('✅ [PLATFORM] Service layer components initialized');
    }
  } catch (error) {
    if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.ERROR) console.error('❌ [PLATFORM] Failed to initialize shared services:', error);
    throw error;
  }
}

export { Container };
