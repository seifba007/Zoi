import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Language, TranslationKey, translations } from "./translations";

const STORAGE_KEY = "zoi.language";
const DEFAULT_LANGUAGE: Language = "de"; // German is the restaurant's default

/** A string that exists in both languages — used for product names, descriptions, … */
export type Localized = { de: string; en: string };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Translate a key, optionally interpolating {placeholders}. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Pick the active language out of a localized object. */
  tr: (value: Localized | string | undefined) => string;
  /** Format a number as currency in the active locale. */
  formatPrice: (value: number) => string;
  /** Format a date/time in the active locale. */
  formatTime: (value: Date | string) => string;
  formatDate: (value: Date | string, withTime?: boolean) => string;
  locale: string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const readStoredLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "en" || stored === "de" ? stored : DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);

  const value = useMemo<LanguageContextValue>(() => {
    const locale = language === "de" ? "de-DE" : "en-GB";

    const t: LanguageContextValue["t"] = (key, vars) => {
      const entry = translations[key];
      let text = entry ? entry[language] : (key as string);
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement));
        }
      }
      return text;
    };

    const tr: LanguageContextValue["tr"] = (input) => {
      if (!input) return "";
      if (typeof input === "string") return input;
      return input[language] || input.de || input.en;
    };

    const formatPrice = (amount: number) =>
      new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(amount);

    const formatTime = (value: Date | string) =>
      new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

    const formatDate = (value: Date | string, withTime = false) =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      }).format(new Date(value));

    return { language, setLanguage, t, tr, formatPrice, formatTime, formatDate, locale };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used inside a LanguageProvider");
  return context;
};
