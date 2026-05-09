import React, { useMemo, useState, type ComponentProps } from "react";
import { Text, View } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../i18n/I18nProvider";
import { CatalogSettingsModal } from "../catalog/CatalogSettingsModal";
import { HeaderCatalogButton } from "../../ui/HeaderCatalogButton";
import { useAppTheme } from "../../theme/AppThemeProvider";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DeveloperTabs() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const icons = useMemo(
    () => ({
      Projects: "office-building-outline",
      Floors: "layers-outline",
      Leads: "clipboard-text-outline",
      Subscriptions: "credit-card-outline",
      Profile: "account-outline",
    }),
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "900" },
        headerLeft: () => <HeaderCatalogButton />,
        headerRight: () => (
          <HeaderButton
            accessibilityLabel={t("catalog.settings")}
            onPress={() => setSettingsOpen(true)}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={p.primary} />
          </HeaderButton>
        ),
        tabBarActiveTintColor: p.primary,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: {
          borderTopColor: p.outline,
          backgroundColor: p.surface,
          paddingHorizontal: 10,
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: -2,
        },
        tabBarIconStyle: { marginTop: 2 },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={
              (icons as Record<string, ComponentProps<typeof MaterialCommunityIcons>["name"]>)[
                route.name
              ] ?? "account"
            }
            color={color}
            size={Math.min(22, size - 2)}
          />
        ),
      })}
      >
      <Tab.Screen
        name="Projects"
        getComponent={() =>
          require("./DeveloperProjectsScreen").DeveloperProjectsScreen
        }
        options={{ title: t("developer.projects") ?? "Projects" }}
      />
      <Tab.Screen
        name="Floors"
        getComponent={() =>
          require("./DeveloperFloorsScreen").DeveloperFloorsScreen
        }
        options={{ title: t("developer.floors") ?? "Floors" }}
      />
      <Tab.Screen
        name="Leads"
        getComponent={() => require("./DeveloperLeadsScreen").DeveloperLeadsScreen}
        options={{ title: t("developer.leads") ?? "Leads" }}
      />
      <Tab.Screen
        name="Subscriptions"
        getComponent={() =>
          require("./DeveloperSubscriptionsScreen").DeveloperSubscriptionsScreen
        }
        options={{ title: t("developer.subscriptions") ?? "Subscriptions" }}
      />
      <Tab.Screen
        name="Profile"
        getComponent={() =>
          require("./DeveloperProfileScreen").DeveloperProfileScreen
        }
        options={{ title: t("developer.profile") ?? "Profile" }}
      />
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
  const { palette: p } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "900" },
      }}
    >
      <Stack.Screen
        name="DeveloperTabs"
        component={DeveloperTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeveloperProjectEditor"
        getComponent={() =>
          require("./DeveloperProjectEditorScreen").DeveloperProjectEditorScreen
        }
        options={{ title: t("developer.projectEditorTitle") }}
      />
      <Stack.Screen
        name="DeveloperFloorEditor"
        getComponent={() =>
          require("./DeveloperFloorEditorScreen").DeveloperFloorEditorScreen
        }
        options={{ title: t("developer.floors") }}
      />
      <Stack.Screen
        name="DeveloperProjectProgress"
        getComponent={() =>
          require("./DeveloperProjectProgressScreen").DeveloperProjectProgressScreen
        }
        options={{ title: t("developer.progressTitle") }}
      />
    </Stack.Navigator>
  );
}
