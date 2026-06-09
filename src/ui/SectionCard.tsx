import React from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "../theme/AppThemeProvider";
import { radii, spacing } from "../theme/tokens";

type Props = ViewProps & { padded?: boolean };

export function SectionCard({ style, children, padded = true, ...rest }: Props) {
  const { colors: c } = useAppTheme();
  const { color: _ignoreColor, ...safeRest } = rest as Props & {
    color?: unknown;
  };
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.separator,
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
