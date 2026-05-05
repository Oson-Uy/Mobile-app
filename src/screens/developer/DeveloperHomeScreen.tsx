import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";

const Tab = createBottomTabNavigator();

export function DeveloperHomeScreen() {
  const { t } = useI18n();

  const icons = useMemo(
    () => ({
      Projects: "office-building-cog-outline",
      Leads: "clipboard-text-outline",
      Profile: "account-outline",
    }),
    [],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
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
        name="Leads"
        getComponent={() => require("./DeveloperLeadsScreen").DeveloperLeadsScreen}
        options={{ title: t("developer.leads") ?? "Leads" }}
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

