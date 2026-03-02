import i18n from '../i18n';
import { LOG_CONFIG, LOG_LEVELS } from '$/platform/logging';

/**
 * Dynamically loads and registers translations for a specific app.
 * Merges the app's translations into i18next's existing resources.
 *
 * @param appId - Identifier for the app (used for logging)
 * @param localesModule - Object containing translations by language
 *
 * @example
 * ```typescript
 * const { mainLocales } = await import('#main/locales');
 * await loadAppLocales('main', mainLocales);
 * ```
 */
export async function loadAppLocales(
  appId: string,
  localesModule: Record<string, Record<string, Record<string, string>>>
) {
  // Get all available languages from the locales module
  const languages = Object.keys(localesModule);

  // Add resources for each language
  for (const lang of languages) {
    const resources = localesModule[lang];

    // Add each namespace from this app's translations
    Object.keys(resources).forEach((namespace) => {
      i18n.addResourceBundle(
        lang,
        namespace,
        resources[namespace],
        true,  // deep merge
        false  // don't overwrite existing keys
      );
    });
  }

  if (LOG_CONFIG.PLATFORM >= LOG_LEVELS.DEBUG) console.log(`✅ Loaded locales for ${appId} app`); // eslint-disable-line no-console
}
