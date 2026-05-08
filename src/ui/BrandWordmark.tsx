import React from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "../theme/AppThemeProvider";

type Props = {
  size?: number;
  textStyle?: React.ComponentProps<typeof Text>["style"];
  /**
   * Если фон тёмный (например primary), то оставляем буквы белыми,
   * но подчёркиваем фирменным оранжевым.
   */
  onDark?: boolean;
};

export function BrandWordmark({
  size = 26,
  textStyle,
  onDark = false,
}: Props) {
  const { palette: p } = useAppTheme();

  if (onDark) {
    return (
      <Text accessibilityLabel="Oson Uy" style={[styles.wordmark, { fontSize: size, color: "#FFFFFF" }, textStyle]}>
        Oson Uy
      </Text>
    );
  }

  return (
    <Text accessibilityLabel="Oson Uy" style={[styles.wordmark, { fontSize: size }, textStyle]}>
      <Text style={{ color: p.primary }}>Oson</Text>
      <Text>{" "}</Text>
      <Text style={{ color: p.secondary }}>Uy</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontWeight: "900",
    letterSpacing: -0.6,
  },
});

