/** Подложка под фирменное лого (splash, лоадеры): белый — синее лого читается. */
export const brandLogoBackdrop = "#FFFFFF";

export const palette = {
  primary: "#1E3A8A",
  secondary: "#F97316",
  /** Светлый фон приложения — белый, без «синего» оттенка за логотипом. */
  background: brandLogoBackdrop,
  surface: "#FFFFFF",
  surfaceMuted: "#F8FAFC",
  outline: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#64748B",
  success: "#10B981",
  error: "#DC2626",
  popular: "#FB7185",
} as const;

/** Dark theme: same brand, surfaces tuned for night UI */
export const darkPalette = {
  primary: "#93C5FD",
  secondary: "#FB923C",
  background: "#0B1220",
  surface: "#111C2F",
  surfaceMuted: "#172554",
  outline: "#334155",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  success: "#34D399",
  error: "#F87171",
  popular: "#FB7185",
} as const;

export type AppPalette = typeof palette | typeof darkPalette;

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

export const elevation = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;
