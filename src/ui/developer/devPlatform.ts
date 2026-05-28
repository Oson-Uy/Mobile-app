import { Platform, StyleSheet, type ViewStyle } from "react-native";

import { elevation, radii, spacing } from "../../theme/tokens";

/** Карточка / поверхность в стиле iOS Settings + Material 3 на Android. */
export function devCardSurface(): ViewStyle {
  return Platform.select({
    ios: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
      ...elevation.card,
      shadowOpacity: 0.06,
      shadowRadius: 10,
    },
    android: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
      elevation: 2,
    },
    default: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
    },
  }) as ViewStyle;
}

export const devIconButtonSize = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const devTouchTarget = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const devSearchHeight = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const devPillHeight = Platform.select({ ios: 36, android: 40, default: 36 })!;

export const devListPadding = spacing.lg;

export const devFabRadius = Platform.select({ ios: 16, android: 18, default: 16 })!;
