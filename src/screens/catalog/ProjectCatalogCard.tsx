import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { minPricePerM2FromApiProject } from "../../lib/project-price";
import { formatUzs } from "../../lib/currency";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiProjectListItem } from "../../types/project";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = {
  project: ApiProjectListItem;
  onPress: () => void;
  onLeaveRequest: () => void;
};

const localeFor = (l: string) =>
  l === "uz" ? "uz-UZ" : l === "en" ? "en-US" : "ru-RU";

export function ProjectCatalogCard({ project, onPress, onLeaveRequest }: Props) {
  const { t, locale } = useI18n();
  const { palette: p } = useAppTheme();
  const loc = localeFor(locale);
  const width = Dimensions.get("window").width - spacing.lg * 2;
  const [imgIndex, setImgIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const gallery = useMemo(() => {
    const fromMedia = (project.media ?? []).map((m) => m.imageUrl).filter(Boolean);
    if (fromMedia.length) return fromMedia;
    return project.imageUrl ? [project.imageUrl] : [];
  }, [project]);

  const minM2 = minPricePerM2FromApiProject(project);
  const place = [project.district, project.location].filter(Boolean).join(", ");

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setImgIndex(Math.round(x / width));
  };

  const onDotPress = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setImgIndex(i);
  };

  return (
    <Card style={[styles.card, { backgroundColor: p.surface }]} mode="elevated">
      <View style={styles.imageWrap}>
        {gallery.length ? (
          <>
            <FlatList
              ref={listRef}
              data={gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, idx) => `${idx}-${u.slice(-20)}`}
              onMomentumScrollEnd={onScrollEnd}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: width * 0.62 }}
                  resizeMode="cover"
                />
              )}
            />
            {gallery.length > 1 ? (
              <View style={styles.dots}>
                {gallery.slice(0, 8).map((_, i) => (
                  <Pressable key={i} onPress={() => onDotPress(i)} hitSlop={6}>
                    <View
                      style={[
                        styles.dot,
                        imgIndex === i ? styles.dotActive : styles.dotIdle,
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View
            style={[
              styles.placeholder,
              { width, height: width * 0.45, backgroundColor: p.surfaceMuted },
            ]}
          >
            <MaterialCommunityIcons name="image-off-outline" size={40} color={p.textMuted} />
          </View>
        )}
        <View style={styles.badges}>
          {project.topInCatalog || project.topInHome ? (
            <View style={[styles.badge, { backgroundColor: p.popular }]}>
              <Text style={styles.badgeText}>{t("projectCard.popular")}</Text>
            </View>
          ) : null}
          {project.hasInstallment ? (
            <View style={[styles.badge, { backgroundColor: p.secondary }]}>
              <Text style={styles.badgeText}>{t("projectCard.installment")}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Card.Content style={styles.content}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.infoPress, pressed && { opacity: 0.85 }]}
        >
          <Text variant="titleMedium" style={[styles.title, { color: p.primary }]}>
            {project.name}
          </Text>
          <View style={styles.locRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={p.secondary} />
            <Text variant="bodySmall" style={[styles.loc, { color: p.textMuted }]} numberOfLines={2}>
              {place}
            </Text>
          </View>
          {minM2 > 0 ? (
            <Text variant="titleSmall" style={[styles.price, { color: p.text }]}>
              {t("projectCard.fromPerM2")}{" "}
              <Text style={[styles.priceNum, { color: p.primary }]}>
                {formatUzs(minM2, loc)} {t("common.sum")}/{t("common.m2")}
              </Text>
            </Text>
          ) : null}
          <View style={styles.chips}>
            {project.badgeVerified ? (
              <Chip
                compact
                icon="shield-check"
                style={{ backgroundColor: p.surfaceMuted }}
                textStyle={{ color: p.text }}
              >
                {t("projectCard.verifiedDeveloper")}
              </Chip>
            ) : null}
            {project.isPopular ? (
              <Chip compact style={{ backgroundColor: p.surfaceMuted }} textStyle={{ color: p.text }}>
                {t("catalog.popular")}
              </Chip>
            ) : null}
          </View>
        </Pressable>
        <Button
          mode="contained"
          buttonColor={p.secondary}
          textColor="#FFFFFF"
          style={styles.cta}
          contentStyle={styles.ctaContent}
          onPress={onLeaveRequest}
        >
          {t("projectDetails.leaveRequest")}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: radii.card,
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 18,
    backgroundColor: "#fff",
  },
  dotIdle: {
    width: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  badges: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  content: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  infoPress: {
    gap: spacing.sm,
  },
  title: {
    fontWeight: "900",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  loc: { flex: 1 },
  price: { fontWeight: "700" },
  priceNum: {},
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cta: {
    marginTop: spacing.xs,
    borderRadius: radii.lg,
    alignSelf: "stretch",
  },
  ctaContent: { paddingVertical: 6 },
});
