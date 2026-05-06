import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";
import * as SecureStore from "expo-secure-store";

import { getSecureItemWithTimeout } from "../lib/secureRead";
import { STORAGE_KEYS } from "../preferences/storageKeys";
import { darkPalette, palette, type AppPalette } from "./tokens";

export type ThemeMode = "light" | "dark";

type AppThemeContextValue = {
  hydrated: boolean;
  mode: ThemeMode;
  palette: AppPalette;
  setMode: (m: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  paperTheme: MD3Theme;
  navTheme: typeof NavigationDefaultTheme;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function buildPaperTheme(mode: ThemeMode): MD3Theme {
  const p = mode === "dark" ? darkPalette : palette;
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme;
  const titleWeight = Platform.OS === "ios" ? "600" : "600";
  return {
    ...base,
    roundness: 14,
    fonts: {
      ...base.fonts,
      titleLarge: {
        ...base.fonts.titleLarge,
        fontWeight: titleWeight,
      },
      titleMedium: {
        ...base.fonts.titleMedium,
        fontWeight: titleWeight,
      },
    },
    colors: {
      ...base.colors,
      primary: p.primary,
      onPrimary: mode === "dark" ? "#0F172A" : "#FFFFFF",
      primaryContainer: mode === "dark" ? "#1E3A8A" : "#E0E7FF",
      onPrimaryContainer: mode === "dark" ? "#E0E7FF" : "#172554",
      secondary: p.secondary,
      onSecondary: "#FFFFFF",
      secondaryContainer: mode === "dark" ? "#7C2D12" : "#FFEDD5",
      onSecondaryContainer: mode === "dark" ? "#FFEDD5" : "#7C2D12",
      background: p.background,
      surface: p.surface,
      surfaceVariant: p.surfaceMuted,
      onSurface: p.text,
      onSurfaceVariant: p.textMuted,
      outline: p.outline,
      outlineVariant: mode === "dark" ? "#475569" : "#CBD5E1",
      elevation: {
        ...base.colors.elevation,
        level1: p.surface,
      },
    },
  };
}

function buildNavTheme(mode: ThemeMode) {
  const p = mode === "dark" ? darkPalette : palette;
  const base = mode === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: p.primary,
      background: p.background,
      card: p.surface,
      text: p.text,
      border: p.outline,
      notification: p.secondary,
    },
  };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    void (async () => {
      try {
        const raw = await getSecureItemWithTimeout(STORAGE_KEYS.theme);
        if (raw === "dark" || raw === "light") setModeState(raw);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setMode = useCallback(async (m: ThemeMode) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.theme, m);
    setModeState(m);
  }, []);

  const toggleMode = useCallback(async () => {
    const next = mode === "light" ? "dark" : "light";
    await setMode(next);
  }, [mode, setMode]);

  const p = mode === "dark" ? darkPalette : palette;
  const paperTheme = useMemo(() => buildPaperTheme(mode), [mode]);
  const navTheme = useMemo(() => buildNavTheme(mode), [mode]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      hydrated,
      mode,
      palette: p,
      setMode,
      toggleMode,
      paperTheme,
      navTheme,
    }),
    [hydrated, mode, p, setMode, toggleMode, paperTheme, navTheme],
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
