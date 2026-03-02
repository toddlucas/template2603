// Shared features loaded upfront (used across all apps)
import { frame } from "./frame/locales";

// App-specific features are now lazy-loaded per app
// See apps/example/locales/index.ts and apps/mail/locales/index.ts

export const features = {
  de: { ...frame.de },
  el: { ...frame.el },
  en: { ...frame.en },
  es: { ...frame.es },
  fr: { ...frame.fr },
};
