import React, { useLayoutEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator, Snackbar, Text, TextInput } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";
import { formatUzPhoneInput, normalizeUzPhoneDigits } from "../../lib/phone";
import { useI18n } from "../../i18n/I18nProvider";
import { CatalogSurfaceCard } from "../../ui/catalog/CatalogSurfaceCard";
import { catalogBtnHeight } from "../../ui/catalog/catalogPlatform";
import { Screen } from "../../ui/Screen";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "LeadForm">;

export function LeadFormScreen({ route, navigation }: Props) {
  const { projectId, floorId, projectName } = route.params;
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; ok: boolean } | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("leadModal.title"),
      headerBackTitle: t("catalog.title"),
    });
  }, [navigation, t]);

  const submit = async () => {
    const clean = normalizeUzPhoneDigits(phone);
    if (clean.length !== 12) {
      setSnack({
        msg:
          clean.length < 12
            ? t("leadModal.incompletePhone")
            : t("leadModal.invalidPhone"),
        ok: false,
      });
      return;
    }
    if (!name.trim()) {
      setSnack({ msg: t("leadModal.nameRequired"), ok: false });
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: clean,
          projectId,
          floorId,
        }),
      });
      setSnack({ msg: t("leadModal.success"), ok: true });
      setTimeout(() => navigation.goBack(), 1600);
    } catch {
      setSnack({ msg: t("leadModal.submitError"), ok: false });
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
        >
          <CatalogSurfaceCard style={styles.formCard}>
            <Text variant="titleMedium" style={[styles.head, { color: p.text }]}>
              {projectName
                ? `${t("leadModal.interestPrefix")}: ${projectName}`
                : t("leadModal.title")}
            </Text>
            <Text variant="bodyMedium" style={[styles.sub, { color: p.textMuted }]}>
              {t("leadModal.defaultDescription")}
            </Text>
            {floorId != null ? (
              <View style={[styles.floorPill, { backgroundColor: p.surfaceMuted }]}>
                <Text variant="labelLarge" style={{ color: p.text, fontWeight: "700" }}>
                  {t("leadModal.floorNote", { id: floorId })}
                </Text>
              </View>
            ) : null}
            <TextInput
              mode="outlined"
              label={t("leadModal.fullName")}
              placeholder={t("leadModal.namePlaceholder")}
              value={name}
              onChangeText={setName}
              style={styles.field}
              outlineStyle={styles.fieldOutline}
            />
            <TextInput
              mode="outlined"
              label={t("leadModal.phone")}
              value={phone}
              onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
              keyboardType="phone-pad"
              style={styles.field}
              outlineStyle={styles.fieldOutline}
            />
            <Pressable
              onPress={() => void submit()}
              disabled={busy}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: p.secondary,
                  opacity: busy || pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnTxt}>{t("leadModal.submit")}</Text>
              )}
            </Pressable>
            <Text variant="bodySmall" style={[styles.privacy, { color: p.textMuted }]}>
              {t("leadModal.privacy")}
            </Text>
          </CatalogSurfaceCard>
        </ScrollView>
        <Snackbar
          visible={snack != null}
          onDismiss={() => setSnack(null)}
          duration={3000}
          style={snack?.ok ? styles.snackOk : styles.snackErr}
        >
          {snack?.msg ?? ""}
        </Snackbar>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  formCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  head: { fontWeight: "900", marginBottom: spacing.xs },
  sub: { marginBottom: spacing.md, lineHeight: 20 },
  floorPill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 6, android: 8, default: 6 }),
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  field: { marginBottom: spacing.sm, backgroundColor: "transparent" },
  fieldOutline: { borderRadius: radii.lg },
  btn: {
    height: catalogBtnHeight,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  btnTxt: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: Platform.select({ ios: 16, android: 15, default: 16 }),
  },
  privacy: { marginTop: spacing.lg, textAlign: "center", lineHeight: 18 },
  snackOk: { backgroundColor: "#15803D" },
  snackErr: { backgroundColor: "#B91C1C" },
});
