import React, { type ComponentProps } from "react";
import { Platform, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../src/i18n/I18nProvider";
import { useAppTheme } from "../../src/theme/AppThemeProvider";
import { iosSemanticColor } from "../../src/theme/iosDynamicColor";
import { canUseNativeTabs } from "../../src/navigation/useNativeTabs";

function NativeBuyerTabs() {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();

  const barBg = Platform.OS === "ios" ? iosSemanticColor("bgElevated") : c.bgElevated;
  const tint = Platform.OS === "ios" ? iosSemanticColor("brand") : c.brand;
  const iconMuted =
    Platform.OS === "ios" ? iosSemanticColor("labelSecondary") : c.labelSecondary;
  const selected = Platform.OS === "ios" ? iosSemanticColor("brand") : c.brand;

  return (
    <NativeTabs backgroundColor={barBg} tintColor={tint} iconColor={iconMuted}>
      <NativeTabs.Trigger name="(catalog)">
        <Label>{t("tabs.catalog")}</Label>
        <Icon
          sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="grid-outline" />}
          selectedColor={selected}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(cabinet)">
        <Label>{t("tabs.myApartmentShort")}</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          androidSrc={<VectorIcon family={Ionicons} name="home-outline" />}
          selectedColor={selected}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function JsBuyerTabs() {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();

  const icon =
    (name: ComponentProps<typeof Ionicons>["name"]) =>
    ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={name} color={color} size={size} />
    );

  const tabBarStyle = {
    backgroundColor: c.bgElevated,
    borderTopColor: c.separator,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
    height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.labelSecondary,
        tabBarStyle,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="(catalog)"
        options={{
          title: t("tabs.catalog"),
          tabBarIcon: icon("grid-outline"),
        }}
      />
      <Tabs.Screen
        name="(cabinet)"
        options={{
          title: t("tabs.myApartmentShort"),
          tabBarIcon: icon("home-outline"),
        }}
      />
    </Tabs>
  );
}

export default function BuyerTabLayout() {
  return canUseNativeTabs() ? <NativeBuyerTabs /> : <JsBuyerTabs />;
}
