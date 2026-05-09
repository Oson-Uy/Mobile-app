import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import { setPendingDeveloperWorkspace } from "../../onboarding/pendingDeveloperLogin";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { brandLogoBackdrop, radii, spacing } from "../../theme/tokens";
import { BrandLogo } from "../../ui/BrandLogo";

const SITE_URL = "https://oson-uy.uz";

export function OnboardingScreen() {
  const { t } = useI18n();
  const { completeOnboarding } = useAppPreferences();
  const { palette: p } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: brandLogoBackdrop }]}
      edges={["top", "left", "right"]}
    >
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

        <View
          style={[
            styles.card,
            styles.devCard,
            { backgroundColor: p.surface, borderColor: p.outline },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${p.secondary}18` }]}>
            <MaterialCommunityIcons name="office-building-outline" size={28} color={p.secondary} />
          </View>
          <Text style={[styles.cardTitle, { color: p.text }]}>{t("onboarding.developerTitle")}</Text>
          <Text style={[styles.cardHint, { color: p.textMuted }]}>{t("onboarding.developerHint")}</Text>
          <Button
            mode="contained"
            onPress={() => {
              setPendingDeveloperWorkspace();
              void (async () => {
                await completeOnboarding("developer");
              })();
            }}
            buttonColor={p.secondary}
            textColor="#FFFFFF"
            style={styles.cardBtn}
            contentStyle={styles.cardBtnInner}
          >
            {t("onboarding.developerLoginCta")}
          </Button>
        </View>

        <Text style={[styles.devHint, { color: p.textMuted }]}>{t("onboarding.partnerHint")}</Text>
        <Pressable
          onPress={() => void Linking.openURL(SITE_URL)}
          style={({ pressed }) => [styles.siteLinkWrap, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.siteLink, { color: p.primary }]}>{t("onboarding.partnerSite")}</Text>
        </Pressable>
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
  devCard: {
    marginTop: spacing.lg,
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
    paddingHorizontal: spacing.sm,
  },
  siteLinkWrap: {
    marginTop: spacing.sm,
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  siteLink: {
    fontSize: 16,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
