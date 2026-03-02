import type { CoreConfig } from '../types';
import type { ConfigValidationResult } from '../schemas';

export interface ConfigurationService {
  /**
   * Get the entire configuration object
   */
  getConfig(): CoreConfig;

  /**
   * Get a specific section of the configuration
   */
  getSection<T extends keyof CoreConfig>(section: T): CoreConfig[T];

  /**
   * Update a specific section of the configuration
   */
  updateSection<T extends keyof CoreConfig>(section: T, value: CoreConfig[T]): Promise<void>;

  /**
   * Load configuration from providers
   */
  load(): Promise<void>;

  /**
   * Save the current configuration
   */
  save(): Promise<void>;

  /**
   * Reload configuration from providers
   */
  reload(): Promise<void>;

  /**
   * Check if configuration has been loaded
   */
  isLoaded(): boolean;

  /**
   * Validate configuration without loading it
   */
  validateConfig(config: unknown): ConfigValidationResult;
}
