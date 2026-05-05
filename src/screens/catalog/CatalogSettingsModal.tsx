import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, RadioButton, Text } from "react-native-paper";

import { useI18n, type Locale } from "../../i18n/I18nProvider";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import type { UserRole } from "../../preferences/storageKeys";
import { useAppTheme, type ThemeMode } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const LOCALES: { id: Locale; labelKey: string }[] = [
  { id: "ru", labelKey: "settings.langRu" },
  { id: "uz", labelKey: "settings.langUz" },
  { id: "en", labelKey: "settings.langEn" },
];

export function CatalogSettingsModal({ visible, onClose }: Props) {
  const { t, locale, setLocale } = useI18n();
  const { mode, setMode, palette: p } = useAppTheme();
  const doneLabelColor = mode === "dark" ? "#0F172A" : "#FFFFFF";
  const { role, setRole } = useAppPreferences();

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
              {t("settings.role")}
            </Text>
            <RadioButton.Group
              value={role}
              onValueChange={(v) => void setRole(v as UserRole)}
            >
              <RadioButton.Item
                label={t("settings.roleBuyer")}
                value="buyer"
                labelStyle={{ color: p.text }}
              />
              <RadioButton.Item
                label={t("settings.roleDeveloper")}
                value="developer"
                labelStyle={{ color: p.text }}
              />
            </RadioButton.Group>

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
    paddingLeft: spacing.lg,
  },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  section: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  sectionSpaced: { marginTop: spacing.lg },
  done: { marginTop: spacing.xl, borderRadius: 16 },
  doneContent: { minHeight: 54, paddingVertical: 8 },
  doneLabel: { fontSize: 16, fontWeight: "600" },
});
