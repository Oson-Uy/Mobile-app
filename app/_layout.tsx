import "react-native-gesture-handler";

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";

import { I18nProvider, useI18n } from "../src/i18n/I18nProvider";
import { AppPreferencesProvider, useAppPreferences } from "../src/preferences/AppPreferencesProvider";
import { AppThemeProvider, useAppTheme } from "../src/theme/AppThemeProvider";
import { OnboardingScreen } from "../src/screens/onboarding/OnboardingScreen";
import { FullScreenLoader } from "../src/ui/FullScreenLoader";
import { PendingDeveloperWorkspace } from "../src/navigation/PendingDeveloperWorkspace";
import { nativeStackGlassScreenOptions } from "../src/navigation/glassOptions";
import { HeaderCatalogButton } from "../src/ui/HeaderCatalogButton";

void SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_FORCE_HIDE_MS = 10_000;
const BOOT_FORCE_MS = 4000;

function BootGate({ children }: { children: React.ReactNode }) {
  const { colors: c, resolvedMode, hydrated: themeHydrated } = useAppTheme();
  const i18n = useI18n();
  const prefs = useAppPreferences();
  const [bootForced, setBootForced] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setBootForced(true), BOOT_FORCE_MS);
    return () => clearTimeout(id);
  }, []);

  const allHydrated = themeHydrated && i18n.hydrated && prefs.hydrated;
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

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg);
  }, [c.bg]);

  if (booting) {
    return (
      <View style={[styles.boot, { backgroundColor: c.bg }]}>
        <FullScreenLoader />
      </View>
    );
  }

  if (!prefs.onboardingDone) {
    return <OnboardingScreen />;
  }

  return (
    <>
      {children}
      <PendingDeveloperWorkspace />
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
    </>
  );
}

function RootStack() {
  const { t } = useI18n();
  const { colors: c, resolvedMode, paperTheme } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <BootGate>
        <Stack screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
          <Stack.Screen name="developer" options={{ headerShown: false, presentation: "card" }} />
          <Stack.Screen
            name="developer-login"
            options={{
              title: t("developer.login"),
              headerLeft: () => <HeaderCatalogButton />,
            }}
            initialParams={{ finishMode: "goBackMain" }}
          />
        </Stack>
      </BootGate>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <I18nProvider>
            <AppPreferencesProvider>
              <RootStack />
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
