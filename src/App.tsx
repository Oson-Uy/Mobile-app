import React, { useMemo } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./navigation/RootNavigator";
import { I18nProvider } from "./i18n/I18nProvider";

export default function App() {
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: "#1E3A8A",
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: "#0F172A",
        border: "#E2E8F0",
        notification: "#F97316",
      },
    }),
    [],
  );

  const paperTheme = useMemo(
    () => ({
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: "#1E3A8A",
        secondary: "#F97316",
      },
    }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <PaperProvider theme={paperTheme}>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="dark" />
          </PaperProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

