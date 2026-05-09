import React from "react";
import { Platform, StyleSheet, Text } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../i18n/I18nProvider";
import { exitDeveloperWorkspace } from "../navigation/navigationRef";
import { useAppTheme } from "../theme/AppThemeProvider";

/**
 * Кабинет застройщика: кнопка «Каталог» в шапке.
 * Используем HeaderButton из @react-navigation/elements — иначе на iOS нативный стек
 * может передать `color` на обычный RCTView (обёртка headerLeft) и получить
 * -[RCTView setColor:]: unrecognized selector.
 */
export function HeaderCatalogButton() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();

  return (
    <HeaderButton
      accessibilityLabel={t("developer.openProjectCatalogA11y")}
      onPress={() => exitDeveloperWorkspace()}
      pressColor={Platform.OS === "android" ? "rgba(0,0,0,0.08)" : undefined}
      style={[
        styles.btn,
        { borderColor: p.outline, backgroundColor: p.surfaceMuted },
      ]}
    >
      <MaterialCommunityIcons name="storefront-outline" size={18} color={p.primary} />
      <Text style={[styles.label, { color: p.primary }]} numberOfLines={1}>
        {t("developer.openProjectCatalog")}
      </Text>
    </HeaderButton>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    maxWidth: 130,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === "ios" ? { borderCurve: "continuous" as const } : {}),
  },
  label: {
    fontWeight: "800",
    fontSize: 13,
    flexShrink: 1,
  },
});
