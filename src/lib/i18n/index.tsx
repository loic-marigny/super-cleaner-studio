import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en";
import fr from "./fr";
import ru from "./ru";
import zh from "./zh";

export type Locale = "fr" | "en" | "ru" | "zh";

type TranslationDictionary = Record<string, unknown>;

const dictionaries: Record<Locale, TranslationDictionary> = { fr, en, ru, zh };
const STORAGE_KEY = "super-cleaner.locale";

let activeLocale: Locale = "fr";

function resolveNode(dictionary: TranslationDictionary, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dictionary);
}

function formatText(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? ""));
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>) {
  const value = resolveNode(dictionaries[locale], key);
  if (typeof value === "string") return formatText(value, params);
  return key;
}

export function getLocale() {
  return activeLocale;
}

export function translateGlobal(key: string, params?: Record<string, string | number>) {
  return translate(activeLocale, key, params);
}

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "ru" || stored === "zh" ? stored : "fr";
}

function syncLocale(locale: Locale) {
  activeLocale = locale;
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  useEffect(() => {
    syncLocale(locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
