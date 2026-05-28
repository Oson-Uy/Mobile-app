import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Divider, Snackbar, Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";

import { apiFetch } from "../../api/client";
import { clearToken } from "../../auth/token";
import { registerForPushAndSyncToken } from "../../push/register";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { DevIconButton } from "../../ui/developer/DevIconButton";
import { DevSettingsRow } from "../../ui/developer/DevSettingsRow";
import { devListPadding } from "../../ui/developer/devPlatform";
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

const AVATAR = Platform.select({ ios: 96, android: 104, default: 96 })!;

export function DeveloperProfileScreen() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [editMode, setEditMode] = useState(false);
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
      setEditMode(false);
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

  const cancelEdit = async () => {
    setEditMode(false);
    try {
      await load();
    } catch {
      /* ignore */
    }
  };

  const onAvatarPress = () => {
    if (editMode) void uploadLogo();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard style={styles.card}>
          <View style={styles.toolbar}>
            <Text variant="titleMedium" style={[styles.screenTitle, { color: p.primary }]}>
              {t("developer.profile")}
            </Text>
            <View style={styles.toolbarActions}>
              {editMode ? (
                <>
                  <DevIconButton
                    icon="close"
                    variant="tonal"
                    accessibilityLabel={t("developer.cancel")}
                    onPress={() => void cancelEdit()}
                    disabled={busy}
                  />
                  <DevIconButton
                    icon="check"
                    variant="filled"
                    accessibilityLabel={t("developer.save")}
                    onPress={() => void save()}
                    loading={busy}
                  />
                </>
              ) : (
                <DevIconButton
                  icon="pencil-outline"
                  variant="tonal"
                  accessibilityLabel={t("developer.editProfile")}
                  onPress={() => setEditMode(true)}
                />
              )}
            </View>
          </View>

          <Pressable
            onPress={onAvatarPress}
            disabled={!editMode}
            style={styles.avatarWrap}
            accessibilityRole={editMode ? "button" : undefined}
            accessibilityLabel={editMode ? t("developer.tapToChangeLogo") : undefined}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: p.surfaceMuted, borderColor: p.outline },
              ]}
            >
              {dev?.logoUrl ? (
                <Image source={{ uri: dev.logoUrl }} style={styles.avatarImg} />
              ) : (
                <MaterialCommunityIcons name="domain" size={40} color={p.textMuted} />
              )}
              {logoUploading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : null}
              {editMode && !logoUploading ? (
                <View style={[styles.avatarBadge, { backgroundColor: p.primary }]}>
                  <MaterialCommunityIcons name="camera-outline" size={16} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
          </Pressable>

          <Text variant="titleLarge" style={[styles.name, { color: p.text }]}>
            {dev?.name ?? ""}
          </Text>
          <Text variant="bodyMedium" style={[styles.email, { color: p.textMuted }]}>
            {dev?.email ?? ""}
          </Text>

          {editMode ? (
            <Text variant="bodySmall" style={[styles.editHint, { color: p.secondary }]}>
              {t("developer.tapToChangeLogo")}
            </Text>
          ) : null}

          <View style={[styles.grouped, { borderColor: p.outline, backgroundColor: p.surfaceMuted }]}>
            {!editMode ? (
              <>
                <DevSettingsRow label={t("developer.phone")} value={dev?.phone?.trim() || "—"} />
                <DevSettingsRow label={t("developer.website")} value={dev?.website?.trim() || "—"} />
                <DevSettingsRow
                  label={t("developer.legalAddress")}
                  value={dev?.legalAddress?.trim() || "—"}
                />
                <DevSettingsRow
                  label={t("developer.officeAddress")}
                  value={dev?.officeAddress?.trim() || "—"}
                />
                <DevSettingsRow
                  label={t("developer.description")}
                  value={dev?.description?.trim() || "—"}
                  last
                />
              </>
            ) : (
              <View style={styles.editFields}>
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
                  onChangeText={(v) => setDev((d) => (d ? { ...d, legalAddress: v } : d))}
                  style={styles.field}
                />
                <TextInput
                  mode="outlined"
                  label={t("developer.officeAddress")}
                  value={dev?.officeAddress ?? ""}
                  onChangeText={(v) => setDev((d) => (d ? { ...d, officeAddress: v } : d))}
                  style={styles.field}
                />
                <TextInput
                  mode="outlined"
                  label={t("developer.description")}
                  value={dev?.description ?? ""}
                  multiline
                  onChangeText={(v) => setDev((d) => (d ? { ...d, description: v } : d))}
                  style={styles.field}
                />
              </View>
            )}
          </View>

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
              contentStyle={styles.btnContent}
            >
              {t("developer.linkTelegram")}
            </Button>
            {tgLink ? (
              <DevIconButton
                icon="open-in-new"
                variant="tonal"
                accessibilityLabel={t("developer.open")}
                onPress={() => void open(tgLink)}
              />
            ) : null}
          </View>
          {tgLink ? (
            <Pressable
              onPress={() => void copy(tgLink)}
              style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text variant="labelLarge" style={{ color: p.primary, fontWeight: "600" }}>
                {t("developer.copyLink")}
              </Text>
            </Pressable>
          ) : null}

          <Button
            mode="contained-tonal"
            onPress={() => void registerForPushAndSyncToken()}
            style={styles.footerBtn}
            contentStyle={styles.btnContent}
          >
            {t("developer.syncPush")}
          </Button>
          <Button
            mode="outlined"
            textColor={p.error}
            onPress={() => void signOut()}
            style={styles.footerBtn}
            contentStyle={styles.btnContent}
          >
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
  scroll: { padding: devListPadding, paddingBottom: spacing.xxl * 2 },
  card: { overflow: "visible" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  screenTitle: { fontWeight: "800" },
  toolbarActions: { flexDirection: "row", gap: spacing.sm },
  avatarWrap: { alignSelf: "center", marginBottom: spacing.md },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: { fontWeight: "800", textAlign: "center" },
  email: { textAlign: "center", marginTop: 4 },
  editHint: { textAlign: "center", marginTop: spacing.sm, fontWeight: "600" },
  grouped: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    overflow: "hidden",
  },
  editFields: { paddingVertical: spacing.md, gap: spacing.sm },
  field: { backgroundColor: "transparent" },
  div: { marginVertical: spacing.lg },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginTop: spacing.sm },
  flex: { flex: 1 },
  muted: { marginBottom: spacing.sm },
  blockTitle: { fontWeight: "800" },
  linkRow: { alignSelf: "flex-start", marginTop: spacing.sm, paddingVertical: spacing.xs },
  footerBtn: {
    marginTop: spacing.sm,
    borderRadius: Platform.select({ ios: 12, android: 14, default: 12 }),
  },
  btnContent: {
    height: Platform.select({ ios: 44, android: 48, default: 44 }),
  },
});
