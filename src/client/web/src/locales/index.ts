import de from "./de";
import el from "./el";
import en from "./en";
import es from "./es";
import fr from "./fr";

import { common } from "$/locales";
import { features } from "../features/locales";

export const resources = {
  de: { ...de, ...features.de, ...common.de },
  el: { ...el, ...features.el, ...common.el },
  en: { ...en, ...features.en, ...common.en },
  es: { ...es, ...features.es, ...common.es },
  fr: { ...fr, ...features.fr, ...common.fr },
};
