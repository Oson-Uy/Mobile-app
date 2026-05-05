import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { spacing } from "../theme/tokens";

type Props = { title: string; subtitle?: string };

export function SectionTitle({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodySmall" style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: 4,
  },
  title: {
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  sub: {
    opacity: 0.75,
  },
});
