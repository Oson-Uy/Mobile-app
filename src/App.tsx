import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import { RootNavigator } from "./navigation/RootNavigator";
import { navigationRef, navigateToDeveloperWorkspace } from "./navigation/navigationRef";
import { consumePendingDeveloperWorkspace } from "./onboarding/pendingDeveloperLogin";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { AppPreferencesProvider, useAppPreferences } from "./preferences/AppPreferencesProvider";
import { AppThemeProvider, useAppTheme } from "./theme/AppThemeProvider";
import { brandLogoBackdrop } from "./theme/tokens";
import { OnboardingScreen } from "./screens/onboarding/OnboardingScreen";
import { FullScreenLoader } from "./ui/FullScreenLoader";

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Если что-то зависло до hideAsync, не держим нативный splash бесконечно. */
const SPLASH_FORCE_HIDE_MS = 10_000;
/**
 * На части релизных Android SecureStore / первый кадр может не отдать управление —
 * тогда hydrated никогда не true и онбординг не показывается. Форсируем UI.
 */
const BOOT_FORCE_MS = 4000;

function AppShell() {
  const theme = useAppTheme();
  const i18n = useI18n();
  const prefs = useAppPreferences();
  const [bootForced, setBootForced] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBootForced(true), BOOT_FORCE_MS);
    return () => clearTimeout(id);
  }, []);

  const allHydrated = theme.hydrated && i18n.hydrated && prefs.hydrated;
  const booting = !allHydrated && !bootForced;

  useEffect(() => {
    if (!booting) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [booting]);

  useEffect(() => {
    const id = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, SPLASH_FORCE_HIDE_MS);
    return () => clearTimeout(id);
  }, []);

  if (booting) {
    return (
      <PaperProvider theme={theme.paperTheme}>
        <View style={[styles.boot, { backgroundColor: brandLogoBackdrop }]}>
          <FullScreenLoader />
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
      <NavigationContainer
        ref={navigationRef}
        theme={theme.navTheme}
        onReady={() => {
          if (!consumePendingDeveloperWorkspace()) return;
          /* Отложить push до конца первого кадра навигации — меньше гонок с нативной шапкой на iOS. */
          requestAnimationFrame(() => {
            setTimeout(() => navigateToDeveloperWorkspace(), 50);
          });
        }}
      >
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
  boot: { flex: 1 },
});
