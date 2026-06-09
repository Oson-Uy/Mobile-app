import { useColorScheme } from "react-native";

import type { ResolvedThemeMode, ThemePreference } from "./tokens";

export function resolveThemeMode(
  preference: ThemePreference,
  systemScheme: ReturnType<typeof useColorScheme>,
): ResolvedThemeMode {
  if (preference === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return preference;
}

export function parseThemePreference(raw: string | null): ThemePreference {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}
