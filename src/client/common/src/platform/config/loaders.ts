import { PlatformDetector } from '../PlatformDetector';
import { MainConfigurationService } from './services/MainConfigurationService';
import { MemoryProvider, WebProvider, /* ElectronRendererProvider, */ EnvironmentProvider, MainProcessEnvironmentProvider } from './providers';
import type { ElectronMainConfig, ElectronRendererConfig, WebAppConfig } from './types';
import type { ConfigurationService } from './services/ConfigurationService';

/**
 * Load configuration service for web application
 */
export async function loadWebConfigService(): Promise<ConfigurationService> {
  const providers = [
    new EnvironmentProvider(), // VITE_* variables
    new WebProvider(), // localStorage
    new MemoryProvider(), // Defaults
  ];

  const configService = new MainConfigurationService(providers);
  await configService.load();

  return configService;
}

/**
 * Load configuration for web application
 */
export async function loadWebConfig(): Promise<WebAppConfig> {
  const configService = await loadWebConfigService();

  return configService.getConfig() as WebAppConfig;
}

/**
 * Load configuration service for Electron renderer process
 */
export async function loadRendererConfigService(): Promise<ConfigurationService> {
  const platform = PlatformDetector.getInstance();

  if (!platform.isElectron || !platform.isRendererProcess) {
    throw new Error('loadRendererConfig should only be called in Electron renderer process');
  }

  const providers = [
    new EnvironmentProvider(), // VITE_* variables
    // new ElectronRendererProvider(), // IPC from main process
    new MemoryProvider(), // Defaults
  ];

  const configService = new MainConfigurationService(providers);
  await configService.load();

  console.log('🔧 [CONFIG] Renderer config loaded:', JSON.stringify(configService.getConfig(), null, 2));

  return configService;
}

/**
 * Load configuration for Electron renderer process
 * This is a simple function that doesn't use DI
 */
export async function loadRendererConfig(): Promise<ElectronRendererConfig> {
  const configService = await loadRendererConfigService();

  return configService.getConfig() as ElectronRendererConfig;
}

/**
 * Load configuration service for Electron main process
 * This is a simple function that doesn't use DI
 */
export async function loadMainConfigService(): Promise<ConfigurationService> {
  const platform = PlatformDetector.getInstance();

  if (!platform.isElectron || !platform.isMainProcess) {
    throw new Error('loadMainConfigService should only be called in Electron main process');
  }

  const providers = [
    new MainProcessEnvironmentProvider(), // BASALT_* variables
    new MemoryProvider(), // Defaults
  ];

  const configService = new MainConfigurationService(providers);
  await configService.load();

  return configService;
}

/**
 * Load configuration for Electron main process
 * This is a simple function that doesn't use DI
 */
export async function loadMainConfig(): Promise<ElectronMainConfig> {
  const configService = await loadMainConfigService();

  return configService.getConfig() as ElectronMainConfig;
}
