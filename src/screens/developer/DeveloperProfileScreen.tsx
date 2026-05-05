import React, { useEffect, useState } from "react";
import { Image, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, Snackbar, Text, TextInput } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";

import { apiFetch } from "../../api/client";
import { clearToken } from "../../auth/token";
import { registerForPushAndSyncToken } from "../../push/register";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { uploadImageAsset } from "../../dev/uploadImage";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type ApiDeveloper = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  legalAddress?: string | null;
  officeAddress?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  telegramLinked?: boolean | null;
};

export function DeveloperProfileScreen() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [tgBusy, setTgBusy] = useState(false);
  const [tgLink, setTgLink] = useState<string | null>(null);

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
          logoUrl: dev.logoUrl || undefined,
        }),
      });
      setSnack(t("developer.saved"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack(t("developer.mediaPermission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      setLogoUploading(true);
      const url = await uploadImageAsset(res.assets[0]);
      setDev((d) => (d ? { ...d, logoUrl: url } : d));
      setSnack(t("developer.logoUploaded"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.uploadError"));
    } finally {
      setLogoUploading(false);
    }
  };

  const requestTelegramLink = async () => {
    try {
      setTgBusy(true);
      const res = await apiFetch<{ deepLink: string; expiresAt: string }>(
        "/developers/me/telegram-link",
      );
      setTgLink(res.deepLink);
      setSnack(t("developer.telegramLinkReady"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setTgBusy(false);
    }
  };

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setSnack(t("developer.copied"));
  };

  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setSnack(t("developer.openLinkError"));
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
          <Text variant="titleMedium" style={[styles.title, { color: p.primary }]}>
            {t("developer.profile")}
          </Text>
          <Text variant="bodySmall" style={[styles.email, { color: p.textMuted }]}>
            {dev?.email ?? ""}
          </Text>
          <Text variant="titleSmall" style={[styles.name, { color: p.text }]}>
            {dev?.name ?? ""}
          </Text>

          <View style={styles.logoRow}>
            <View
              style={[
                styles.logoBox,
                {
                  backgroundColor: p.surfaceMuted,
                  borderColor: p.outline,
                },
              ]}
            >
              {dev?.logoUrl ? (
                <Image source={{ uri: dev.logoUrl }} style={styles.logoImg} />
              ) : (
                <Text style={[styles.logoPh, { color: p.textMuted }]}>{t("developer.noLogo")}</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Button
                mode="contained-tonal"
                loading={logoUploading}
                onPress={() => void uploadLogo()}
              >
                {t("developer.uploadLogo")}
              </Button>
              {dev?.logoUrl ? (
                <Button mode="outlined" onPress={() => void copy(dev.logoUrl ?? "")}>
                  {t("developer.copyLink")}
                </Button>
              ) : null}
            </View>
          </View>

          <Divider style={styles.div} />

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

          <Divider style={styles.div} />

          <Text variant="titleSmall" style={[styles.blockTitle, { color: p.primary }]}>
            Telegram
          </Text>
          <Text variant="bodySmall" style={[styles.muted, { color: p.textMuted }]}>
            {dev?.telegramLinked ? t("developer.telegramLinked") : t("developer.telegramNotLinked")}
          </Text>
          <View style={styles.row}>
            <Button
              mode="contained"
              loading={tgBusy}
              onPress={() => void requestTelegramLink()}
              style={styles.flex}
            >
              {t("developer.linkTelegram")}
            </Button>
            {tgLink ? (
              <Button mode="outlined" onPress={() => void open(tgLink)} style={styles.flex}>
                {t("developer.open")}
              </Button>
            ) : null}
          </View>
          {tgLink ? (
            <View style={styles.row}>
              <Button mode="outlined" onPress={() => void copy(tgLink)} style={styles.flex}>
                {t("developer.copyLink")}
              </Button>
              <Button mode="outlined" onPress={() => setTgLink(null)} style={styles.flex}>
                {t("developer.close")}
              </Button>
            </View>
          ) : null}

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
  title: { fontWeight: "900", marginBottom: 4 },
  email: { marginBottom: spacing.sm },
  name: { fontWeight: "800", marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  btn: { marginTop: spacing.sm, borderRadius: 12 },
  div: { marginVertical: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  flex: { flex: 1 },
  muted: { marginBottom: spacing.sm },
  blockTitle: { fontWeight: "900", marginBottom: 6 },
  logoRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md, alignItems: "center" },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: "100%", height: "100%", resizeMode: "contain" },
  logoPh: { fontWeight: "700", fontSize: 11, textAlign: "center" },
});
