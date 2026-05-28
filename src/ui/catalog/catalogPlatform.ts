import { Platform, StyleSheet, type ViewStyle } from "react-native";

import { elevation, radii, spacing } from "../../theme/tokens";

export const catalogListPadding = spacing.lg;

export const catalogSearchHeight = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const catalogBtnHeight = Platform.select({ ios: 48, android: 52, default: 48 })!;

export const catalogSecondaryBtnHeight = Platform.select({ ios: 44, android: 48, default: 44 })!;

export function catalogCardSurface(): ViewStyle {
  return Platform.select({
    ios: {
      borderRadius: radii.card,
      borderWidth: StyleSheet.hairlineWidth,
      ...elevation.card,
      shadowOpacity: 0.07,
      shadowRadius: 12,
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
