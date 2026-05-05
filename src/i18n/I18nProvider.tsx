import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import ru from "./messages/ru.json";
import uz from "./messages/uz.json";
import en from "./messages/en.json";

type Locale = "ru" | "uz" | "en";
type Dict = Record<string, any>;

const MESSAGES: Record<Locale, Dict> = { ru, uz, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function formatTemplate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru");

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = MESSAGES[locale];
      const raw = getByPath(dict, key);
      if (typeof raw !== "string") return key;
      return formatTemplate(raw, vars);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

