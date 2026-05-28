import React, { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useEvent } from "expo";
import Constants from "expo-constants";
import { useVideoPlayer, VideoView } from "expo-video";

import { useI18n } from "../../i18n/I18nProvider";
import { CatalogSurfaceCard } from "../../ui/catalog/CatalogSurfaceCard";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

const LOGO_FULL = require("../../../assets/osonuy-logo-full-removedbg.png");

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
      <CatalogSurfaceCard style={styles.card}>
        <Image source={LOGO_FULL} style={styles.logoFull} resizeMode="contain" />
        <View style={[styles.accentRule, { backgroundColor: p.secondary }]} />
        <Text style={[styles.tagline, { color: p.text }]}>{t("catalog.hero.tagline")}</Text>
        <Text style={[styles.sub, { color: p.textMuted }]}>{t("catalog.hero.sub")}</Text>
      </CatalogSurfaceCard>

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
    padding: spacing.lg,
    overflow: "hidden",
  },
  logoFull: {
    width: 150,
    height: 50,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
  },
  accentRule: {
    height: 3,
    width: 52,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  tagline: {
    marginTop: 0,
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
