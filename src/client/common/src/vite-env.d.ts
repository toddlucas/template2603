/// <reference types="vite/client" />

interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_AUTH_TYPE: 'bearer' | 'cookie';
  readonly VITE_MICROSOFT_CLIENT_ID: string;
  readonly VITE_MICROSOFT_TENANT_ID: string;
  readonly VITE_SKIP_AUTH: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Enable importing .jsonc files (handled by vite-plugin-json5)
declare module "*.jsonc" {
  const value: Record<string, any>;
  export default value;
}
