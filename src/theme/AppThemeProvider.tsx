import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import type { MD3Theme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";

import { getSecureItemWithTimeout } from "../lib/secureRead";
import { STORAGE_KEYS } from "../preferences/storageKeys";
import { buildPaperTheme } from "./paper";
import { syncNativeAppearance } from "./nativeAppearance";
import { parseThemePreference, resolveThemeMode } from "./resolveMode";
import {
  getColors,
  type AppColors,
  type ResolvedThemeMode,
  type ThemePreference,
} from "./tokens";

/** @deprecated Use ResolvedThemeMode */
export type ThemeMode = ResolvedThemeMode;

type AppThemeContextValue = {
  hydrated: boolean;
  preference: ThemePreference;
  resolvedMode: ResolvedThemeMode;
  colors: AppColors;
  setPreference: (p: ThemePreference) => Promise<void>;
  toggleMode: () => Promise<void>;
  paperTheme: MD3Theme;
  /** @deprecated Use colors / resolvedMode */
  mode: ResolvedThemeMode;
  /** @deprecated Use colors */
  palette: AppColors & {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceMuted: string;
    outline: string;
    text: string;
    textMuted: string;
  };
  /** @deprecated Use setPreference */
  setMode: (m: ResolvedThemeMode) => Promise<void>;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function toLegacyPalette(colors: AppColors) {
  return {
    ...colors,
    primary: colors.brand,
    secondary: colors.brandSecondary,
    background: colors.bg,
    surface: colors.bgElevated,
    surfaceMuted: colors.fill,
    outline: colors.separator,
    text: colors.label,
    textMuted: colors.labelSecondary,
  };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [hydrated, setHydrated] = useState(false);
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    const cap = setTimeout(() => setHydrated(true), 4500);
    void (async () => {
      try {
        const raw = await getSecureItemWithTimeout(STORAGE_KEYS.theme);
        setPreferenceState(parseThemePreference(raw));
      } finally {
        clearTimeout(cap);
        setHydrated(true);
      }
    })();
    return () => clearTimeout(cap);
  }, []);

  const resolvedMode = resolveThemeMode(preference, systemScheme);
  const colors = getColors(resolvedMode);

  useEffect(() => {
    syncNativeAppearance(preference, resolvedMode);
  }, [preference, resolvedMode]);

  const setPreference = useCallback(async (p: ThemePreference) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.theme, p);
    setPreferenceState(p);
  }, []);

  const setMode = useCallback(
    async (m: ResolvedThemeMode) => {
      await setPreference(m);
    },
    [setPreference],
  );

  const toggleMode = useCallback(async () => {
    const next: ResolvedThemeMode = resolvedMode === "light" ? "dark" : "light";
    await setPreference(next);
  }, [resolvedMode, setPreference]);

  const paperTheme = useMemo(() => buildPaperTheme(resolvedMode), [resolvedMode]);
  const legacyPalette = useMemo(() => toLegacyPalette(colors), [colors]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      hydrated,
      preference,
      resolvedMode,
      colors,
      setPreference,
      toggleMode,
      paperTheme,
      mode: resolvedMode,
      palette: legacyPalette,
      setMode,
    }),
    [
      hydrated,
      preference,
      resolvedMode,
      colors,
      setPreference,
      toggleMode,
      paperTheme,
      legacyPalette,
      setMode,
    ],
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
