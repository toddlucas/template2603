export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface FeatureFlags {
  enableAdvancedFeatures: boolean;
  enableDebugMode: boolean;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
  animations: boolean;
}

export interface CoreConfig {
  api: ApiConfig;
  features: FeatureFlags;
  ui: UIConfig;
}
