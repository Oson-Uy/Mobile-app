import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, RadioButton, Text } from "react-native-paper";

import { getToken, clearToken } from "../../auth/token";
import { useI18n, type Locale } from "../../i18n/I18nProvider";
import {
  exitDeveloperWorkspace,
  navigateToDeveloperWorkspace,
} from "../../navigation/navigationRef";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import { useAppTheme, type ThemeMode } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** false внутри кабинета застройщика — без кнопки «в кабинет». */
  showCabinetEntry?: boolean;
};

const LOCALES: { id: Locale; labelKey: string }[] = [
  { id: "ru", labelKey: "settings.langRu" },
  { id: "uz", labelKey: "settings.langUz" },
  { id: "en", labelKey: "settings.langEn" },
];

export function CatalogSettingsModal({
  visible,
  onClose,
  showCabinetEntry = true,
}: Props) {
  const { t, locale, setLocale } = useI18n();
  const { mode, setMode, palette: p } = useAppTheme();
  const doneLabelColor = mode === "dark" ? "#0F172A" : "#FFFFFF";
  const { role, setRole } = useAppPreferences();
  const [hasDevSession, setHasDevSession] = useState(false);

  const refreshSession = useCallback(async () => {
    const tok = await getToken();
    setHasDevSession(Boolean(tok));
  }, []);

  useEffect(() => {
    if (visible) void refreshSession();
  }, [visible, refreshSession]);

  const onDeveloperLogin = () => {
    onClose();
    if (showCabinetEntry) navigateToDeveloperWorkspace();
  };

  const onExitDeveloper = async () => {
    await clearToken();
    await setRole("buyer");
    setHasDevSession(false);
    onClose();
    exitDeveloperWorkspace();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: p.surface }]}>
          <View style={styles.sheetHeader}>
            <Text variant="titleLarge" style={{ fontWeight: "800", color: p.text }}>
              {t("settings.title")}
            </Text>
            <IconButton icon="close" onPress={onClose} iconColor={p.textMuted} />
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={[styles.section, { color: p.textMuted }]}>
              {t("settings.language")}
            </Text>
            <RadioButton.Group
              value={locale}
              onValueChange={(v) => void setLocale(v as Locale)}
            >
              {LOCALES.map((row) => (
                <RadioButton.Item
                  key={row.id}
                  label={t(row.labelKey)}
                  value={row.id}
                  labelStyle={{ color: p.text }}
                />
              ))}
            </RadioButton.Group>

            <Text style={[styles.section, styles.sectionSpaced, { color: p.textMuted }]}>
              {t("settings.theme")}
            </Text>
            <RadioButton.Group
              value={mode}
              onValueChange={(v) => void setMode(v as ThemeMode)}
            >
              <RadioButton.Item
                label={t("settings.themeLight")}
                value="light"
                labelStyle={{ color: p.text }}
              />
              <RadioButton.Item
                label={t("settings.themeDark")}
                value="dark"
                labelStyle={{ color: p.text }}
              />
            </RadioButton.Group>

            <Text style={[styles.section, styles.sectionSpaced, { color: p.textMuted }]}>
              {t("settings.developerSection")}
            </Text>
            {showCabinetEntry ? (
              <Text variant="bodySmall" style={{ color: p.textMuted, marginBottom: spacing.sm }}>
                {t("settings.developerSectionHint")}
              </Text>
            ) : null}
            {showCabinetEntry ? (
              <Button
                mode="contained"
                onPress={onDeveloperLogin}
                buttonColor={p.secondary}
                textColor="#FFFFFF"
                style={styles.devBtn}
              >
                {t("settings.goToDeveloperCabinet")}
              </Button>
            ) : null}
            {hasDevSession ? (
              <Button
                mode="outlined"
                onPress={() => void onExitDeveloper()}
                style={[styles.devBtn, !showCabinetEntry && styles.devBtnFirstInSection]}
              >
                {t("settings.exitDeveloper")}
              </Button>
            ) : null}

            <Button
              mode="contained"
              onPress={onClose}
              style={styles.done}
              contentStyle={styles.doneContent}
              labelStyle={styles.doneLabel}
              buttonColor={p.primary}
              textColor={doneLabelColor}
            >
              {t("settings.done")}
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "88%",
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    fontWeight: "800",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  sectionSpaced: {
    marginTop: spacing.lg,
  },
  devBtn: {
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  devBtnFirstInSection: {
    marginTop: spacing.sm,
  },
  done: {
    marginTop: spacing.lg,
    borderRadius: radii.lg,
  },
  doneContent: { paddingVertical: 8, minHeight: 48 },
  doneLabel: { fontWeight: "800", fontSize: 16 },
});
