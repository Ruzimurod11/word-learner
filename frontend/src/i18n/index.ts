import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./locales/uz.json";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

export const SUPPORTED_LANGS = ["uz", "en", "ru"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = "uz";
const STORAGE_KEY = "lang";

function readInitialLang(): Lang {
  if (typeof localStorage === "undefined") return DEFAULT_LANG;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
    return stored as Lang;
  }
  return DEFAULT_LANG;
}

export const initialLang = readInitialLang();

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLang,
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
});

export function setLang(lang: Lang): void {
  void i18n.changeLanguage(lang);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

export function getLang(): Lang {
  return (i18n.language as Lang) ?? DEFAULT_LANG;
}

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLang;
}

export default i18n;
