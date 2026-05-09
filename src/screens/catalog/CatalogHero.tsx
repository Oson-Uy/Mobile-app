import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useEvent } from "expo";
import Constants from "expo-constants";
import { useVideoPlayer, VideoView } from "expo-video";

import { useI18n } from "../../i18n/I18nProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { BrandWordmark } from "../../ui/BrandWordmark";

function CatalogHeroVideo({
  uri,
  videoBg,
  onError,
}: {
  uri: string;
  videoBg: string;
  onError: () => void;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  useEffect(() => {
    if (status === "error") onError();
  }, [status, onError]);

  return (
    <VideoView
      style={[styles.video, { backgroundColor: videoBg }]}
      player={player}
      nativeControls
      contentFit="contain"
    />
  );
}

export function CatalogHero() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const uri = String(
    (Constants.expoConfig?.extra as { heroVideoUrl?: string } | undefined)?.heroVideoUrl ?? "",
  ).trim();
  const [videoErr, setVideoErr] = useState(false);
  const onVideoError = useCallback(() => setVideoErr(true), []);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: p.surface,
            borderColor: p.outline,
          },
        ]}
      >
        <BrandWordmark size={26} textStyle={styles.brand} />
        <View style={styles.brandAccentRow}>
          <View style={[styles.accentRule, { backgroundColor: p.secondary }]} />
        </View>
        <Text style={[styles.tagline, { color: p.text }]}>{t("catalog.hero.tagline")}</Text>
        <Text style={[styles.sub, { color: p.textMuted }]}>{t("catalog.hero.sub")}</Text>
      </View>

      {uri && !videoErr ? (
        <CatalogHeroVideo uri={uri} videoBg={p.surfaceMuted} onError={onVideoError} />
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  brand: {
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
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 22,
  },
  sub: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 18,
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: radii.lg,
  },
});
