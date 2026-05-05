export const STORAGE_KEYS = {
  locale: "oson_locale_v1",
  theme: "oson_theme_v1",
  onboarding: "oson_onboarding_v1",
  role: "oson_role_v1",
} as const;

export type UserRole = "buyer" | "developer";
