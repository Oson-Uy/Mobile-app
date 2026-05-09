import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

import { radii, spacing } from "../theme/tokens";

type Props = ViewProps & { padded?: boolean };

export function SectionCard({ style, children, padded = true, ...rest }: Props) {
  const theme = useTheme();
  const { color: _ignoreColor, ...safeRest } = rest as Props & {
    color?: unknown;
  };
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.elevation.level1,
          borderColor: theme.colors.outlineVariant,
        },
        padded && styles.padded,
        style,
      ]}
      {...safeRest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: spacing.lg,
  },
});
