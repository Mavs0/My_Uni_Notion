"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, translations, Translations } from "./translations";
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}
const I18nContext = createContext<I18nContextType | undefined>(undefined);
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-BR");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("app:locale") as Locale;
      if (savedLocale && (savedLocale === "pt-BR" || savedLocale === "en")) {
        setLocaleState(savedLocale);
      }
    }
  }, []);
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app:locale", newLocale);
  };
  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}