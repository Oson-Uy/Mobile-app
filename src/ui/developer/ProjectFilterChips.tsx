import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { chipOnBrand } from "../../theme/chips";
import { pillHeight } from "../platform";
import { radii, spacing } from "../../theme/tokens";

type Chip = { id: string; label: string };

type Props = {
  chips: Chip[];
  activeId: string;
  onChange: (id: string) => void;
};

export function ProjectFilterChips({ chips, activeId, onChange }: Props) {
  const { colors: c } = useAppTheme();
  const onBrand = chipOnBrand(c);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onChange(chip.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? c.brand : c.bgGrouped,
                borderColor: active ? c.brand : c.separator,
              },
            ]}
          >
            <Text style={[styles.chipTxt, { color: active ? onBrand : c.label }]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chip: {
    height: pillHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chipTxt: { fontWeight: "700", fontSize: 13 },
});
