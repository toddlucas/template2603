import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";
import { LOG_CONFIG, LOG_LEVELS } from "$/platform/logging";
import { setAcceptLanguage } from "$/api";

const languageDetector = new LanguageDetector(null, {
  // Use the same key for both localStorage and cookies
  lookupLocalStorage: "I18N_LANGUAGE",
  lookupCookie: "I18N_LANGUAGE",
  // Order of detection: localStorage first, then cookie, then browser
  order: ["localStorage", "cookie", "navigator"],
  // Cache user language
  caches: ["localStorage", "cookie"],
});

const language = localStorage.getItem("I18N_LANGUAGE");
if (!language) {
  localStorage.setItem("I18N_LANGUAGE", "en");
}

// Export for TypeScript type definitions
export const defaultNS = "translation" as const;

i18n
  .use(languageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem("I18N_LANGUAGE") || "en",
    defaultNS: defaultNS,
    fallbackNS: ["translation", "common"],
    fallbackLng: "en", // use en if detected lng is not available

    // keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  }, (err, t) => {
    void t; // Unused
    if (err) {
      // eslint-disable-next-line no-console
      if (LOG_CONFIG.AUTH >= LOG_LEVELS.ERROR) console.error('🔐 [I18N] Error initializing i18n', err);
      return;
    }

    const language = (i18n.language || "en-US,en") + ";q=0.9";
    setAcceptLanguage(language);

    // Attach the listener right after init
    i18n.on('languageChanged', (lng) => {
      const language = (lng || "en-US,en") + ";q=0.9";
      setAcceptLanguage(language);
    });
  });

export default i18n;
