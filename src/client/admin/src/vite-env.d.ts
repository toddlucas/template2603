/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string | undefined;
  readonly VITE_BASE_PATH: string | undefined;

  // Common
  readonly VITE_AUTH_TYPE: 'bearer' | 'cookie';

  // Debug Logging - Platform & Infrastructure
  readonly VITE_LOG_CONFIG: string | undefined;
  readonly VITE_LOG_DI: string | undefined;
  readonly VITE_LOG_EVENT: string | undefined;
  readonly VITE_LOG_PLATFORM: string | undefined;
  readonly VITE_LOG_AUTH: string | undefined;

  // Debug Logging - MVP Features
  readonly VITE_LOG_CONTACTS: string | undefined;
  readonly VITE_LOG_SEQUENCES: string | undefined;
  readonly VITE_LOG_AI: string | undefined;
  readonly VITE_LOG_EMAIL: string | undefined;
  readonly VITE_LOG_INBOX: string | undefined;
  readonly VITE_LOG_ANALYTICS: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Enable importing .jsonc files (handled by vite-plugin-json5)
declare module "*.jsonc" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: Record<string, any>;
  export default value;
}
