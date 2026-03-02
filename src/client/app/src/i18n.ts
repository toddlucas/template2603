import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { common } from "$/locales";

const languageDetector = new LanguageDetector(null, {
  lookupLocalStorage: "I18N_LANGUAGE",
  lookupCookie: "I18N_LANGUAGE",
  order: ["localStorage", "cookie", "navigator"],
  caches: ["localStorage", "cookie"],
});

const language = localStorage.getItem("I18N_LANGUAGE");
if (!language) {
  localStorage.setItem("I18N_LANGUAGE", "en");
}

export const defaultNS = "translation" as const;

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { ...common.de },
      el: { ...common.el },
      en: { ...common.en },
      es: { ...common.es },
      fr: { ...common.fr },
    },
    lng: localStorage.getItem("I18N_LANGUAGE") || "en",
    defaultNS: defaultNS,
    fallbackNS: ["translation", "common"],
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
