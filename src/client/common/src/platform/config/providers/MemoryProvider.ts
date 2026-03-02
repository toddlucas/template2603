import type { ConfigurationProvider } from './ConfigurationProvider';

export class MemoryProvider implements ConfigurationProvider {
  private config: Record<string, any> = {};

  constructor(initialConfig?: Record<string, any>) {
    if (initialConfig) {
      this.config = { ...initialConfig };
    }
  }

  async load(): Promise<Record<string, any>> {
    return { ...this.config };
  }

  async save(config: Record<string, any>): Promise<void> {
    this.config = { ...config };
  }

  canSave(): boolean {
    return true;
  }

  getPriority(): number {
    return 100; // High priority for testing
  }

  // Helper method for testing
  setConfig(config: Record<string, any>): void {
    this.config = { ...config };
  }

  // Helper method for testing
  getConfig(): Record<string, any> {
    return { ...this.config };
  }
}
