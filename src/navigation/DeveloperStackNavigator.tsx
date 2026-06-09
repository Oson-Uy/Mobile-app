import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useI18n } from "../i18n/I18nProvider";
import { DeveloperLoginScreen } from "../screens/developer/DeveloperLoginScreen";
import { DeveloperHomeScreen } from "../screens/developer/DeveloperHomeScreen";
import { HeaderCatalogButton } from "../ui/HeaderCatalogButton";
import { useAppTheme } from "../theme/AppThemeProvider";
import { nativeStackGlassScreenOptions } from "./glassOptions";
import type { DeveloperStackParamList } from "./types";

const DeveloperStack = createNativeStackNavigator<DeveloperStackParamList>();

export function DeveloperStackNavigator() {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  return (
    <DeveloperStack.Navigator
      initialRouteName="DeveloperGate"
      screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}
    >
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
