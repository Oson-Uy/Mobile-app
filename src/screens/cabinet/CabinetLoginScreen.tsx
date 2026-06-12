import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
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
  const [apartment, setApartment] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const isFormValid = phone.trim().length >= 12 && code.trim().length >= 1;

  const onSubmit = async () => {
    if (!isFormValid) {
      Alert.alert(t("common.error"), t("cabinet.error"));
      return;
    }

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
          <View style={styles.header}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: c.brand + "15" },
              ]}
            >
              <MaterialCommunityIcons name="home-account" size={40} color={c.brand} />
            </View>
            <Text variant="headlineMedium" style={[styles.title, { color: c.label }]}>
              {t("cabinet.loginTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: c.labelSecondary }]}>
              {t("cabinet.loginSubtitle")}
            </Text>
          </View>

          <Surface
            style={[
              styles.card,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.separator,
              },
            ]}
            elevation={3}
          >
            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="phone" size={16} color={c.brand} />
              <Text style={[styles.sectionTitle, { color: c.labelSecondary }]}>
                {t("cabinet.contactInfo")}
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label={t("cabinet.phone")}
              value={phone}
              onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              style={styles.field}
              left={<TextInput.Icon icon="phone" />}
              dense
            />

            <TextInput
              mode="outlined"
              label={t("cabinet.name")}
              value={name}
              onChangeText={setName}
              style={styles.field}
              left={<TextInput.Icon icon="account" />}
              placeholder="Ваше имя"
              dense
            />

            <View style={styles.sectionDivider} />

            <View style={styles.sectionLabel}>
              <MaterialCommunityIcons name="lock" size={16} color={c.brand} />
              <Text style={[styles.sectionTitle, { color: c.labelSecondary }]}>
                {t("cabinet.accessInfo")}
              </Text>
            </View>

            <TextInput
              mode="outlined"
              label={t("cabinet.code")}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              style={styles.field}
              left={<TextInput.Icon icon="key" />}
              placeholder="XXXX"
              dense
            />

            <TextInput
              mode="outlined"
              label="Номер квартиры"
              value={apartment}
              onChangeText={setApartment}
              style={styles.field}
              left={<TextInput.Icon icon="door" />}
              placeholder="Напр. 101"
              dense
            />

            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={18} color={c.brand} />
              <Text style={[styles.infoText, { color: c.labelSecondary }]}>
                Введите номер квартиры и код доступа, указанные в договоре
              </Text>
            </View>

            <Button
              mode="contained"
              loading={busy}
              disabled={busy || !isFormValid}
              onPress={() => void onSubmit()}
              style={styles.submit}
              contentStyle={styles.submitInner}
              icon="login"
            >
              {t("cabinet.submit")}
            </Button>

            <Button
              mode="text"
              style={styles.helpBtn}
              labelStyle={styles.helpBtnLabel}
            >
              Нужна помощь?
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
    marginBottom: spacing.xxl,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  field: {
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: spacing.lg,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.lg,
  },
  submitInner: {
    paddingVertical: 10,
    minHeight: 50,
  },
  helpBtn: {
    marginTop: spacing.sm,
  },
  helpBtnLabel: {
    fontSize: 14,
  },
});
