/**
 * Shared i18next singleton.
 *
 * This re-exports the i18next default instance without calling .init().
 * Each client (web, app) is responsible for initializing it in their own
 * i18n.ts with the appropriate plugins and options (language detection,
 * initial resources, etc.).
 *
 * loadAppLocales and other common utilities import from here so they always
 * operate on the same singleton regardless of which client initialized it.
 */
import i18n from 'i18next';

export default i18n;
