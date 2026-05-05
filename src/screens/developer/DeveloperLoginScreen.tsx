import React, { useState } from "react";
import { Alert, View } from "react-native";
import { Button, Card, TextInput } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { apiFetch } from "../../api/client";
import { setToken } from "../../auth/token";
import { useI18n } from "../../i18n/I18nProvider";
import type { DeveloperStackParamList } from "../../navigation/RootNavigator";
import { registerForPushAndSyncToken } from "../../push/register";

type Props = NativeStackScreenProps<DeveloperStackParamList, "DeveloperLogin">;

type LoginResponse = {
  token: string;
  developer: { id: number; name: string; email: string };
};

export function DeveloperLoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await setToken(res.token);
      // best-effort push registration; don't block login
      void registerForPushAndSyncToken();
      navigation.replace("DeveloperHome");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Card>
        <Card.Title title={t("developer.login")} />
        <Card.Content style={{ gap: 12 }}>
          <TextInput
            label={t("developer.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            label={t("developer.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button mode="contained" loading={busy} onPress={onSubmit}>
            {t("developer.signIn")}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

