import React, { useLayoutEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";
import { formatUzPhoneInput, normalizeUzPhoneDigits } from "../../lib/phone";
import { useI18n } from "../../i18n/I18nProvider";
import { spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "LeadForm">;

export function LeadFormScreen({ route, navigation }: Props) {
  const { projectId, floorId, projectName } = route.params;
  const { t } = useI18n();
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="titleMedium" style={styles.head}>
          {projectName ? `${t("leadModal.interestPrefix")}: ${projectName}` : t("leadModal.title")}
        </Text>
        <Text variant="bodyMedium" style={styles.sub}>
          {t("leadModal.defaultDescription")}
        </Text>
        {floorId != null ? (
          <Text variant="labelMedium" style={styles.floorNote}>
            {t("leadModal.floorNote", { id: floorId })}
          </Text>
        ) : null}
        <TextInput
          mode="outlined"
          label={t("leadModal.fullName")}
          placeholder={t("leadModal.namePlaceholder")}
          value={name}
          onChangeText={setName}
          style={styles.field}
        />
        <TextInput
          mode="outlined"
          label={t("leadModal.phone")}
          value={phone}
          onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
          keyboardType="phone-pad"
          style={styles.field}
        />
        <Button
          mode="contained"
          loading={busy}
          onPress={() => void submit()}
          style={styles.btn}
          contentStyle={styles.btnIn}
        >
          {busy ? t("leadModal.sending") : t("leadModal.submit")}
        </Button>
        <Text variant="bodySmall" style={styles.privacy}>
          {t("leadModal.privacy")}
        </Text>
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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  head: { fontWeight: "900", marginBottom: spacing.sm },
  sub: { opacity: 0.75, marginBottom: spacing.lg },
  floorNote: { marginBottom: spacing.md, fontWeight: "700" },
  field: { marginBottom: spacing.md },
  btn: { marginTop: spacing.sm, borderRadius: 14 },
  btnIn: { paddingVertical: 6 },
  privacy: { opacity: 0.55, marginTop: spacing.lg, textAlign: "center" },
  snackOk: { backgroundColor: "#15803D" },
  snackErr: { backgroundColor: "#B91C1C" },
});
