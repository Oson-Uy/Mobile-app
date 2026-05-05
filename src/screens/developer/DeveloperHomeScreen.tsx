import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import { palette } from "../../theme/tokens";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DeveloperTabs() {
  const { t } = useI18n();

  const icons = useMemo(
    () => ({
      Projects: "office-building-cog-outline",
      Floors: "layers-outline",
      Leads: "clipboard-text-outline",
      Subscriptions: "credit-card-outline",
      Profile: "account-outline",
    }),
    [],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "900" },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          borderTopColor: palette.outline,
          backgroundColor: palette.surface,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={(icons as any)[route.name] ?? "account"}
            color={color}
            size={size}
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
  );
}

export function DeveloperHomeScreen() {
  const { t } = useI18n();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.primary,
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
    </Stack.Navigator>
  );
}

