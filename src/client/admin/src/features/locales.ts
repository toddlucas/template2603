import { identity } from "../features/identity/locales";
import { organization } from "../features/organization/locales";

export const features = {
  de: { ...identity.de, ...organization.de },
  el: { ...identity.el, ...organization.el },
  en: { ...identity.en, ...organization.en },
  es: { ...identity.es, ...organization.es },
  fr: { ...identity.fr, ...organization.fr },
};
