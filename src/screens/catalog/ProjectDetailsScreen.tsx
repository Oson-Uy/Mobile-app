import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Button,
  Chip,
  Divider,
  Text,
} from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import WebView from "react-native-webview";

import {
  getVideoWebEmbed,
  INSTAGRAM_EMBED_INJECTED_JS,
  normalizeVideoUrl,
} from "../../lib/video-url";

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiFloor, ApiProjectFull, ApiProjectPreview } from "../../types/project";
import { minPricePerM2FromApiProject } from "../../lib/project-price";
import { formatUzs } from "../../lib/currency";
import { FloorLayoutsModal } from "./FloorLayoutsModal";
import { FullScreenLoader } from "../../ui/FullScreenLoader";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { useAppTheme } from "../../theme/AppThemeProvider";
import type { AppPalette } from "../../theme/tokens";
import { radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "ProjectDetails">;

const localeFor = (l: string) =>
  l === "uz" ? "uz-UZ" : l === "en" ? "en-US" : "ru-RU";

type SpecRow = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
};

type DetailsStyles = ReturnType<typeof createDetailsStyles>;

function createDetailsStyles(p: AppPalette) {
  return StyleSheet.create({
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
    mt: { marginTop: spacing.md },
    err: { color: p.error, fontWeight: "700", textAlign: "center" },
    heroWrap: { position: "relative", backgroundColor: "#000" },
    heroPh: {
      backgroundColor: p.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbStrip: { maxHeight: 72, backgroundColor: "rgba(0,0,0,0.35)" },
    thumbStripIn: { padding: spacing.sm, gap: spacing.sm },
    thumb: {
      width: 72,
      height: 52,
      borderRadius: radii.sm,
      marginRight: spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    thumbOn: { borderColor: p.secondary },
    heroBadges: { position: "absolute", top: spacing.md, left: spacing.md, gap: 6 },
    hBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
    hPop: { backgroundColor: p.popular },
    hPlan: { backgroundColor: p.secondary },
    hBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
    body: { padding: spacing.lg, gap: spacing.md },
    h1: { fontWeight: "900", color: p.primary, letterSpacing: 0.2 },
    locRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    loc: { flex: 1, fontWeight: "600", color: p.text },
    priceHero: { fontWeight: "700", color: p.text },
    priceHeroNum: { color: p.primary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { backgroundColor: p.surfaceMuted },
    metrics: { flexDirection: "row", gap: spacing.sm },
    metric: {
      flex: 1,
      backgroundColor: p.surfaceMuted,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.outline,
    },
    metricLbl: {
      fontSize: 10,
      fontWeight: "800",
      color: p.textMuted,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    metricVal: { fontWeight: "800", color: p.primary, fontSize: 13 },
    accHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.outline,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      backgroundColor: p.surface,
    },
    accTitle: { fontWeight: "800", color: p.primary, fontSize: 12, letterSpacing: 0.5 },
    accBody: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: p.surfaceMuted,
      borderRadius: radii.md,
      gap: spacing.sm,
    },
    desc: { lineHeight: 22, color: p.text },
    advRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    advTxt: { flex: 1, fontWeight: "600", fontSize: 12, color: p.text },
    cta: { marginTop: spacing.sm, borderRadius: radii.lg },
    ctaIn: { paddingVertical: 8 },
    cta2: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radii.lg },
    section: { marginTop: spacing.md },
    specRow: {
      flexDirection: "row",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.outline,
    },
    specTxt: { flex: 1 },
    specLbl: {
      fontSize: 11,
      fontWeight: "800",
      color: p.textMuted,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    specVal: { color: p.text },
    progressHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    progressPct: { fontWeight: "900" },
    progressTrack: {
      height: 10,
      borderRadius: 999,
      overflow: "hidden",
      marginTop: spacing.sm,
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
    },
    progressList: { marginTop: spacing.md, gap: 10 },
    progressItem: { gap: 8 },
    progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    progressTxt: { flex: 1, fontWeight: "700" },
    progressPhotos: { paddingLeft: 28, gap: 10 },
    progressPhoto: {
      width: 74,
      height: 54,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    progressHint: { marginTop: spacing.md },
    logo: { width: 120, height: 48, marginBottom: spacing.sm },
    devSub: { fontWeight: "800", marginBottom: 4, color: p.text },
    devDesc: { opacity: 0.85, color: p.text },
    divider: { marginVertical: spacing.md, backgroundColor: p.outline },
    linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
    linkTxt: { color: p.primary, fontWeight: "600", flex: 1 },
    addr: { marginTop: spacing.sm, opacity: 0.85, color: p.text },
    addrLbl: { fontWeight: "800", color: p.text },
    relatedBlock: { marginTop: spacing.lg },
    relatedRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
    relatedCard: {
      width: 160,
      backgroundColor: p.surface,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.outline,
      overflow: "hidden",
      paddingBottom: spacing.sm,
    },
    relatedImg: { width: "100%", height: 88, backgroundColor: p.surfaceMuted },
    relatedPh: {},
    relatedName: {
      fontWeight: "800",
      paddingHorizontal: spacing.sm,
      marginTop: spacing.sm,
      minHeight: 36,
      color: p.text,
    },
    relatedPrice: { paddingHorizontal: spacing.sm, color: p.primary, fontWeight: "700" },
    floorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: p.surfaceMuted,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.outline,
    },
    floorNum: { fontWeight: "900", fontSize: 16, color: p.text },
    floorPrice: { opacity: 0.8, color: p.text },
    muted: { opacity: 0.7, fontStyle: "italic", color: p.text },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexWrap: "wrap",
    },
    videoHint: { color: p.textMuted, marginBottom: spacing.sm },
    /** Горизонтальное видео (YouTube и т.п.) */
    videoBox: {
      width: "100%",
      aspectRatio: 16 / 9,
      borderRadius: radii.md,
      backgroundColor: "#000",
      overflow: "hidden",
    },
    /** Базовые стили вертикального блока; width/height задаются в экране под 9:16 */
    videoBoxReelOuter: {
      alignSelf: "center",
      borderRadius: radii.lg,
      backgroundColor: "#000",
      overflow: "hidden",
    },
    reviewHint: { color: p.textMuted, marginBottom: spacing.sm },
    reviewCard: {
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: p.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.outline,
      marginBottom: spacing.sm,
    },
    reviewStars: { flexDirection: "row", gap: 2, marginBottom: spacing.sm },
    reviewQuote: { color: p.text, fontStyle: "italic", lineHeight: 20 },
  });
}

function RelatedStrip({
  title,
  projects,
  onSelect,
  t,
  loc,
  styles: themed,
}: {
  title: string;
  projects: ApiProjectPreview[];
  onSelect: (id: number) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
  loc: string;
  styles: DetailsStyles;
}) {
  if (!projects?.length) return null;
  return (
    <View style={themed.relatedBlock}>
      <SectionTitle title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={themed.relatedRow}>
          {projects.map((proj) => (
            <Pressable
              key={proj.id}
              style={themed.relatedCard}
              onPress={() => onSelect(proj.id)}
            >
              {proj.imageUrl ? (
                <Image source={{ uri: proj.imageUrl }} style={themed.relatedImg} />
              ) : (
                <View style={[themed.relatedImg, themed.relatedPh]} />
              )}
              <Text variant="labelLarge" numberOfLines={2} style={themed.relatedName}>
                {proj.name}
              </Text>
              {proj.priceFrom != null && proj.priceFrom > 0 ? (
                <Text variant="labelSmall" style={themed.relatedPrice}>
                  {t("projectDetails.priceFromShort")}{" "}
                  {formatUzs(proj.priceFrom, loc)} {t("common.sum")}/{t("common.m2")}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ProjectDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t, locale } = useI18n();
  const { palette: p } = useAppTheme();
  const styles = useMemo(() => createDetailsStyles(p), [p]);
  const loc = localeFor(locale);
  const insets = useSafeAreaInsets();
  const slideW = Dimensions.get("window").width;

  const [data, setData] = useState<ApiProjectFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const [floorModal, setFloorModal] = useState<ApiFloor | null>(null);
  const galleryRef = useRef<FlatList<string>>(null);

  const load = useCallback(async () => {
    try {
      const p = await apiFetch<ApiProjectFull>(`/projects/${id}/full`);
      setData(p);
      setNotFound(false);
    } catch {
      setData(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: data?.name ?? "",
      headerBackTitle: t("catalog.title"),
    });
  }, [navigation, data?.name, t]);

  const gallery = useMemo(() => {
    if (!data) return [];
    const imgs = (data.media?.length ? data.media.map((m) => m.imageUrl) : []).filter(Boolean);
    if (imgs.length) return imgs;
    return data.imageUrl ? [data.imageUrl] : [];
  }, [data]);

  const specRows: SpecRow[] = useMemo(() => {
    if (!data) return [];
    const rows: SpecRow[] = [];
    rows.push({
      icon: "credit-card-outline",
      label: t("projectDetails.installment"),
      value: data.hasInstallment ? t("projectDetails.yes") : t("projectDetails.no"),
    });
    const materials = data.materials ?? [];
    if (materials.length) {
      rows.push({
        icon: "layers-outline",
        label: t("projectDetails.materials"),
        value: materials.join(", "),
      });
    }
    if (data.buildingCount != null) {
      rows.push({
        icon: "office-building-outline",
        label: t("projectDetails.buildingCount"),
        value: String(data.buildingCount),
      });
    }
    if (data.corpusCount != null) {
      rows.push({
        icon: "office-building-marker-outline",
        label: t("projectDetails.corpusCount"),
        value: String(data.corpusCount),
      });
    }
    if (data.ceilingHeightM != null) {
      rows.push({
        icon: "ruler",
        label: t("projectDetails.ceilingHeight"),
        value: `${data.ceilingHeightM} ${t("projectDetails.metersShort")}`,
      });
    }
    if (data.hasSurfaceParking || (data.surfaceParkingSpaces ?? 0) > 0) {
      const extra =
        data.surfaceParkingSpaces != null
          ? ` · ${t("projectDetails.surfaceSpaces")}: ${data.surfaceParkingSpaces}`
          : "";
      rows.push({
        icon: "car-outline",
        label: t("projectDetails.parkingSurface"),
        value: `${data.hasSurfaceParking ? t("projectDetails.yes") : t("projectDetails.no")}${extra}`,
      });
    }
    if (data.hasUndergroundParking || (data.undergroundParkingSpaces ?? 0) > 0) {
      const extra =
        data.undergroundParkingSpaces != null
          ? ` · ${t("projectDetails.undergroundSpaces")}: ${data.undergroundParkingSpaces}`
          : "";
      rows.push({
        icon: "garage",
        label: t("projectDetails.parkingUnderground"),
        value: `${data.hasUndergroundParking ? t("projectDetails.yes") : t("projectDetails.no")}${extra}`,
      });
    }
    if (data.elevatorsCount != null) {
      rows.push({
        icon: "swap-vertical",
        label: t("projectDetails.elevators"),
        value: String(data.elevatorsCount),
      });
    }
    return rows;
  }, [data, t]);

  const floorsSorted = useMemo(() => {
    const raw = data?.floors ?? [];
    return [...raw].sort((a, b) => b.floor - a.floor);
  }, [data?.floors]);

  const minM2 = data ? minPricePerM2FromApiProject(data) : 0;

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setActiveImg(Math.round(x / slideW));
  };

  const scrollGalleryTo = (idx: number) => {
    galleryRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveImg(idx);
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const goLead = (floorId?: number) => {
    if (!data) return;
    navigation.navigate("LeadForm", {
      projectId: data.id,
      floorId,
      projectName: data.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <FullScreenLoader message={t("common.loading")} />
      </View>
    );
  }

  if (notFound || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>{t("projectDetails.notFound")}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.mt}>
          {t("common.back")}
        </Button>
      </View>
    );
  }

  const place = [data.district, data.location].filter(Boolean).join(", ");
  const dev = data.developer;
  const videoWeb = data.videoUrl ? getVideoWebEmbed(data.videoUrl) : null;
  const videoContentW = slideW - spacing.lg * 2;
  const reelFrameH = Math.min(
    (videoContentW * 16) / 9,
    Dimensions.get("window").height * 0.72,
  );
  /** Zoom + обрезка: боковые поля; смещение вверх — дополнительно убирает нижнюю панель (лайки, «ещё в Instagram»). */
  const IG_EMBED_ZOOM = 1.17;
  /** Доля высоты кадра: насколько сдвинуть embed вверх относительно центрированного crop (0 = симметрично). */
  const IG_EMBED_CROP_BOTTOM_BIAS = 0.07;
  const videoPlayerStyle: StyleProp<ViewStyle> = (() => {
    if (!data.videoUrl) return styles.videoBox;
    if (videoWeb?.vertical) {
      return [styles.videoBoxReelOuter, { width: videoContentW, height: reelFrameH }];
    }
    return styles.videoBox;
  })();

  return (
    <>
      <FloorLayoutsModal
        visible={floorModal != null}
        floor={floorModal}
        onDismiss={() => setFloorModal(null)}
        onRequestLead={() => {
          const f = floorModal;
          setFloorModal(null);
          if (f) goLead(f.id);
        }}
      />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxl * 2,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.heroWrap}>
          {gallery.length ? (
            <>
              <FlatList
                ref={galleryRef}
                data={gallery}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(u, idx) => `${idx}-${u.slice(-24)}`}
                onMomentumScrollEnd={onGalleryScroll}
                getItemLayout={(_, index) => ({
                  length: slideW,
                  offset: slideW * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: slideW, height: slideW * 0.56 }}
                    resizeMode="cover"
                  />
                )}
              />
              {gallery.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbStrip}
                  contentContainerStyle={styles.thumbStripIn}
                >
                  {gallery.map((u, idx) => (
                    <Pressable key={`${idx}-${u.slice(-16)}`} onPress={() => scrollGalleryTo(idx)}>
                      <Image
                        source={{ uri: u }}
                        style={[
                          styles.thumb,
                          activeImg === idx && styles.thumbOn,
                        ]}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </>
          ) : (
            <View style={[styles.heroPh, { width: slideW, height: slideW * 0.4 }]}>
              <MaterialCommunityIcons name="image-off-outline" size={48} color={p.textMuted} />
            </View>
          )}
          <View style={styles.heroBadges}>
            {data.topInCatalog || data.topInHome ? (
              <View style={[styles.hBadge, styles.hPop]}>
                <Text style={styles.hBadgeTxt}>{t("projectCard.popular")}</Text>
              </View>
            ) : null}
            {data.plan ? (
              <View style={[styles.hBadge, styles.hPlan]}>
                <Text style={styles.hBadgeTxt}>{data.plan}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text variant="headlineSmall" style={styles.h1}>
            {data.name}
          </Text>
          <View style={styles.locRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={p.secondary} />
            <Text variant="bodyLarge" style={styles.loc}>
              {place}
            </Text>
          </View>

          {minM2 > 0 ? (
            <Text variant="titleMedium" style={styles.priceHero}>
              {t("projectCard.fromPerM2")}{" "}
              <Text style={styles.priceHeroNum}>
                {formatUzs(minM2, loc)} {t("common.sum")}/{t("common.m2")}
              </Text>
            </Text>
          ) : null}

          <View style={styles.chips}>
            {data.hasInstallment ? (
              <Chip compact style={styles.chip} textStyle={{ color: p.text }}>
                {t("projectCard.installment")}
              </Chip>
            ) : null}
            {data.badgeVerified ? (
              <Chip compact icon="shield-check" style={styles.chip} textStyle={{ color: p.text }}>
                {t("projectCard.verifiedDeveloper")}
              </Chip>
            ) : null}
          </View>

          {(data.avgRating != null && data.avgRating > 0) || (data.reviewsCount ?? 0) > 0 ? (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialCommunityIcons
                  key={star}
                  name="star"
                  size={18}
                  color={
                    star <= Math.round(Number(data.avgRating) || 0)
                      ? p.secondary
                      : p.outline
                  }
                />
              ))}
              <Text style={{ color: p.text, fontWeight: "700", flex: 1, flexWrap: "wrap" }}>
                {data.avgRating != null ? String(data.avgRating) : "—"} ·{" "}
                {t("projectDetails.ratingCount", { n: data.reviewsCount ?? 0 })}
              </Text>
            </View>
          ) : null}

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLbl}>{t("projectDetails.delivery")}</Text>
              <Text style={styles.metricVal}>{data.deliveryDate}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLbl}>{t("projectDetails.floors")}</Text>
              <Text style={styles.metricVal}>{data.totalFloors ?? "—"}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLbl}>{t("projectDetails.units")}</Text>
              <Text style={styles.metricVal}>
                {data.totalUnits != null
                  ? String(data.totalUnits)
                  : floorsSorted.length
                    ? String(floorsSorted.length)
                    : "—"}
              </Text>
            </View>
          </View>

          {(data.description || (data.advantages?.length ?? 0) > 0) ? (
            <>
              <Pressable style={styles.accHead} onPress={() => setDescOpen(!descOpen)}>
                <Text style={styles.accTitle}>
                  {descOpen ? t("projectDetails.hideDetails") : t("projectDetails.showDetails")}
                </Text>
                <MaterialCommunityIcons
                  name={descOpen ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={p.primary}
                />
              </Pressable>
              {descOpen ? (
                <View style={styles.accBody}>
                  {data.description ? (
                    <Text variant="bodyMedium" style={styles.desc}>
                      {data.description}
                    </Text>
                  ) : null}
                  {(data.advantages ?? []).map((adv, i) => (
                    <View key={i} style={styles.advRow}>
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color={p.success} />
                      <Text style={styles.advTxt}>{adv}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}

          <Button
            mode="contained"
            style={styles.cta}
            contentStyle={styles.ctaIn}
            buttonColor={p.secondary}
            textColor="#FFFFFF"
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>

          <SectionCard style={styles.section}>
            <SectionTitle title={t("projectDetails.specsTitle")} />
            {specRows.map((row, i) => (
              <View key={`${row.label}-${i}`} style={styles.specRow}>
                <MaterialCommunityIcons name={row.icon} size={22} color={p.primary} />
                <View style={styles.specTxt}>
                  <Text style={styles.specLbl}>{row.label}</Text>
                  <Text variant="bodyMedium" style={styles.specVal}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>

          {dev ? (
            <SectionCard style={styles.section}>
              <SectionTitle title={t("projectDetails.developerTitle")} subtitle={dev.name} />
              {dev.logoUrl ? (
                <Image source={{ uri: dev.logoUrl }} style={styles.logo} resizeMode="contain" />
              ) : null}
              {dev.description ? (
                <>
                  <Text style={styles.devSub}>{t("projectDetails.developerAbout")}</Text>
                  <Text variant="bodyMedium" style={styles.devDesc}>
                    {dev.description}
                  </Text>
                </>
              ) : null}
              <Divider style={styles.divider} />
              {dev.phone ? (
                <Pressable style={styles.linkRow} onPress={() => void openLink(`tel:${dev.phone}`)}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={p.primary} />
                  <Text style={styles.linkTxt}>{dev.phone}</Text>
                </Pressable>
              ) : null}
              {dev.email ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => void openLink(`mailto:${dev.email}`)}
                >
                  <MaterialCommunityIcons name="email-outline" size={20} color={p.primary} />
                  <Text style={styles.linkTxt}>{dev.email}</Text>
                </Pressable>
              ) : null}
              {dev.website ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => {
                    const w = dev.website?.startsWith("http") ? dev.website : `https://${dev.website}`;
                    void openLink(w ?? "");
                  }}
                >
                  <MaterialCommunityIcons name="web" size={20} color={p.primary} />
                  <Text style={styles.linkTxt}>{dev.website}</Text>
                </Pressable>
              ) : null}
              {dev.legalAddress ? (
                <Text variant="bodySmall" style={styles.addr}>
                  <Text style={styles.addrLbl}>{t("projectDetails.legalAddressLabel")}: </Text>
                  {dev.legalAddress}
                </Text>
              ) : null}
              {dev.officeAddress ? (
                <Text variant="bodySmall" style={styles.addr}>
                  <Text style={styles.addrLbl}>{t("projectDetails.officeAddressLabel")}: </Text>
                  {dev.officeAddress}
                </Text>
              ) : null}
            </SectionCard>
          ) : null}

          {data.progress?.milestones?.length ? (
            <SectionCard style={styles.section}>
              <View style={styles.progressHead}>
                <SectionTitle title={t("projectDetails.progressTitle")} />
                <Text style={[styles.progressPct, { color: p.text }]}>
                  {data.progress.percent != null ? `${data.progress.percent}%` : "—"}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: p.outline }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: p.primary,
                      width: `${Math.max(0, Math.min(100, data.progress.percent ?? 0))}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressList}>
                {data.progress.milestones
                  .slice()
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((m) => (
                    <View key={m.id} style={styles.progressItem}>
                      <View style={styles.progressRow}>
                        <MaterialCommunityIcons
                          name={m.done ? "check-circle" : "checkbox-blank-circle-outline"}
                          size={18}
                          color={m.done ? p.success : p.textMuted}
                        />
                        <Text style={[styles.progressTxt, { color: p.text }]}>{m.title}</Text>
                      </View>
                      {m.photoUrls?.length ? (
                        <FlatList
                          data={m.photoUrls.slice(0, 8)}
                          keyExtractor={(u, idx) => `${m.id}-${idx}-${u.slice(-18)}`}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.progressPhotos}
                          renderItem={({ item }) => (
                            <Image
                              source={{ uri: item }}
                              style={[
                                styles.progressPhoto,
                                {
                                  borderColor: p.outline,
                                  backgroundColor: p.surfaceMuted,
                                },
                              ]}
                            />
                          )}
                        />
                      ) : null}
                    </View>
                  ))}
              </View>
              <Text variant="bodySmall" style={[styles.progressHint, { color: p.textMuted }]}>
                {t("projectDetails.progressDone", {
                  done: data.progress.done ?? 0,
                  total: data.progress.total ?? data.progress.milestones.length,
                })}
              </Text>
            </SectionCard>
          ) : null}

          <RelatedStrip
            title={t("projectDetails.siblingsTitle")}
            projects={data.siblingProjects ?? []}
            onSelect={(pid) => navigation.push("ProjectDetails", { id: pid })}
            t={t}
            loc={loc}
            styles={styles}
          />
          <RelatedStrip
            title={t("projectDetails.nearbyTitle")}
            projects={data.nearbyProjects ?? []}
            onSelect={(pid) => navigation.push("ProjectDetails", { id: pid })}
            t={t}
            loc={loc}
            styles={styles}
          />

          {data.videoUrl ? (
            <View style={styles.section}>
              <SectionTitle title={t("projectDetails.videoTitle")} />
              <Text variant="bodySmall" style={styles.videoHint}>
                {videoWeb?.vertical
                  ? t("projectDetails.videoSubtitleReels")
                  : t("projectDetails.videoSubtitle")}
              </Text>
              {videoWeb ? (
                videoWeb.provider === "instagram" ? (
                  <View
                    style={[
                      styles.videoBoxReelOuter,
                      {
                        width: videoContentW,
                        height: reelFrameH,
                        overflow: "hidden",
                        backgroundColor: "#000",
                      },
                    ]}
                  >
                    <WebView
                      source={{ uri: videoWeb.uri }}
                      userAgent={videoWeb.userAgent}
                      style={{
                        width: videoContentW * IG_EMBED_ZOOM,
                        height: reelFrameH * IG_EMBED_ZOOM,
                        marginLeft: -(videoContentW * (IG_EMBED_ZOOM - 1)) / 2,
                        marginTop:
                          -(reelFrameH * (IG_EMBED_ZOOM - 1)) / 2 +
                          reelFrameH * IG_EMBED_CROP_BOTTOM_BIAS,
                        backgroundColor: "transparent",
                      }}
                      scrollEnabled={false}
                      bounces={false}
                      allowsFullscreenVideo
                      allowsInlineMediaPlayback
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptEnabled
                      domStorageEnabled
                      mixedContentMode="compatibility"
                      sharedCookiesEnabled
                      thirdPartyCookiesEnabled
                      injectedJavaScript={INSTAGRAM_EMBED_INJECTED_JS}
                    />
                  </View>
                ) : (
                  <WebView
                    source={{ uri: videoWeb.uri }}
                    style={videoPlayerStyle}
                    allowsFullscreenVideo
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                    mixedContentMode="compatibility"
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                  />
                )
              ) : (
                <Video
                  source={{ uri: normalizeVideoUrl(data.videoUrl) }}
                  style={videoPlayerStyle}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                />
              )}
            </View>
          ) : null}

          {(data.reviews?.length ?? 0) > 0 ? (
            <View style={styles.section}>
              <SectionTitle title={t("projectDetails.reviewsTitle")} />
              <Text variant="bodySmall" style={styles.reviewHint}>
                {t("projectDetails.reviewsHint")}
              </Text>
              {(data.reviews ?? []).map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <MaterialCommunityIcons
                        key={s}
                        name="star"
                        size={16}
                        color={s <= (rev.rating ?? 0) ? p.secondary : p.outline}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewQuote}>
                    &quot;{rev.comment?.trim() ? rev.comment : t("projectDetails.noComment")}&quot;
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <SectionCard style={styles.section}>
            <SectionTitle title={t("projectDetails.floorStackTitle")} />
            {floorsSorted.length ? (
              floorsSorted.map((f) => (
                <Pressable
                  key={f.id}
                  style={styles.floorRow}
                  onPress={() => setFloorModal(f)}
                >
                  <View>
                    <Text style={styles.floorNum}>
                      {t("floorTower.floorLabel", { n: f.floor })}
                    </Text>
                    <Text variant="bodySmall" style={styles.floorPrice}>
                      {formatUzs(f.pricePerM2, loc)} {t("common.sum")}/{t("common.m2")}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={p.textMuted} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.muted}>{t("projectDetails.floorNotPublished")}</Text>
            )}
          </SectionCard>

          <Button
            mode="contained"
            style={styles.cta2}
            contentStyle={styles.ctaIn}
            buttonColor={p.secondary}
            textColor="#FFFFFF"
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
