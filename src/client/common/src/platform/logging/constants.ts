/**
 * Debug level constants for direct console logging
 * These enable tree-shaking of debug statements in production builds
 */
export const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  VERBOSE: 5
} as const;

export type DebugLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
