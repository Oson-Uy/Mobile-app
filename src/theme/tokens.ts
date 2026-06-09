/** Подложка под фирменное лого (splash): всегда белая. */
export const brandLogoBackdrop = "#FFFFFF";

export type AppColors = {
  bg: string;
  bgGrouped: string;
  bgElevated: string;
  label: string;
  labelSecondary: string;
  separator: string;
  brand: string;
  brandOn: string;
  brandSecondary: string;
  fill: string;
  success: string;
  error: string;
  warning: string;
  popular: string;
  onMedia: string;
  overlay: string;
};

/** iOS system grouped / M3 light surfaces */
export const lightColors: AppColors = {
  bg: brandLogoBackdrop,
  bgGrouped: "#F2F2F7",
  bgElevated: "#FFFFFF",
  label: "#000000",
  labelSecondary: "#636366",
  separator: "#C6C6C8",
  brand: "#1E3A8A",
  brandOn: "#FFFFFF",
  brandSecondary: "#F97316",
  fill: "#E5E5EA",
  success: "#10B981",
  error: "#DC2626",
  warning: "#F5A623",
  popular: "#FB7185",
  onMedia: "#FFFFFF",
  overlay: "rgba(0,0,0,0.45)",
};

/** Нейтральный dark (iOS Settings / M3), brand только на акцентах */
export const darkColors: AppColors = {
  bg: "#000000",
  bgGrouped: "#000000",
  bgElevated: "#1C1C1E",
  label: "#FFFFFF",
  labelSecondary: "#8E8E93",
  separator: "#38383A",
  brand: "#5B8DEF",
  brandOn: "#FFFFFF",
  brandSecondary: "#FB923C",
  fill: "#2C2C2E",
  success: "#30D158",
  error: "#FF453A",
  warning: "#FFD60A",
  popular: "#FF6482",
  onMedia: "#FFFFFF",
  overlay: "rgba(0,0,0,0.55)",
};

export type ResolvedThemeMode = "light" | "dark";
export type ThemePreference = "system" | ResolvedThemeMode;

export function getColors(mode: ResolvedThemeMode): AppColors {
  return mode === "dark" ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  card: 20,
} as const;
