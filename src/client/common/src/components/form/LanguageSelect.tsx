import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface LanguageOption {
  code: string;
  /** Native label (endonym), e.g., "Ελληνικά" for Greek. */
  label: string;
}

export interface LanguageSelectProps {
  /** The available language options. */
  languages: LanguageOption[];
  /** The currently selected language code. */
  value?: string;
  /** Callback when the language changes. */
  onValueChange: (value: string) => void;
  /** Placeholder text when no value is selected. */
  placeholder?: string;
  /** Additional class name for the trigger. */
  className?: string;
  /** Whether the select is disabled. */
  disabled?: boolean;
  /** The id for the select trigger (for label association). */
  id?: string;
}

/**
 * A select component for choosing a language.
 * Displays language names in the current UI locale (exonyms).
 *
 * @example
 * ```tsx
 * <LanguageSelect
 *   languages={availableLanguages}
 *   value={contentLocale}
 *   onValueChange={setContentLocale}
 *   placeholder="Select language"
 * />
 * ```
 */
export function LanguageSelect({
  languages,
  value,
  onValueChange,
  placeholder = "Select language",
  className,
  disabled,
  id,
}: LanguageSelectProps) {
  const { t } = useTranslation("common");

  /**
   * Gets the localized name of a language in the current UI locale.
   * Falls back to the native label if no translation is found.
   */
  const getLocalizedName = (code: string, nativeLabel: string): string => {
    const key = `language.${code}`;
    const localized = t(key);
    // If the key wasn't found, t() returns the key itself
    return localized === key ? nativeLabel : localized;
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {getLocalizedName(lang.code, lang.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSelect;

