import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '$/platform/di/types';
import { createPlatformContainer, initializePlatformContainer } from '$/platform/di/container';
import type { ConfigurationService } from '$/platform/config/services/ConfigurationService';
import { loadWebConfigService } from '$/platform/config/loaders';
import { initializeStores } from '$/stores';

/**
 * This pattern is commonly referred to as the "resource with a read() method"
 * or "suspense resource pattern." It's a manual implementation of the
 * render-as-you-fetch strategy that React Suspense was designed to support.
 *
 * @param containerStart - An optional callback function that can be used to
 * initialize non-DI services with DI services.
 */
function createContainerResource(containerStart: (container: Container) => Promise<void> = async () => {}) {
  let status = 'pending';
  let result: Container;
  const suspender = createWebContainer(containerStart).then(
    (r) => {
      status = 'success';
      result = r;
    },
    (e) => {
      status = 'error';
      result = e;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else {
        return result;
      }
    },
  };
}

const containerResource = createContainerResource(initializeStores);

export function useContainerResource(): Container {
  return containerResource.read();
}

async function createWebContainer(containerStart: (container: Container) => Promise<void> = async () => {}): Promise<Container> {
  // Create shared container first
  const container = await createPlatformContainer();

  // Register web-specific services
  const configService = await loadWebConfigService();
  container.bind<ConfigurationService>(TYPES.ConfigurationService).toConstantValue(configService);

  await initializePlatformContainer(container);

  await containerStart(container);

  return container;
}

export { Container };
