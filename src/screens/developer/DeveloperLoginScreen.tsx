import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, Surface, Text, TextInput } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { apiFetch } from "../../api/client";
import { setToken } from "../../auth/token";
import { useI18n } from "../../i18n/I18nProvider";
import type { DeveloperStackParamList } from "../../navigation/RootNavigator";
import { registerForPushAndSyncToken } from "../../push/register";
import { Screen } from "../../ui/Screen";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<DeveloperStackParamList, "DeveloperLogin">;

type LoginResponse = {
  token: string;
  developer: { id: number; name: string; email: string };
};

export function DeveloperLoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await setToken(res.token);
      void registerForPushAndSyncToken();
      navigation.replace("DeveloperHome");
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
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Surface
            style={[
              styles.card,
              {
                backgroundColor: p.surface,
                borderColor: p.outline,
              },
            ]}
            elevation={2}
          >
            <Text variant="headlineSmall" style={[styles.title, { color: p.text }]}>
              {t("developer.login")}
            </Text>
            <Text style={[styles.subtitle, { color: p.textMuted }]}>
              {t("developer.loginSubtitle")}
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
  subtitle: { marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 20 },
  field: { marginBottom: spacing.md },
  submit: { marginTop: spacing.md, borderRadius: radii.lg },
  submitInner: { paddingVertical: 8, minHeight: 48 },
});
