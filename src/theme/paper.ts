import { Platform } from "react-native";
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";

import { getColors, type ResolvedThemeMode } from "./tokens";

export function buildPaperTheme(mode: ResolvedThemeMode): MD3Theme {
  const c = getColors(mode);
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme;
  const titleWeight = "600" as const;

  return {
    ...base,
    roundness: 14,
    fonts: {
      ...base.fonts,
      titleLarge: { ...base.fonts.titleLarge, fontWeight: titleWeight },
      titleMedium: { ...base.fonts.titleMedium, fontWeight: titleWeight },
    },
    colors: {
      ...base.colors,
      primary: c.brand,
      onPrimary: c.brandOn,
      primaryContainer: mode === "dark" ? "#1C3A6E" : "#E0E7FF",
      onPrimaryContainer: mode === "dark" ? "#D6E4FF" : "#172554",
      secondary: c.brandSecondary,
      onSecondary: c.brandOn,
      secondaryContainer: mode === "dark" ? "#3D2817" : "#FFEDD5",
      onSecondaryContainer: mode === "dark" ? "#FFEDD5" : "#7C2D12",
      background: c.bg,
      surface: c.bgElevated,
      surfaceVariant: c.bgGrouped,
      onSurface: c.label,
      onSurfaceVariant: c.labelSecondary,
      outline: c.separator,
      outlineVariant: mode === "dark" ? "#48484A" : "#D1D1D6",
      elevation: {
        ...base.colors.elevation,
        level1: c.bgElevated,
      },
      error: c.error,
    },
  };
}
