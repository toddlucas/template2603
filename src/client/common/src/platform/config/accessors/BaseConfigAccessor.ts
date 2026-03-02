import type { CoreConfig } from '../types';
import type { ConfigurationService } from '../services/ConfigurationService';
import { LOG_CONFIG, LOG_LEVELS } from '../../logging';

/**
 * Base class for configuration accessors
 */
export abstract class BaseConfigAccessor<T> {
  protected configService: ConfigurationService;
  private changeCallbacks: Array<(config: T) => void> = [];
  private isInitialized = true;
  private errors: Error[] = [];

  constructor(configService: ConfigurationService) {
    this.configService = configService;
  }

  // Lifecycle
  // REVIEW: The config system loads before accessors are created.
  // async initialize(): Promise<void> {
  //   if (this.isInitialized) return;
  //   try {
  //     await this.configService.load();
  //     this.isInitialized = true;
  //     if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
  //       console.log('🔧 [CONFIG] ConfigAccessor initialized successfully');
  //     }
  //   } catch (error) {
  //     this.handleError(error as Error);
  //     throw error;
  //   }
  // }

  isReady(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.changeCallbacks = [];
    this.errors = [];
    this.isInitialized = false;
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('🔧 [CONFIG] ConfigAccessor disposed');
    }
  }

  // Config access
  protected getConfig(): T {
    if (!this.isInitialized) throw new Error('ConfigAccessor not initialized. Call initialize() first.');
    return this.configService.getConfig() as T;
  }

  protected getSection<K extends keyof CoreConfig>(section: K): CoreConfig[K] {
    if (!this.isInitialized) throw new Error('ConfigAccessor not initialized. Call initialize() first.');
    return this.configService.getSection(section);
  }

  protected getNested<K>(path: string[]): K | undefined {
    if (!this.isInitialized) throw new Error('ConfigAccessor not initialized. Call initialize() first.');
    let current: any = this.configService.getConfig();
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current as K;
  }

  protected getWithDefault<K>(path: string[], defaultValue: K): K {
    const value = this.getNested<K>(path);
    return value !== undefined ? value : defaultValue;
  }

  // Change notification
  onChange(callback: (config: T) => void): void {
    this.changeCallbacks.push(callback);
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('🔧 [CONFIG] Change listener added');
    }
  }

  offChange(callback: (config: T) => void): void {
    const index = this.changeCallbacks.indexOf(callback);
    if (index > -1) {
      this.changeCallbacks.splice(index, 1);
      if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
        console.log('🔧 [CONFIG] Change listener removed');
      }
    }
  }

  protected emitChange(config: T): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(config);
      } catch (error) {
        this.handleError(error as Error);
      }
    }
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.DEBUG) {
      console.log('🔧 [CONFIG] Configuration change emitted');
    }
  }

  // Validation and error handling
  validate(): boolean {
    try {
      this.errors = [];
      this.validateInternal();
      return this.errors.length === 0;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  isValid(): boolean {
    return this.validate();
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  protected handleError(error: Error): void {
    this.errors.push(error);
    if (LOG_CONFIG.CONFIG >= LOG_LEVELS.ERROR) {
      console.error('🔧 [CONFIG] ConfigAccessor error:', error);
    }
  }

  protected clearErrors(): void {
    this.errors = [];
  }

  // Abstract methods
  abstract getConfiguration(): T;
  protected abstract validateInternal(): void;
  abstract updateConfiguration(config: Partial<T>): Promise<void>;
}
