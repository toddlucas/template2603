export interface ConfigurationProvider {
  /**
   * Load configuration from the provider's source
   */
  load(): Promise<Record<string, any>>;

  /**
   * Save configuration to the provider's source
   */
  save(config: Record<string, any>): Promise<void>;

  /**
   * Check if the provider can save configuration
   */
  canSave(): boolean;

  /**
   * Get the priority of this provider (higher = more important)
   */
  getPriority(): number;
}
