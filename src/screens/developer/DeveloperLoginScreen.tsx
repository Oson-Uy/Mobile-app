import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, Surface, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { router } from "expo-router";

import { apiFetch } from "../../api/client";
import { setToken } from "../../auth/token";
import { useI18n } from "../../i18n/I18nProvider";
import { iosScrollInset } from "../../navigation/glassOptions";
import type { DeveloperStackParamList, RootStackParamList } from "../../navigation/types";
import { registerForPushAndSyncToken } from "../../push/register";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import { Screen } from "../../ui/Screen";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props =
  | NativeStackScreenProps<DeveloperStackParamList, "DeveloperLogin">
  | NativeStackScreenProps<RootStackParamList, "DeveloperLogin">;

type LoginResponse = {
  token: string;
  developer: { id: number; name: string; email: string };
};

export function DeveloperLoginScreen({ navigation, route }: Props) {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const { setRole } = useAppPreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);

  const finishMode = route.params?.finishMode ?? "replaceHome";

  const onSubmit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await setToken(res.token);
      await registerForPushAndSyncToken();
      await setRole("developer");
      if (finishMode === "goBackMain") {
        if (navigation.canGoBack()) navigation.goBack();
        else router.replace("/(buyer)/(catalog)");
      } else {
        (navigation as { replace: (n: string) => void }).replace("DeveloperHome");
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          {...iosScrollInset}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Surface
            style={[
              styles.card,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.separator,
              },
            ]}
            elevation={2}
          >
            <Text variant="headlineSmall" style={[styles.title, { color: c.label }]}>
              {t("developer.login")}
            </Text>
            <Text style={[styles.subtitle, { color: c.labelSecondary }]}>
              {t("developer.loginSubtitle")}
            </Text>
            <Text style={[styles.registerHint, { color: c.labelSecondary }]}>
              {t("developer.registerOnWebHint")}
            </Text>

            <TextInput
              mode="outlined"
              label={t("developer.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              style={styles.field}
            />
            <TextInput
              mode="outlined"
              label={t("developer.password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              autoComplete="password"
              textContentType="password"
              style={styles.field}
              right={
                <TextInput.Icon
                  icon={secure ? "eye-off-outline" : "eye-outline"}
                  onPress={() => setSecure((s) => !s)}
                  forceTextInputFocus={false}
                />
              }
            />

            <Button
              mode="contained"
              loading={busy}
              disabled={busy}
              onPress={() => void onSubmit()}
              style={styles.submit}
              contentStyle={styles.submitInner}
              labelStyle={styles.submitLabel}
              buttonColor={c.brand}
              textColor={c.brandOn}
              icon="login"
            >
              {t("developer.signIn")}
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
    paddingBottom: spacing.xxl * 2,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontWeight: "800" },
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.sm, lineHeight: 20 },
  registerHint: { marginBottom: spacing.lg, lineHeight: 20, fontSize: 13 },
  field: { marginBottom: spacing.md },
  submit: { marginTop: spacing.md, borderRadius: radii.lg },
  submitInner: { paddingVertical: 8, minHeight: 48 },
  submitLabel: { fontWeight: "800", fontSize: 16 },
});
