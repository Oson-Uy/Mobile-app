import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../i18n/I18nProvider";
import { exitDeveloperWorkspace } from "../navigation/navigationRef";
import { useAppTheme } from "../theme/AppThemeProvider";

/**
 * Кабинет застройщика: явная кнопка перехода в каталог покупателя (не «просто текст назад»).
 */
export function HeaderCatalogButton() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("developer.openProjectCatalogA11y")}
      onPress={() => exitDeveloperWorkspace()}
      hitSlop={8}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: p.surfaceMuted,
          borderColor: p.outline,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.inner}>
        <MaterialCommunityIcons name="storefront-outline" size={18} color={p.primary} />
        <Text style={[styles.label, { color: p.primary }]} numberOfLines={1}>
          {t("developer.openProjectCatalog")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginLeft: 2,
    marginRight: 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 118,
    flexShrink: 0,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  label: {
    fontWeight: "800",
    fontSize: 13,
    flexShrink: 1,
  },
});
