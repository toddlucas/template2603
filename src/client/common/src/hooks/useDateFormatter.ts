import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Date formatting presets for consistent display across the app.
 */
export type DateFormatPreset = "short" | "long" | "dateTime" | "relative";

const formatOptions: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
  /** e.g., "Dec 7, 2025" */
  short: {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  /** e.g., "December 7, 2025" */
  long: {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
  /** e.g., "December 7, 2025, 2:30 PM" */
  dateTime: {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  /** Placeholder for relative (handled separately) */
  relative: {},
};

/**
 * Hook for formatting dates according to the user's selected app language.
 *
 * Uses the Intl API with the i18n language setting, ensuring dates
 * are formatted consistently with the app's language rather than the browser locale.
 *
 * @example
 * ```tsx
 * const { formatDate } = useDateFormatter();
 *
 * // Basic usage - defaults to "long" format
 * <span>{formatDate(contact.createdAt)}</span>
 *
 * // With specific preset
 * <span>{formatDate(sequence.activatedAt, "dateTime")}</span>
 *
 * // Short format for compact displays
 * <span>{formatDate(item.date, "short")}</span>
 * ```
 */
export const useDateFormatter = () => {
  const { i18n } = useTranslation();

  /**
   * Format a date according to the app's current language.
   *
   * @param date - Date to format (Date object, ISO string, or null/undefined)
   * @param preset - Format preset: "short", "long", "dateTime", or "relative"
   * @returns Formatted date string, or "—" for null/undefined values
   */
  const formatDate = useCallback(
    (
      date: Date | string | null | undefined,
      preset: DateFormatPreset = "long"
    ): string => {
      if (!date) return "—";

      const d = typeof date === "string" ? new Date(date) : date;

      // Handle relative time formatting
      if (preset === "relative") {
        return formatRelativeTime(d, i18n.language);
      }

      return d.toLocaleDateString(i18n.language, formatOptions[preset]);
    },
    [i18n.language]
  );

  /**
   * Format a date with custom options.
   *
   * @param date - Date to format
   * @param options - Intl.DateTimeFormatOptions for custom formatting
   */
  const formatDateCustom = useCallback(
    (
      date: Date | string | null | undefined,
      options: Intl.DateTimeFormatOptions
    ): string => {
      if (!date) return "—";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleString(i18n.language, options);
    },
    [i18n.language]
  );

  /**
   * Format a time string (HH:mm) according to the app's current language.
   *
   * @param time - Time string in HH:mm format (e.g., "09:00", "17:30")
   * @returns Localized time string (e.g., "9:00 AM" for en-US, "09:00" for de)
   *
   * @example
   * ```tsx
   * const { formatTime } = useDateFormatter();
   * <span>{formatTime("09:00")}</span> // "9:00 AM" in English
   * <span>{formatTime("17:30")}</span> // "5:30 PM" in English, "17:30" in German
   * ```
   */
  const formatTime = useCallback(
    (time: string | null | undefined): string => {
      if (!time) return "—";

      const [hours, minutes] = time.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return time;

      // Create a date object to leverage Intl formatting (date doesn't matter)
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      return date.toLocaleTimeString(i18n.language, {
        hour: "numeric",
        minute: "2-digit",
      });
    },
    [i18n.language]
  );

  return { formatDate, formatDateCustom, formatTime, locale: i18n.language };
};

/**
 * Format a date as relative time (e.g., "2 days ago", "in 3 hours").
 * Uses the Intl.RelativeTimeFormat API for proper localization.
 */
function formatRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, "day");
  }
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, "hour");
  }
  if (Math.abs(diffMins) >= 1) {
    return rtf.format(diffMins, "minute");
  }
  return rtf.format(diffSecs, "second");
}

export default useDateFormatter;

