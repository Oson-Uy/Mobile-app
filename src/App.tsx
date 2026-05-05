import React, { useMemo } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./navigation/RootNavigator";
import { I18nProvider } from "./i18n/I18nProvider";
import { palette } from "./theme/tokens";

export default function App() {
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: palette.primary,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.outline,
        notification: palette.secondary,
      },
    }),
    [],
  );

  const paperTheme = useMemo(
    () => ({
      ...MD3LightTheme,
      roundness: 14,
      colors: {
        ...MD3LightTheme.colors,
        primary: palette.primary,
        onPrimary: "#FFFFFF",
        primaryContainer: "#E0E7FF",
        onPrimaryContainer: "#172554",
        secondary: palette.secondary,
        onSecondary: "#FFFFFF",
        secondaryContainer: "#FFEDD5",
        background: palette.background,
        surface: palette.surface,
        surfaceVariant: palette.surfaceMuted,
        onSurface: palette.text,
        onSurfaceVariant: palette.textMuted,
        outline: palette.outline,
        outlineVariant: "#CBD5E1",
        elevation: {
          ...MD3LightTheme.colors.elevation,
          level1: palette.surface,
        },
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

