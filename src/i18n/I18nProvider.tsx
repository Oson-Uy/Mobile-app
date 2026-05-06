import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

import { getSecureItemWithTimeout } from "../lib/secureRead";
import { STORAGE_KEYS } from "../preferences/storageKeys";
import ru from "./messages/ru.json";
import uz from "./messages/uz.json";
import en from "./messages/en.json";

export type Locale = "ru" | "uz" | "en";
type Dict = Record<string, any>;

const MESSAGES: Record<Locale, Dict> = { ru, uz, en };

type I18nContextValue = {
  hydrated: boolean;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
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
  const [hydrated, setHydrated] = useState(false);
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    void (async () => {
      try {
        const raw = await getSecureItemWithTimeout(STORAGE_KEYS.locale);
        if (raw === "ru" || raw === "uz" || raw === "en") {
          setLocaleState(raw);
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await SecureStore.setItemAsync(STORAGE_KEYS.locale, next);
  }, []);

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
    () => ({ hydrated, locale, setLocale, t }),
    [hydrated, locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

