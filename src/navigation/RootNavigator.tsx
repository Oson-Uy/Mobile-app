import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useI18n } from "../i18n/I18nProvider";
import { CatalogListScreen } from "../screens/catalog/CatalogListScreen";
import { ProjectDetailsScreen } from "../screens/catalog/ProjectDetailsScreen";
import { LeadFormScreen } from "../screens/catalog/LeadFormScreen";
import { DeveloperLoginScreen } from "../screens/developer/DeveloperLoginScreen";
import { DeveloperHomeScreen } from "../screens/developer/DeveloperHomeScreen";
import { HeaderCatalogButton } from "../ui/HeaderCatalogButton";
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
  /** Полный кабинет застройщика (отдельный экран поверх каталога). */
  DeveloperWorkspace: undefined;
  DeveloperLogin: { finishMode?: "replaceHome" | "goBackMain" };
};

const CatalogStack = createNativeStackNavigator<CatalogStackParamList>();
const DeveloperStack = createNativeStackNavigator<DeveloperStackParamList>();
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
        // Без color здесь: иначе Fabric iOS может вызывать -[RCTView setColor:].
        headerTitleStyle: { fontWeight: "800" },
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
        options={{
          title: t("developer.login"),
          headerLeft: () => <HeaderCatalogButton />,
        }}
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

export function RootNavigator() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.primary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <RootStack.Screen
        name="Main"
        component={CatalogStackNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="DeveloperWorkspace"
        component={DeveloperStackNavigator}
        options={{ headerShown: false, presentation: "card" }}
      />
      <RootStack.Screen
        name="DeveloperLogin"
        component={DeveloperLoginScreen}
        options={{
          title: t("developer.login"),
          headerLeft: () => <HeaderCatalogButton />,
        }}
        initialParams={{ finishMode: "goBackMain" }}
      />
    </RootStack.Navigator>
  );
}
