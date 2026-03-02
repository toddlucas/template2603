import type { ConfigurationService } from './ConfigurationService';
import type { ConfigurationProvider } from '../providers/ConfigurationProvider';
import type { CoreConfig } from '../types';
import { defaultCoreConfig } from '../defaults';
import { LOG_CONFIG, LOG_LEVELS } from '../../logging';
import { validateConfigWithWarnings, type ConfigValidationResult } from '../schemas';

export class MainConfigurationService implements ConfigurationService {
  private config: CoreConfig = defaultCoreConfig;
  private providers: ConfigurationProvider[] = [];
  private loaded = false;

  constructor(providers: ConfigurationProvider[] = []) {
    this.providers = providers.sort((a, b) => b.getPriority() - a.getPriority());
  }

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.VERBOSE) {
      console.log('🔧 [CONFIG] Loading configuration from providers...');
    }

    // Start with default configuration
    let mergedConfig = { ...defaultCoreConfig };

    // Load from each provider in priority order
    for (const provider of this.providers) {
      try {
        if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
          console.log('🔧 [CONFIG] Loading from provider:', provider.constructor.name);
        }

        const providerConfig = await provider.load();

        // Validate the provider configuration with warnings
        const validationResult = validateConfigWithWarnings(providerConfig);
        if (!validationResult.success) {
          if (LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
            console.warn('🔧 [CONFIG] Invalid configuration from provider:', provider.constructor.name);
            console.warn('🔧 [CONFIG] Validation errors:', validationResult.errors);
          }
          continue; // Skip this provider's config if invalid
        }

        // Log warnings if any
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          if (LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
            console.warn('🔧 [CONFIG] Configuration warnings from provider:', provider.constructor.name);
            validationResult.warnings.forEach(warning => console.warn('🔧 [CONFIG]', warning));
          }
        }

        mergedConfig = this.mergeConfig(mergedConfig, validationResult.data) as CoreConfig;

        if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
          console.log('🔧 [CONFIG] Provider loaded successfully:', provider.constructor.name);
        }
      } catch (error) {
        if (LOG_CONFIG.CONFIG >= LOG_LEVELS.ERROR) {
          console.error('🔧 [CONFIG] Failed to load config from provider:', error);
        }
        console.warn(`Failed to load config from provider:`, error);
      }
    }

    // Validate the final merged configuration with warnings
    const finalValidation = validateConfigWithWarnings(mergedConfig);
    if (!finalValidation.success) {
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.ERROR) {
        console.error('🔧 [CONFIG] Final configuration validation failed:');
        console.error('🔧 [CONFIG] Validation errors:', finalValidation.errors);
      }
      throw new Error(`Configuration validation failed: ${finalValidation.errors.join(', ')}`);
    }

    // Log final warnings if any
    if (finalValidation.warnings && finalValidation.warnings.length > 0) {
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
        console.warn('🔧 [CONFIG] Final configuration warnings:');
        finalValidation.warnings.forEach(warning => console.warn('🔧 [CONFIG]', warning));
      }
    }

    this.config = finalValidation.data as CoreConfig;
    this.loaded = true;

    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.INFO) {
      console.log('🔧 [CONFIG] Configuration loaded successfully');
    }
  }

  getConfig(): CoreConfig {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config };
  }

  getSection<T extends keyof CoreConfig>(section: T): CoreConfig[T] {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return { ...this.config[section] };
  }

  async updateSection<T extends keyof CoreConfig>(section: T, value: CoreConfig[T]): Promise<void> {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    // Create a temporary config with the updated section for validation
    const tempConfig = { ...this.config, [section]: value };
    const validationResult = validateConfigWithWarnings(tempConfig);

    if (!validationResult.success) {
      throw new Error(`Invalid configuration for section '${section}': ${validationResult.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
        console.warn('🔧 [CONFIG] Configuration warnings for section update:', section);
        validationResult.warnings.forEach(warning => console.warn('🔧 [CONFIG]', warning));
      }
    }

    this.config[section] = { ...value };
    await this.save();
  }

  async save(): Promise<void> {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    // Validate configuration before saving with warnings
    const validationResult = validateConfigWithWarnings(this.config);
    if (!validationResult.success) {
      throw new Error(`Cannot save invalid configuration: ${validationResult.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
        console.warn('🔧 [CONFIG] Configuration warnings before saving:');
        validationResult.warnings.forEach(warning => console.warn('🔧 [CONFIG]', warning));
      }
    }

    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('🔧 [CONFIG] Saving configuration to providers...');
    }

    // Save to all providers that support saving
    const savePromises = this.providers
      .filter(provider => provider.canSave())
      .map(provider => provider.save(this.config));

    await Promise.allSettled(savePromises);

    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.INFO) {
      console.log('🔧 [CONFIG] Configuration saved successfully');
    }
  }

  async reload(): Promise<void> {
    this.loaded = false;
    await this.load();
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Validate configuration without loading it
   */
  validateConfig(config: unknown): ConfigValidationResult {
    return validateConfigWithWarnings(config);
  }

  private mergeConfig(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value) && typeof result[key] === 'object') {
          result[key] = this.mergeConfig(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }
}
