import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { createBottomTabNavigator, BottomTabBarHeightCallbackContext } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../i18n/I18nProvider";
import { nativeStackGlassScreenOptions } from "../../navigation/glassOptions";
import { CatalogSettingsModal } from "../catalog/CatalogSettingsModal";
import { HeaderCatalogButton } from "../../ui/HeaderCatalogButton";
import { registerForPushAndSyncToken } from "../../push/register";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { iosSemanticColor } from "../../theme/iosDynamicColor";
import { DeveloperFloorsScreen } from "./DeveloperFloorsScreen";
import { DeveloperFloorEditorScreen } from "./DeveloperFloorEditorScreen";
import { DeveloperLeadsScreen } from "./DeveloperLeadsScreen";
import { DeveloperProfileScreen } from "./DeveloperProfileScreen";
import { DeveloperProjectEditorScreen } from "./DeveloperProjectEditorScreen";
import { DeveloperProjectProgressScreen } from "./DeveloperProjectProgressScreen";
import { DeveloperProjectsScreen } from "./DeveloperProjectsScreen";
import { DeveloperSubscriptionsScreen } from "./DeveloperSubscriptionsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TabStack = createNativeStackNavigator();

type TabStackProps = {
  component: React.ComponentType;
  title: string;
  onOpenSettings: () => void;
};

const TAB_ICONS: Record<string, { default: keyof typeof Ionicons.glyphMap; selected: keyof typeof Ionicons.glyphMap }> = {
  Projects: { default: "business-outline", selected: "business" },
  Floors: { default: "layers-outline", selected: "layers" },
  Leads: { default: "document-text-outline", selected: "document-text" },
  Subscriptions: { default: "card-outline", selected: "card" },
  Profile: { default: "person-outline", selected: "person" },
};

function DeveloperTabStack({ component: Screen, title, onOpenSettings }: TabStackProps) {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  return (
    <TabStack.Navigator screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
      <TabStack.Screen
        name="Main"
        component={Screen}
        options={{
          title,
          headerLeft: () => <HeaderCatalogButton />,
          headerRight: () => (
            <HeaderButton
              accessibilityLabel={t("catalog.settings")}
              onPress={onOpenSettings}
            >
              <Ionicons name="settings-outline" size={22} color={c.brand} />
            </HeaderButton>
          ),
        }}
      />
    </TabStack.Navigator>
  );
}

function NativeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAppTheme();
  const onHeightChange = React.useContext(BottomTabBarHeightCallbackContext);

  const tint = Platform.OS === "ios" ? iosSemanticColor("brand") : c.brand;
  const muted = Platform.OS === "ios" ? iosSemanticColor("labelSecondary") : c.labelSecondary;

  const BAR_HEIGHT = 49;
  const bottomPad = insets.bottom;
  const totalHeight = BAR_HEIGHT + bottomPad;

  return (
    <View
      style={{ height: totalHeight, overflow: "hidden" }}
      onLayout={() => onHeightChange?.(totalHeight)}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bgElevated }]} />
      {Platform.OS === "ios" ? (
        <BlurView
          tint="systemChromeMaterial"
          intensity={100}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[styles.separator, { backgroundColor: c.separator }]} />
      <View style={[styles.tabRow, { height: BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <Ionicons
                name={icons ? (isFocused ? icons.selected : icons.default) : "ellipse-outline"}
                size={24}
                color={isFocused ? tint : muted}
              />
              <Text
                numberOfLines={1}
                style={[styles.tabLabel, { color: isFocused ? tint : muted }]}
              >
                {typeof label === "string" ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: bottomPad }} />
    </View>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
});

function DeveloperTabs() {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <NativeTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Projects" options={{ title: t("developer.projects") ?? "Projects" }}>
          {() => (
            <DeveloperTabStack
              component={DeveloperProjectsScreen}
              title={t("developer.projects") ?? "Projects"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Floors" options={{ title: t("developer.floors") ?? "Floors" }}>
          {() => (
            <DeveloperTabStack
              component={DeveloperFloorsScreen}
              title={t("developer.floors") ?? "Floors"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Leads" options={{ title: t("developer.leads") ?? "Leads" }}>
          {() => (
            <DeveloperTabStack
              component={DeveloperLeadsScreen}
              title={t("developer.leads") ?? "Leads"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Subscriptions" options={{ title: t("developer.subscriptions") ?? "Subscriptions" }}>
          {() => (
            <DeveloperTabStack
              component={DeveloperSubscriptionsScreen}
              title={t("developer.subscriptions") ?? "Subscriptions"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile" options={{ title: t("developer.profile") ?? "Profile" }}>
          {() => (
            <DeveloperTabStack
              component={DeveloperProfileScreen}
              title={t("developer.profile") ?? "Profile"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
      <CatalogSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showCabinetEntry={false}
      />
    </View>
  );
}

export function DeveloperHomeScreen() {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  useEffect(() => {
    void registerForPushAndSyncToken();
  }, []);

  return (
    <Stack.Navigator screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
      <Stack.Screen
        name="DeveloperTabs"
        component={DeveloperTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeveloperProjectEditor"
        component={DeveloperProjectEditorScreen}
        options={{ title: t("developer.projectEditorTitle") }}
      />
      <Stack.Screen
        name="DeveloperFloorEditor"
        component={DeveloperFloorEditorScreen}
        options={{ title: t("developer.floors") }}
      />
      <Stack.Screen
        name="DeveloperProjectProgress"
        component={DeveloperProjectProgressScreen}
        options={{ title: t("developer.progressTitle") }}
      />
    </Stack.Navigator>
  );
}
