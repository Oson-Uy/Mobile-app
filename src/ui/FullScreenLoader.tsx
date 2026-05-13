import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/AppThemeProvider";
import { BrandLogo } from "./BrandLogo";

type Props = {
  message?: string;
  /** Для пустых списков и второстепенных экранов — компактная колонка. */
  compact?: boolean;
};

export function FullScreenLoader({ message, compact }: Props) {
  const { palette: p } = useAppTheme();

  if (compact) {
    return (
      <View style={styles.compact} accessibilityRole="progressbar">
        <BrandLogo size={40} />
        <ActivityIndicator color={p.primary} style={styles.compactSpinner} />
        {message ? (
          <Text style={[styles.msgText, { color: p.textMuted }]}>{message}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[styles.full, { backgroundColor: p.background }]}
      accessibilityRole="progressbar"
    >
      <BrandLogo size={88} />
      <ActivityIndicator color={p.primary} size="large" style={styles.spinner} />
      {message ? (
        <Text style={[styles.msg, styles.msgText, { color: p.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** alignSelf + width: иначе в родителе с alignItems: "center" (часто экраны загрузки) колонка сжимается до ширины контента — «узкая белая полоска». */
  full: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: { marginTop: 20 },
  msg: { marginTop: 16, textAlign: "center" },
  msgText: { fontSize: 16, lineHeight: 22 },
  compact: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  compactSpinner: { marginTop: 4 },
});
