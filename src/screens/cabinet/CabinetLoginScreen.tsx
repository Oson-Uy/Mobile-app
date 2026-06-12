import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Surface, Text, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

  const isFormValid =
    normalizeUzPhoneDigits(phone).length >= 12 && code.trim().length >= 4;

  const onSubmit = async () => {
    if (!isFormValid) {
      Alert.alert(t("common.error"), t("cabinet.error"));
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetchPublic<CabinetLoginResponse>(
        "/customer-auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            phone: normalizeUzPhoneDigits(phone),
            accessCode: code.trim().toUpperCase(),
          }),
        },
      );
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
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: c.brand }]}>
              <MaterialCommunityIcons
                name="home-city"
                size={38}
                color={c.brandOn}
              />
            </View>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: c.label }]}
            >
              {t("cabinet.loginTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: c.labelSecondary }]}>
              {t("cabinet.loginSubtitle")}
            </Text>
          </View>

          <Surface
            style={[
              styles.card,
              { backgroundColor: c.bgElevated, borderColor: c.separator },
            ]}
            elevation={2}
          >
            <TextInput
              mode="outlined"
              label={t("cabinet.phone")}
              value={phone}
              onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              style={styles.field}
              outlineColor={c.separator}
              activeOutlineColor={c.brand}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              mode="outlined"
              label={t("cabinet.code")}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              style={styles.field}
              outlineColor={c.separator}
              activeOutlineColor={c.brand}
              left={<TextInput.Icon icon="key-variant" />}
              placeholder="XXXXXXXXXXXX"
            />

            <View style={[styles.infoBox, { backgroundColor: c.brand + "12" }]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={c.brand}
              />
              <Text style={[styles.infoText, { color: c.labelSecondary }]}>
                {t("cabinet.loginHint")}
              </Text>
            </View>

            <Button
              mode="contained"
              loading={busy}
              disabled={busy || !isFormValid}
              onPress={() => void onSubmit()}
              style={styles.submit}
              contentStyle={styles.submitInner}
              labelStyle={styles.submitLabel}
              buttonColor={c.brand}
              textColor={c.brandOn}
              icon="login"
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
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  iconBg: {
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: "900",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  field: {
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    borderRadius: radii.lg,
  },
  submitInner: {
    paddingVertical: 8,
    minHeight: 50,
  },
  submitLabel: {
    fontWeight: "800",
    fontSize: 16,
  },
});
