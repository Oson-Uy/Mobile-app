import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { Video, ResizeMode } from "expo-av";
import Constants from "expo-constants";

import { useI18n } from "../../i18n/I18nProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

export function CatalogHero() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const uri = String(
    (Constants.expoConfig?.extra as { heroVideoUrl?: string } | undefined)
      ?.heroVideoUrl ?? "",
  ).trim();
  const [videoErr, setVideoErr] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: p.primary }]}>
        <Text style={styles.brand}>Oson Uy</Text>
        <View style={styles.brandAccentRow}>
          <View style={[styles.accentRule, { backgroundColor: p.secondary }]} />
        </View>
        <Text style={styles.tagline}>{t("catalog.hero.tagline")}</Text>
        <Text style={styles.sub}>{t("catalog.hero.sub")}</Text>
      </View>

      {uri && !videoErr ? (
        <Video
          style={[styles.video, { backgroundColor: p.surfaceMuted }]}
          source={{ uri }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onError={() => setVideoErr(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
  },
  brand: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  brandAccentRow: {
    marginTop: spacing.sm,
    alignItems: "flex-start",
  },
  accentRule: {
    height: 4,
    width: 48,
    borderRadius: 2,
  },
  tagline: {
    marginTop: spacing.md,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 22,
  },
  sub: {
    marginTop: spacing.xs,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 18,
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: radii.lg,
  },
});
