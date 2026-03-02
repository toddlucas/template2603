import 'reflect-metadata';
import { Container } from 'inversify';
import { createPlatformContainer, initializePlatformContainer } from '$/platform/di/container';
import { TYPES } from '$/platform/di/types';
import type { ConfigurationService } from '$/platform/config/services/ConfigurationService';
import { loadRendererConfigService } from '$/platform/config/loaders';
import { initializeStores } from '$/stores';

function createContainerResource(containerStart: (container: Container) => Promise<void> = async () => {}) {
  let status = 'pending';
  let result: Container;
  const suspender = createElectronContainer(containerStart).then(
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

async function createElectronContainer(containerStart: (container: Container) => Promise<void> = async () => {}): Promise<Container> {
  // Create shared container first
  const container = await createPlatformContainer();

  // Register Electron-specific services
  const configService = await loadRendererConfigService();
  container.bind<ConfigurationService>(TYPES.ConfigurationService).toConstantValue(configService);

  await initializePlatformContainer(container);

  await containerStart(container);

  return container;
}

export { Container };
