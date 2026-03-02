import type { ConfigurationProvider } from './ConfigurationProvider';

export class ElectronRendererProvider implements ConfigurationProvider {
  private ipcRenderer: any;

  constructor() {
    // Access ipcRenderer from the global window object
    if (typeof window !== 'undefined' && (window as any).ipcRenderer) {
      this.ipcRenderer = (window as any).ipcRenderer;
    } else {
      throw new Error('ipcRenderer is not available in this environment');
    }
  }

  async load(): Promise<Record<string, any>> {
    try {
      // Request configuration from main process
      const config = await this.ipcRenderer.invoke('config:load');
      return config || {};
    } catch (error) {
      console.warn('Failed to load config from main process:', error);
      return {};
    }
  }

  async save(config: Record<string, any>): Promise<void> {
    try {
      // Send configuration to main process for saving
      await this.ipcRenderer.invoke('config:save', config);
    } catch (error) {
      console.warn('Failed to save config to main process:', error);
      throw error;
    }
  }

  canSave(): boolean {
    return this.ipcRenderer !== undefined;
  }

  getPriority(): number {
    return 75; // High priority for renderer process
  }

  // Helper method to get initial state from preload
  getInitialState(): Record<string, any> {
    if (typeof window !== 'undefined' && (window as any).electron?.initialState) {
      return (window as any).electron.initialState || {};
    }
    return {};
  }
}
