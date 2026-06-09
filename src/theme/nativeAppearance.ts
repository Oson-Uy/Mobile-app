import { Appearance } from "react-native";

import type { ResolvedThemeMode, ThemePreference } from "./tokens";

/** Синхронизирует UITabBar / UINavigationBar с темой приложения (не только системной). */
export function syncNativeAppearance(
  preference: ThemePreference,
  resolvedMode: ResolvedThemeMode,
): void {
  if (preference === "system") {
    Appearance.setColorScheme(null);
    return;
  }
  Appearance.setColorScheme(resolvedMode);
}
