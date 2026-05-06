import React from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { BrandLogo } from "../../ui/BrandLogo";

const DASHBOARD_URL = "https://oson-uy.uz/dashboard";

export function OnboardingScreen() {
  const { t } = useI18n();
  const { completeOnboarding } = useAppPreferences();
  const { palette: p } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.background }]} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <BrandLogo size={48} />
            <Text style={styles.wordmark}>
              <Text style={{ color: p.primary }}>Oson</Text>
              <Text style={{ color: p.secondary }}>Uy</Text>
            </Text>
          </View>
          <View style={[styles.accentUnderLogo, { backgroundColor: p.secondary }]} />
        </View>
        <Text variant="headlineSmall" style={[styles.title, { color: p.text }]}>
          {t("onboarding.welcomeTitle")}
        </Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>
          {t("onboarding.welcomeSubtitle")}
        </Text>

        <View
          style={[
            styles.card,
            { backgroundColor: p.surface, borderColor: p.outline },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${p.primary}18` }]}>
            <MaterialCommunityIcons name="home-search" size={28} color={p.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: p.text }]}>{t("onboarding.buyerTitle")}</Text>
          <Text style={[styles.cardHint, { color: p.textMuted }]}>{t("onboarding.buyerHint")}</Text>
          <Button
            mode="contained"
            onPress={() => void completeOnboarding("buyer")}
            buttonColor={p.primary}
            style={styles.cardBtn}
            contentStyle={styles.cardBtnInner}
          >
            {t("onboarding.continue")}
          </Button>
        </View>

        <Text style={[styles.devHint, { color: p.textMuted }]}>{t("onboarding.developerOnlyWebHint")}</Text>
        <Button
          mode="outlined"
          onPress={() => void Linking.openURL(DASHBOARD_URL)}
          style={styles.outlineBtn}
          textColor={p.primary}
        >
          {t("onboarding.openDeveloperDashboard")}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brandRow: {
    alignSelf: "flex-start",
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wordmark: {
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: -0.6,
  },
  accentUnderLogo: {
    marginTop: spacing.sm,
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  title: {
    marginTop: spacing.lg,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing.xxl,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 17,
  },
  cardHint: {
    marginTop: spacing.xs,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  cardBtn: { borderRadius: radii.lg },
  cardBtnInner: { paddingVertical: 8, minHeight: 48 },
  devHint: {
    marginTop: spacing.xl,
    lineHeight: 20,
    fontSize: 13,
    textAlign: "center",
  },
  outlineBtn: { marginTop: spacing.md, borderRadius: radii.lg },
});
