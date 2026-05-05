import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";

import { apiFetch } from "../../api/client";
import { clearToken } from "../../auth/token";
import { registerForPushAndSyncToken } from "../../push/register";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { spacing } from "../../theme/tokens";
import { palette } from "../../theme/tokens";

type ApiDeveloper = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  legalAddress?: string | null;
  officeAddress?: string | null;
  description?: string | null;
};

export function DeveloperProfileScreen() {
  const { t } = useI18n();
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const load = async () => {
    const data = await apiFetch<ApiDeveloper>("/developers");
    setDev(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!dev) return;
    setBusy(true);
    try {
      await apiFetch(`/developers/${dev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          phone: dev.phone || undefined,
          website: dev.website || undefined,
          legalAddress: dev.legalAddress || undefined,
          officeAddress: dev.officeAddress || undefined,
          description: dev.description || undefined,
        }),
      });
      setSnack(t("developer.saved"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await clearToken();
    setSnack(t("developer.signedOut"));
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard>
          <Text variant="titleMedium" style={styles.title}>
            {t("developer.profile")}
          </Text>
          <Text variant="bodySmall" style={styles.email}>
            {dev?.email ?? ""}
          </Text>
          <Text variant="titleSmall" style={styles.name}>
            {dev?.name ?? ""}
          </Text>
          <TextInput
            mode="outlined"
            label={t("developer.phone")}
            value={dev?.phone ?? ""}
            onChangeText={(v) => setDev((d) => (d ? { ...d, phone: v } : d))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.website")}
            value={dev?.website ?? ""}
            onChangeText={(v) => setDev((d) => (d ? { ...d, website: v } : d))}
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.legalAddress")}
            value={dev?.legalAddress ?? ""}
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, legalAddress: v } : d))
            }
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.officeAddress")}
            value={dev?.officeAddress ?? ""}
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, officeAddress: v } : d))
            }
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label={t("developer.description")}
            value={dev?.description ?? ""}
            multiline
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, description: v } : d))
            }
            style={styles.field}
          />
          <Button
            mode="contained"
            loading={busy}
            onPress={() => void save()}
            style={styles.btn}
          >
            {t("developer.save")}
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => void registerForPushAndSyncToken()}
            style={styles.btn}
          >
            {t("developer.syncPush")}
          </Button>
          <Button mode="outlined" onPress={() => void signOut()} style={styles.btn}>
            {t("developer.signOut")}
          </Button>
        </SectionCard>
      </ScrollView>
      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  title: { fontWeight: "900", color: palette.primary, marginBottom: 4 },
  email: { opacity: 0.65, marginBottom: spacing.sm },
  name: { fontWeight: "800", marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  btn: { marginTop: spacing.sm, borderRadius: 12 },
});
