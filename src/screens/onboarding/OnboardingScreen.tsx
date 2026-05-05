import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useI18n } from "../../i18n/I18nProvider";
import { useAppPreferences } from "../../preferences/AppPreferencesProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import type { UserRole } from "../../preferences/storageKeys";
import { BrandLogo } from "../../ui/BrandLogo";

export function OnboardingScreen() {
  const { t } = useI18n();
  const { completeOnboarding } = useAppPreferences();
  const { palette: p } = useAppTheme();

  const onPick = (role: UserRole) => {
    void completeOnboarding(role);
  };

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
          {t("onboarding.title")}
        </Text>
        <Text style={[styles.subtitle, { color: p.textMuted }]}>
          {t("onboarding.subtitle")}
        </Text>

        <View style={styles.cards}>
          <View
            style={[
              styles.card,
              { backgroundColor: p.surface, borderColor: p.outline },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${p.primary}18` }]}>
              <MaterialCommunityIcons name="home-search" size={28} color={p.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: p.text }]}>
              {t("onboarding.buyerTitle")}
            </Text>
            <Text style={[styles.cardHint, { color: p.textMuted }]}>
              {t("onboarding.buyerHint")}
            </Text>
            <Button
              mode="contained"
              onPress={() => onPick("buyer")}
              buttonColor={p.primary}
              style={styles.cardBtn}
              contentStyle={styles.cardBtnInner}
            >
              {t("onboarding.buyerCta")}
            </Button>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: p.surface, borderColor: p.outline },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${p.secondary}22` }]}>
              <MaterialCommunityIcons name="domain" size={28} color={p.secondary} />
            </View>
            <Text style={[styles.cardTitle, { color: p.text }]}>
              {t("onboarding.developerTitle")}
            </Text>
            <Text style={[styles.cardHint, { color: p.textMuted }]}>
              {t("onboarding.developerHint")}
            </Text>
            <Button
              mode="contained"
              onPress={() => onPick("developer")}
              buttonColor={p.secondary}
              style={styles.cardBtn}
              contentStyle={styles.cardBtnInner}
            >
              {t("onboarding.developerCta")}
            </Button>
          </View>
        </View>
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
  cards: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  card: {
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
});
