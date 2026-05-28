import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "../../theme/AppThemeProvider";
import type { AppPalette } from "../../theme/tokens";
import { radii, spacing } from "../../theme/tokens";

export type ProjectFilterOption = { id: number; name: string };

type Props = {
  projects: ProjectFilterOption[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  allLabel: string;
};

export function ProjectFilterChips({ projects, selectedId, onSelect, allLabel }: Props) {
  const { palette: p } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label={allLabel}
          active={selectedId === null}
          onPress={() => onSelect(null)}
          p={p}
        />
        {projects.map((proj) => (
          <Chip
            key={proj.id}
            label={proj.name}
            active={selectedId === proj.id}
            onPress={() => onSelect(proj.id)}
            p={p}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  p,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  p: AppPalette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? p.primary : p.surfaceMuted,
          borderColor: active ? p.primary : p.outline,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        variant="labelLarge"
        numberOfLines={1}
        style={[styles.chipTxt, { color: active ? "#FFFFFF" : p.text }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  row: {
    gap: spacing.sm,
    paddingVertical: Platform.select({ ios: 2, android: 4, default: 2 }),
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 8, android: 10, default: 8 }),
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 220,
  },
  chipTxt: { fontWeight: "700", fontSize: Platform.select({ ios: 13, android: 14, default: 13 }) },
});
