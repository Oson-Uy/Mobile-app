import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, Surface, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { apiFetchPublic } from "../../api/client";
import { setCustomerToken } from "../../auth/customerToken";
import { useI18n } from "../../i18n/I18nProvider";
import { formatUzPhoneInput, normalizeUzPhoneDigits } from "../../lib/phone";
import { iosScrollInset } from "../../navigation/glassOptions";
import type { CabinetStackParamList } from "../../navigation/types";
import type { CabinetLoginResponse } from "../../types/cabinet";
import { Screen } from "../../ui/Screen";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CabinetStackParamList, "CabinetLogin">;

export function CabinetLoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      const res = await apiFetchPublic<CabinetLoginResponse>("/customer-auth/login", {
        method: "POST",
        body: JSON.stringify({
          phone: normalizeUzPhoneDigits(phone),
          accessCode: code.trim().toUpperCase(),
        }),
      });
      await setCustomerToken(res.token);
      navigation.replace("CabinetDashboard");
    } catch {
      Alert.alert(t("common.error"), t("cabinet.error"));
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
              {t("cabinet.loginTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: c.labelSecondary }]}>
              {t("cabinet.loginSubtitle")}
            </Text>

            <TextInput
              mode="outlined"
              label={t("cabinet.phone")}
              value={phone}
              onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              style={styles.field}
            />
            <TextInput
              mode="outlined"
              label={t("cabinet.code")}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              style={styles.field}
            />

            <Button
              mode="contained"
              loading={busy}
              disabled={busy}
              onPress={() => void onSubmit()}
              style={styles.submit}
              contentStyle={styles.submitInner}
            >
              {t("cabinet.submit")}
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
