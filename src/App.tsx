import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import { RootNavigator } from "./navigation/RootNavigator";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { AppPreferencesProvider, useAppPreferences } from "./preferences/AppPreferencesProvider";
import { AppThemeProvider, useAppTheme } from "./theme/AppThemeProvider";
import { OnboardingScreen } from "./screens/onboarding/OnboardingScreen";

function AppShell() {
  const theme = useAppTheme();
  const i18n = useI18n();
  const prefs = useAppPreferences();

  const booting = !theme.hydrated || !i18n.hydrated || !prefs.hydrated;

  if (booting) {
    return (
      <PaperProvider theme={theme.paperTheme}>
        <View style={[styles.boot, { backgroundColor: theme.palette.background }]}>
          <ActivityIndicator color={theme.palette.primary} size="large" />
        </View>
      </PaperProvider>
    );
  }

  if (!prefs.onboardingDone) {
    return (
      <PaperProvider theme={theme.paperTheme}>
        <OnboardingScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme.paperTheme}>
      <NavigationContainer theme={theme.navTheme}>
        <RootNavigator />
        <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <I18nProvider>
            <AppPreferencesProvider>
              <AppShell />
            </AppPreferencesProvider>
          </I18nProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
