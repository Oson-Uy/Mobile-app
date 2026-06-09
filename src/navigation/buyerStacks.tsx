import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useI18n } from "../i18n/I18nProvider";
import { CatalogListScreen } from "../screens/catalog/CatalogListScreen";
import { ProjectDetailsScreen } from "../screens/catalog/ProjectDetailsScreen";
import { LeadFormScreen } from "../screens/catalog/LeadFormScreen";
import { CabinetGateScreen } from "../screens/cabinet/CabinetGateScreen";
import { CabinetLoginScreen } from "../screens/cabinet/CabinetLoginScreen";
import { CabinetDashboardScreen } from "../screens/cabinet/CabinetDashboardScreen";
import { useAppTheme } from "../theme/AppThemeProvider";
import { nativeStackGlassScreenOptions } from "./glassOptions";
import type { CatalogStackParamList, CabinetStackParamList } from "./types";

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const CabinetStack = createNativeStackNavigator<CabinetStackParamList>();

export function CatalogStackNavigator() {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  return (
    <CatalogStack.Navigator screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
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

export function CabinetStackNavigator() {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  return (
    <CabinetStack.Navigator
      initialRouteName="CabinetGate"
      screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}
    >
      <CabinetStack.Screen
        name="CabinetGate"
        component={CabinetGateScreen}
        options={{ headerShown: false }}
      />
      <CabinetStack.Screen
        name="CabinetLogin"
        component={CabinetLoginScreen}
        options={{ title: t("cabinet.loginTitle") }}
      />
      <CabinetStack.Screen
        name="CabinetDashboard"
        component={CabinetDashboardScreen}
        options={{ title: t("cabinet.dashboardTitle") }}
      />
    </CabinetStack.Navigator>
  );
}
