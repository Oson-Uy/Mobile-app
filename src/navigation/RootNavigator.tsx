import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../i18n/I18nProvider";
import { useAppPreferences } from "../preferences/AppPreferencesProvider";
import { CatalogListScreen } from "../screens/catalog/CatalogListScreen";
import { ProjectDetailsScreen } from "../screens/catalog/ProjectDetailsScreen";
import { LeadFormScreen } from "../screens/catalog/LeadFormScreen";
import { DeveloperLoginScreen } from "../screens/developer/DeveloperLoginScreen";
import { DeveloperHomeScreen } from "../screens/developer/DeveloperHomeScreen";
import { useAppTheme } from "../theme/AppThemeProvider";

export type CatalogStackParamList = {
  CatalogList: undefined;
  ProjectDetails: { id: number };
  LeadForm: { projectId: number; floorId?: number; projectName?: string };
};

export type DeveloperStackParamList = {
  DeveloperGate: undefined;
  DeveloperLogin: { finishMode?: "replaceHome" | "goBackMain" };
  DeveloperHome: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  DeveloperLogin: { finishMode?: "replaceHome" | "goBackMain" };
};

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const DeveloperStack = createNativeStackNavigator<DeveloperStackParamList>();
const Tabs = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function CatalogStackNavigator() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  return (
    <CatalogStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", color: p.text },
      }}
    >
      <CatalogStack.Screen
        name="CatalogList"
        component={CatalogListScreen}
        options={{ title: t("catalog.title") }}
      />
      <CatalogStack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <CatalogStack.Screen name="LeadForm" component={LeadFormScreen} />
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
        initialParams={{ finishMode: "replaceHome" }}
      />
      <DeveloperStack.Screen
        name="DeveloperHome"
        component={DeveloperHomeScreen}
        options={{ headerShown: false }}
      />
    </DeveloperStack.Navigator>
  );
}

function MainNavigator() {
  const { t } = useI18n();
  const { role } = useAppPreferences();
  const { palette: p, mode } = useAppTheme();
  const isIos = Platform.OS === "ios";
  const iosBlue = mode === "dark" ? "#0A84FF" : "#007AFF";
  const iosGray = "#8E8E93";

  if (role !== "developer") {
    return <CatalogStackNavigator />;
  }

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isIos ? iosBlue : p.primary,
        tabBarInactiveTintColor: isIos ? iosGray : p.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () =>
          isIos ? (
            <BlurView
              intensity={mode === "dark" ? 88 : 76}
              tint={mode === "dark" ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: p.surface }} />
          ),
        tabBarStyle: isIos
          ? {
              backgroundColor: "transparent",
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor:
                mode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(60,60,67,0.29)",
              elevation: 0,
              paddingTop: 6,
              paddingBottom: 2,
            }
          : {
              borderTopColor: p.outline,
              paddingTop: 6,
              paddingBottom: 6,
              height: 58,
              backgroundColor: p.surface,
            },
        tabBarLabelStyle: isIos
          ? { fontSize: 10, fontWeight: "500", letterSpacing: -0.1 }
          : { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, size, focused }) => {
          const s = isIos ? size + 1 : size;
          if (isIos) {
            if (route.name === "CatalogTab") {
              return (
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={s}
                  color={color}
                />
              );
            }
            return (
              <Ionicons
                name={focused ? "briefcase" : "briefcase-outline"}
                size={s}
                color={color}
              />
            );
          }
          if (route.name === "CatalogTab") {
            return (
              <MaterialCommunityIcons
                name="home-city-outline"
                size={s}
                color={color}
              />
            );
          }
          return <MaterialCommunityIcons name="account" size={s} color={color} />;
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

export function RootNavigator() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800", color: p.text },
      }}
    >
      <RootStack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
      <RootStack.Screen
        name="DeveloperLogin"
        component={DeveloperLoginScreen}
        options={{ title: t("developer.login") }}
        initialParams={{ finishMode: "goBackMain" }}
      />
    </RootStack.Navigator>
  );
}
