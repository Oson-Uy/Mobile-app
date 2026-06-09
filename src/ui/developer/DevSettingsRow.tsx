import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { spacing } from "../../theme/tokens";

type Props = {
  label: string;
  value: string;
  last?: boolean;
};

/** Строка как в iOS Settings: label сверху, value снизу. */
export function DevSettingsRow({ label, value, last }: Props) {
  const { colors: c } = useAppTheme();
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator },
      ]}
    >
      <Text variant="labelSmall" style={[styles.label, { color: c.labelSecondary }]}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={[styles.value, { color: c.label }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Platform.select({ ios: spacing.md, android: spacing.md + 2, default: spacing.md }),
  },
  label: {
    fontWeight: "600",
    letterSpacing: Platform.select({ ios: 0.2, android: 0.3, default: 0.2 }),
    marginBottom: 4,
    textTransform: Platform.OS === "ios" ? "none" : "none",
  },
  value: {
    lineHeight: Platform.select({ ios: 22, android: 24, default: 22 }),
  },
});
