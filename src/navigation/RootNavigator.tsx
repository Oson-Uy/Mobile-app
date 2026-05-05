import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../i18n/I18nProvider";
import { CatalogListScreen } from "../screens/catalog/CatalogListScreen";
import { DeveloperLoginScreen } from "../screens/developer/DeveloperLoginScreen";
import { DeveloperHomeScreen } from "../screens/developer/DeveloperHomeScreen";

export type CatalogStackParamList = {
  CatalogList: undefined;
  ProjectDetails: { id: number };
  LeadForm: { projectId: number; floorId?: number; projectName?: string };
};

export type DeveloperStackParamList = {
  DeveloperGate: undefined;
  DeveloperLogin: undefined;
  DeveloperHome: undefined;
};

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const DeveloperStack = createNativeStackNavigator<DeveloperStackParamList>();
const Tabs = createBottomTabNavigator();

function CatalogStackNavigator() {
  const { t } = useI18n();
  return (
    <CatalogStack.Navigator>
      <CatalogStack.Screen
        name="CatalogList"
        component={CatalogListScreen}
        options={{ title: t("catalog.title") }}
      />
      <CatalogStack.Screen
        name="ProjectDetails"
        getComponent={() =>
          require("../screens/catalog/ProjectDetailsScreen").ProjectDetailsScreen
        }
        options={{ title: "" }}
      />
      <CatalogStack.Screen
        name="LeadForm"
        getComponent={() =>
          require("../screens/catalog/LeadFormScreen").LeadFormScreen
        }
        options={{ title: "" }}
      />
    </CatalogStack.Navigator>
  );
}

function DeveloperStackNavigator() {
  const { t } = useI18n();
  return (
    <DeveloperStack.Navigator initialRouteName="DeveloperGate">
      <DeveloperStack.Screen
        name="DeveloperGate"
        getComponent={() =>
          require("../screens/developer/DeveloperGateScreen").DeveloperGateScreen
        }
        options={{ headerShown: false }}
      />
      <DeveloperStack.Screen
        name="DeveloperLogin"
        component={DeveloperLoginScreen}
        options={{ title: t("developer.login") }}
      />
      <DeveloperStack.Screen
        name="DeveloperHome"
        component={DeveloperHomeScreen}
        options={{ headerShown: false }}
      />
    </DeveloperStack.Navigator>
  );
}

export function RootNavigator() {
  const { t } = useI18n();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "CatalogTab") {
            return (
              <MaterialCommunityIcons
                name="home-city-outline"
                size={size}
                color={color}
              />
            );
          }
          return (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          );
        },
      })}
    >
      <Tabs.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{ title: t("tabs.catalog") }}
      />
      <Tabs.Screen
        name="DeveloperTab"
        component={DeveloperStackNavigator}
        options={{ title: t("tabs.developer") }}
      />
    </Tabs.Navigator>
  );
}

