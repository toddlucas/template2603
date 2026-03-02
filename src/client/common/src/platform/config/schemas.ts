import { z, ZodError } from 'zod';

/**
 * Custom URL validator that handles both absolute and relative URLs.
 * Relative URLs are allowed for development proxy scenarios.
 * Empty string is allowed for same-origin requests.
 */
const urlOrRelative = z.string().refine(
  (val) => {
    // Allow empty string for same-origin requests
    if (val === '') {
      return true;
    }
    // Allow relative URLs (starting with /)
    if (val.startsWith('/')) {
      return true;
    }
    // Validate absolute URLs
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL format' }
);

/**
 * API Configuration Schema
 */
export const ApiConfigSchema = z.object({
  baseUrl: urlOrRelative.optional(),
  timeout: z.number().int().positive().optional(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
});

/**
 * Feature Flags Schema
 */
export const FeaturesConfigSchema = z.object({
  enableDebugMode: z.boolean().optional(),
  enableAdvancedFeatures: z.boolean().optional(),
});

/**
 * UI Configuration Schema
 */
export const UiConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto', 'system']).optional(),
  language: z.string().optional(),
  animations: z.boolean().optional(),
});

/**
 * Web Storage Configuration Schema
 */
export const WebStorageConfigSchema = z.object({
  localStoragePrefix: z.string().optional(),
  sessionStoragePrefix: z.string().optional(),
});

/**
 * Web Browser Configuration Schema
 */
export const WebBrowserConfigSchema = z.object({
  enableNotifications: z.boolean().optional(),
  enableServiceWorker: z.boolean().optional(),
});

/**
 * Web Development Configuration Schema
 */
export const WebDevelopmentConfigSchema = z.object({
  enableHotReload: z.boolean().optional(),
  enableSourceMaps: z.boolean().optional(),
});

/**
 * Web Configuration Schema
 */
export const WebConfigSchema = z.object({
  storage: WebStorageConfigSchema.optional(),
  browser: WebBrowserConfigSchema.optional(),
  development: WebDevelopmentConfigSchema.optional(),
});

/**
 * Main Configuration Schema
 * This is the root schema that validates the entire configuration object
 *
 * Alternative approach using .passthrough() to allow unknown properties:
 * export const ConfigSchema = z.object({
 *   api: ApiConfigSchema.optional(),
 *   features: FeaturesConfigSchema.optional(),
 *   ui: UiConfigSchema.optional(),
 *   web: WebConfigSchema.optional(),
 * }).passthrough(); // This allows unknown properties but doesnt warn about them
 */
export const ConfigSchema = z.object({
  api: ApiConfigSchema.optional(),
  features: FeaturesConfigSchema.optional(),
  ui: UiConfigSchema.optional(),
  web: WebConfigSchema.optional(),
});

/**
 * Type definitions derived from schemas
 */
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;
export type UiConfig = z.infer<typeof UiConfigSchema>;
export type WebStorageConfig = z.infer<typeof WebStorageConfigSchema>;
export type WebBrowserConfig = z.infer<typeof WebBrowserConfigSchema>;
export type WebDevelopmentConfig = z.infer<typeof WebDevelopmentConfigSchema>;
export type WebConfig = z.infer<typeof WebConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validation result type with warnings for configuration validation.
 */
export type ConfigValidationResult = {
  success: true;
  data: Config;
  warnings?: string[];
} | {
  success: false;
  errors: string[];
  warnings?: string[];
};

/**
 * Find unknown properties by comparing config object with schema
 */
function findUnknownProperties(config: any, schema: z.ZodObject<any>, path: string[] = []): string[] {
  const warnings: string[] = [];

  if (typeof config !== 'object' || config === null) {
    return warnings;
  }

  const schemaShape = schema.shape;

  for (const [key, value] of Object.entries(config)) {
    const currentPath = [...path, key];
    const fullPath = currentPath.join('.');

    // Check if this property exists in the schema
    if (!(key in schemaShape)) {
      warnings.push(`Unknown property: ${fullPath}`);
      continue;
    }

    // Recursively check nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedSchema = schemaShape[key];

      // Handle different types of Zod schemas
      if (nestedSchema instanceof z.ZodObject) {
        warnings.push(...findUnknownProperties(value, nestedSchema, currentPath));
      } else if (nestedSchema instanceof z.ZodOptional) {
        // Handle optional schemas by unwrapping them
        const unwrappedSchema = nestedSchema.unwrap();
        if (unwrappedSchema instanceof z.ZodObject) {
          warnings.push(...findUnknownProperties(value, unwrappedSchema, currentPath));
        }
      } else if (nestedSchema._def?.innerType instanceof z.ZodObject) {
        // Handle other wrapped schemas
        warnings.push(...findUnknownProperties(value, nestedSchema._def.innerType, currentPath));
      }
    }
  }

  return warnings;
}

/**
 * Validate configuration object against schema with unknown property warnings
 */
export function validateConfigWithWarnings(config: unknown): ConfigValidationResult {
  const warnings: string[] = [];

  try {
    // First, check for unknown properties if config is an object
    if (typeof config === 'object' && config !== null) {
      const unknownProps = findUnknownProperties(config, ConfigSchema);
      warnings.push(...unknownProps);

      // Log warnings if debug logging is enabled
      // REVIEW: This is logged by the configuration service too.
      // if (warnings.length > 0 && LOG_CONFIG.CONFIG >= LOG_LEVELS.WARN) {
      //   console.warn('🔧 [CONFIG] Unknown properties found in configuration:');
      //   warnings.forEach(warning => console.warn(`🔧 [CONFIG] ${warning}`));
      // }
    }

    const validatedConfig = ConfigSchema.parse(config);
    return {
      success: true,
      data: validatedConfig,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = (error as any).issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

/**
 * Validate configuration object against schema
 */
export function validateConfig(config: unknown): ConfigValidationResult {
  try {
    const validatedConfig = ConfigSchema.parse(config);
    return {
      success: true,
      data: validatedConfig,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: (error as any).issues.map((err: any) => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Validate configuration with detailed error reporting
 */
export function validateConfigWithDetails(config: unknown): ConfigValidationResult {
  try {
    const validatedConfig = ConfigSchema.parse(config);
    return {
      success: true,
      data: validatedConfig,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = (error as any).issues.map((err: any) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `${path}: ${err.message}`;
      });
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
}
