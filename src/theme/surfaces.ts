import { Platform, StyleSheet, type ViewStyle } from "react-native";

import { radii } from "./tokens";
import type { ResolvedThemeMode } from "./tokens";

export function cardSurface(mode: ResolvedThemeMode): ViewStyle {
  const shadowColor = mode === "dark" ? "#000000" : "#000000";
  const shadowOpacity = mode === "dark" ? 0.35 : 0.06;

  return Platform.select({
    ios: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
      shadowColor,
      shadowOffset: { width: 0, height: mode === "dark" ? 2 : 4 },
      shadowOpacity,
      shadowRadius: mode === "dark" ? 8 : 12,
    },
    android: {
      borderRadius: radii.card,
      borderWidth: mode === "dark" ? 0 : StyleSheet.hairlineWidth,
      elevation: mode === "dark" ? 2 : 3,
    },
    default: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
    },
  }) as ViewStyle;
}
