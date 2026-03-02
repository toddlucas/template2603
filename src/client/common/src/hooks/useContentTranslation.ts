import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

/**
 * Default content locale when none is specified.
 * In the future, this could come from team settings.
 */
export const DEFAULT_CONTENT_LOCALE = "en";

/**
 * Hook for translating content strings that should follow the target/content locale,
 * rather than the UI locale.
 *
 * Use this for:
 * - Placeholder text and examples in content editors
 * - Suggested content buttons (text that will be inserted)
 * - AI prompt examples
 *
 * Use the standard `useTranslation` hook for UI labels, buttons, validation messages, etc.
 *
 * @param namespace - The i18n namespace (e.g., "orchestration"). The "-content" suffix is added automatically.
 * @param contentLocale - The target content locale (e.g., "en", "es"). Falls back to DEFAULT_CONTENT_LOCALE.
 * @returns Object containing the translation function `tc` and the resolved `contentLocale`
 *
 * @example
 * ```tsx
 * const { t } = useTranslation("orchestration");           // UI strings
 * const { tc } = useContentTranslation("orchestration", sequence.contentLocale);
 *
 * // UI label
 * <Label>{t('Subject')}</Label>
 *
 * // Placeholder content
 * <Input placeholder={tc('Subject placeholder')} />
 * ```
 */
export const useContentTranslation = (
  namespace: string,
  contentLocale?: string | null
): { tc: TFunction; contentLocale: string } => {
  const { i18n } = useTranslation();

  // Resolve the content locale with fallback
  const resolvedLocale = contentLocale || DEFAULT_CONTENT_LOCALE;

  // Get a translation function fixed to the content locale.
  // The "-content" suffix is added automatically to match the content namespace convention.
  const tc = i18n.getFixedT(resolvedLocale, `${namespace}-content`);

  return { tc, contentLocale: resolvedLocale };
};

export default useContentTranslation;
