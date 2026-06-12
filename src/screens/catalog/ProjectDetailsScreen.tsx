import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Platform,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
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
import { buyerTabBarBottomInset } from "../../navigation/tabBarInsets";
import { iosScrollInset } from "../../navigation/glassOptions";
import type { CatalogStackParamList } from "../../navigation/types";
import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiFloor, ApiProjectFull, ApiProjectPreview } from "../../types/project";
import { minPricePerM2FromApiProject } from "../../lib/project-price";
import { formatUzs } from "../../lib/currency";
import {
  extractCoordsFromGoogleUrl,
  geocodePlace,
  isGoogleEmbedUrl,
  parseCoord,
  PROJECT_MAP_HEIGHT,
  resolveMapUrl,
  type MapCoords,
} from "../../lib/projectMap";
import { FloorLayoutsModal } from "./FloorLayoutsModal";
import { FullScreenLoader } from "../../ui/FullScreenLoader";
import { ProjectMapWebView } from "../../ui/ProjectMapWebView";
import { ProjectQrCard } from "../../ui/ProjectQrCard";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { useAppTheme } from "../../theme/AppThemeProvider";
import type { AppColors } from "../../theme/tokens";
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

function createDetailsStyles(c: AppColors) {
  return StyleSheet.create({
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
    mt: { marginTop: spacing.md },
    err: { color: c.error, fontWeight: "700", textAlign: "center" },
    heroWrap: { position: "relative", backgroundColor: "#000" },
    heroPh: {
      backgroundColor: c.fill,
      alignItems: "center",
      justifyContent: "center",
    },
    thumbStrip: {
      maxHeight: 72,
      backgroundColor: c.fill,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.separator,
    },
    thumbStripIn: { padding: spacing.sm, gap: spacing.sm },
    thumb: {
      width: 72,
      height: 52,
      borderRadius: radii.sm,
      marginRight: spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    thumbOn: { borderColor: c.brandSecondary },
    heroBadges: { position: "absolute", top: spacing.md, left: spacing.md, gap: 6 },
    hBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
    hPop: { backgroundColor: c.popular },
    hPlan: { backgroundColor: c.brandSecondary },
    hBadgeTxt: { color: c.onMedia, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
    body: { padding: spacing.lg, gap: spacing.md },
    h1: { fontWeight: "900", color: c.brand, letterSpacing: 0.2 },
    locRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
    loc: { flex: 1, fontWeight: "600", color: c.label },
    priceHero: { fontWeight: "700", color: c.label },
    priceHeroNum: { color: c.brand },
    priceCard: {
      backgroundColor: c.brandSecondary + "14",
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.brandSecondary + "33",
    },
    priceCardLbl: {
      fontSize: 11,
      fontWeight: "800",
      color: c.labelSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    priceCardNum: { fontSize: 22, fontWeight: "900", color: c.brandSecondary },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { backgroundColor: c.fill },
    metrics: { flexDirection: "row", gap: spacing.sm },
    metric: {
      flex: 1,
      backgroundColor: c.fill,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
    },
    metricLbl: {
      fontSize: 10,
      fontWeight: "800",
      color: c.labelSecondary,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    metricVal: { fontWeight: "800", color: c.brand, fontSize: 13 },
    accHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.bgElevated,
    },
    accTitle: { fontWeight: "800", color: c.brand, fontSize: 12, letterSpacing: 0.5 },
    accBody: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: c.fill,
      borderRadius: radii.md,
      gap: spacing.sm,
    },
    desc: { lineHeight: 22, color: c.label },
    advRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    advTxt: { flex: 1, fontWeight: "600", fontSize: 12, color: c.label },
    cta: { marginTop: spacing.sm, borderRadius: radii.lg },
    ctaIn: { paddingVertical: 8 },
    cta2: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radii.lg },
    section: { marginTop: spacing.md },
    specRow: {
      flexDirection: "row",
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.separator,
    },
    specTxt: { flex: 1 },
    specLbl: {
      fontSize: 11,
      fontWeight: "800",
      color: c.labelSecondary,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    specVal: { color: c.label },
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
    viewerBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    viewerWrap: {
      width: "100%",
      height: "80%",
      position: "relative",
    },
    viewerCard: {
      width: "100%",
      height: "100%",
      borderRadius: radii.xl,
      overflow: "hidden",
    },
    viewerClose: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 2,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    viewerImg: { width: "100%", height: "100%" },
    progressHint: { marginTop: spacing.md },
    devHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    devLogo: { width: 88, height: 40, flexShrink: 0 },
    devHeaderText: { flex: 1, minWidth: 0, gap: 4 },
    devHeaderTitle: { fontWeight: "800", letterSpacing: 0.2, color: c.label },
    devHeaderSub: { opacity: 0.75, color: c.label },
    devSub: { fontWeight: "800", marginBottom: 4, color: c.label },
    devDesc: { opacity: 0.85, color: c.label },
    divider: { marginVertical: spacing.md, backgroundColor: c.separator },
    linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
    linkTxt: { color: c.brand, fontWeight: "600", flex: 1 },
    addr: { marginTop: spacing.sm, opacity: 0.85, color: c.label },
    addrLbl: { fontWeight: "800", color: c.label },
    relatedBlock: { marginTop: spacing.lg },
    relatedRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
    relatedCard: {
      width: 160,
      backgroundColor: c.bgElevated,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      overflow: "hidden",
      paddingBottom: spacing.sm,
    },
    relatedImg: { width: "100%", height: 88, backgroundColor: c.fill },
    relatedPh: {},
    relatedName: {
      fontWeight: "800",
      paddingHorizontal: spacing.sm,
      marginTop: spacing.sm,
      minHeight: 36,
      color: c.label,
    },
    relatedPrice: { paddingHorizontal: spacing.sm, color: c.brand, fontWeight: "700" },
    floorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: c.fill,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
    },
    floorNum: { fontWeight: "900", fontSize: 16, color: c.label },
    floorPrice: { opacity: 0.8, color: c.label },
    muted: { opacity: 0.7, fontStyle: "italic", color: c.label },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexWrap: "wrap",
    },
    mapHint: { color: c.labelSecondary, marginBottom: spacing.sm },
    mapBox: {
      borderRadius: radii.lg,
      minHeight: PROJECT_MAP_HEIGHT,
      overflow: "hidden",
      alignSelf: "stretch",
      backgroundColor: c.fill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
    },
    mapLoading: {
      minHeight: PROJECT_MAP_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    mapActionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
    reviewHint: { color: c.labelSecondary, marginBottom: spacing.sm },
    reviewCard: {
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: c.fill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.separator,
      marginBottom: spacing.sm,
    },
    reviewStars: { flexDirection: "row", gap: 2, marginBottom: spacing.sm },
    reviewQuote: { color: c.label, fontStyle: "italic", lineHeight: 20 },
    mapBtn: { borderRadius: radii.lg, alignSelf: "flex-start" },
    mapBtnIn: Platform.select({
      ios: { paddingVertical: 6 },
      android: { paddingVertical: 8 },
      default: { paddingVertical: 6 },
    }),
  });
}

const RelatedStrip = memo(function RelatedStrip({
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
});

RelatedStrip.displayName = "RelatedStrip";

export function ProjectDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { t, locale } = useI18n();
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createDetailsStyles(c), [c]);
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
  const [progressPhoto, setProgressPhoto] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<MapCoords | null>(null);
  const [mapEmbed, setMapEmbed] = useState<string | null>(null);
  const [mapOpenLink, setMapOpenLink] = useState<string | null>(null);
  const [mapGeoLoading, setMapGeoLoading] = useState(false);
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

  useEffect(() => {
    if (!data) {
      setMapCoords(null);
      setMapEmbed(null);
      setMapOpenLink(null);
      setMapGeoLoading(false);
      return;
    }
    let cancelled = false;

    const reset = () => {
      setMapCoords(null);
      setMapEmbed(null);
    };

    const fromFields = (): boolean => {
      const lat = parseCoord(data.latitude);
      const lon = parseCoord(data.longitude);
      if (lat != null && lon != null) {
        reset();
        setMapCoords({ lat, lon });
        setMapGeoLoading(false);
        return true;
      }
      return false;
    };

    const placeQuery = [data.district, data.location].filter(Boolean).join(", ");

    const embedRaw = data.mapEmbedUrl?.trim();
    if (embedRaw) {
      // Приоритет — ссылка на Google-карту с бэкенда (точное место).
      setMapGeoLoading(true);
      setMapOpenLink(embedRaw);
      void (async () => {
        const finalUrl = await resolveMapUrl(embedRaw);
        if (cancelled) return;
        setMapOpenLink(finalUrl);
        const coords = extractCoordsFromGoogleUrl(finalUrl);
        if (coords) {
          reset();
          setMapCoords(coords);
          setMapGeoLoading(false);
          return;
        }
        if (isGoogleEmbedUrl(finalUrl)) {
          reset();
          setMapEmbed(finalUrl);
          setMapGeoLoading(false);
          return;
        }
        // Из ссылки координаты не достали — пробуем поля, затем геокодинг адреса.
        if (fromFields()) return;
        if (!placeQuery) {
          reset();
          setMapGeoLoading(false);
          return;
        }
        const hit = await geocodePlace(placeQuery);
        if (cancelled) return;
        reset();
        setMapCoords(hit);
        setMapGeoLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }

    setMapOpenLink(null);
    if (fromFields()) return;

    if (!placeQuery) {
      reset();
      setMapGeoLoading(false);
      return;
    }

    setMapGeoLoading(true);
    reset();
    void (async () => {
      const hit = await geocodePlace(placeQuery);
      if (!cancelled) {
        setMapCoords(hit);
        setMapGeoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    data?.id,
    data?.latitude,
    data?.longitude,
    data?.district,
    data?.location,
    data?.mapEmbedUrl,
  ]);

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

  const onGalleryScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      setActiveImg(Math.round(x / slideW));
    },
    [slideW],
  );

  const scrollGalleryTo = useCallback(
    (idx: number) => {
      galleryRef.current?.scrollToIndex({ index: idx, animated: true });
      setActiveImg(idx);
    },
    [],
  );

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  }, []);

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
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <FullScreenLoader message={t("common.loading")} />
      </View>
    );
  }

  if (notFound || !data) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <Text style={styles.err}>{t("projectDetails.notFound")}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={styles.mt}>
          {t("common.back")}
        </Button>
      </View>
    );
  }

  const place = [data.district, data.location].filter(Boolean).join(", ");
  const dev = data.developer;
  const showMapSection = Boolean(mapCoords || mapEmbed || mapGeoLoading || place);
  const mapOpenUrl = mapOpenLink
    ? mapOpenLink
    : mapCoords
      ? Platform.select({
          ios: `http://maps.apple.com/?q=${encodeURIComponent(data.name)}&ll=${mapCoords.lat},${mapCoords.lon}`,
          android: `geo:${mapCoords.lat},${mapCoords.lon}?q=${mapCoords.lat},${mapCoords.lon}(${encodeURIComponent(data.name)})`,
          default: `https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lon}`,
        })
      : place
        ? Platform.select({
            ios: `http://maps.apple.com/?q=${encodeURIComponent(place)}`,
            android: `geo:0,0?q=${encodeURIComponent(place)}`,
            default: `https://www.google.com/maps?q=${encodeURIComponent(place)}`,
          })
        : null;

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
        {...iosScrollInset}
        style={{ backgroundColor: c.bg }}
        contentContainerStyle={{
          paddingBottom: buyerTabBarBottomInset(insets.bottom),
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
                removeClippedSubviews={Platform.OS === "android"}
                initialNumToRender={1}
                windowSize={3}
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
              <MaterialCommunityIcons name="image-off-outline" size={48} color={c.labelSecondary} />
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
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={c.brandSecondary} />
            <Text variant="bodyLarge" style={styles.loc}>
              {place}
            </Text>
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceCardLbl}>
              {minM2 > 0 ? t("projectCard.fromPerM2") : t("common.price")}
            </Text>
            <Text style={styles.priceCardNum}>
              {minM2 > 0
                ? `${formatUzs(minM2, loc)} ${t("common.sum")}/${t("common.m2")}`
                : t("common.negotiablePrice")}
            </Text>
          </View>

          <View style={styles.chips}>
            {data.hasInstallment ? (
              <Chip compact style={styles.chip} textStyle={{ color: c.label }}>
                {t("projectCard.installment")}
              </Chip>
            ) : null}
            {data.badgeVerified ? (
              <Chip compact icon="shield-check" style={styles.chip} textStyle={{ color: c.label }}>
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
                      ? c.brandSecondary
                      : c.separator
                  }
                />
              ))}
              <Text style={{ color: c.label, fontWeight: "700", flex: 1, flexWrap: "wrap" }}>
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
                  color={c.brand}
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
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color={c.success} />
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
            buttonColor={c.brandSecondary}
            textColor={c.brandOn}
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>

          {data.qrCodeUrl?.trim() ? (
            <ProjectQrCard
              imageUrl={data.qrCodeUrl.trim()}
              shareUrl={`https://oson-uy.uz/projects/${data.id}`}
            />
          ) : null}

          <SectionCard style={styles.section}>
            <SectionTitle title={t("projectDetails.specsTitle")} />
            {specRows.map((row, i) => (
              <View key={`${row.label}-${i}`} style={styles.specRow}>
                <MaterialCommunityIcons name={row.icon} size={22} color={c.brand} />
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
              <View style={styles.devHeaderRow}>
                {dev.logoUrl ? (
                  <Image source={{ uri: dev.logoUrl }} style={styles.devLogo} resizeMode="contain" />
                ) : null}
                <View style={styles.devHeaderText}>
                  <Text variant="titleMedium" style={styles.devHeaderTitle}>
                    {t("projectDetails.developerTitle")}
                  </Text>
                  <Text variant="bodySmall" style={styles.devHeaderSub}>
                    {dev.name}
                  </Text>
                </View>
              </View>
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
                  <MaterialCommunityIcons name="phone-outline" size={20} color={c.brand} />
                  <Text style={styles.linkTxt}>{dev.phone}</Text>
                </Pressable>
              ) : null}
              {dev.email ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => void openLink(`mailto:${dev.email}`)}
                >
                  <MaterialCommunityIcons name="email-outline" size={20} color={c.brand} />
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
                  <MaterialCommunityIcons name="web" size={20} color={c.brand} />
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
                <Text style={[styles.progressPct, { color: c.label }]}>
                  {data.progress.percent != null ? `${data.progress.percent}%` : "—"}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: c.separator }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: c.brand,
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
                          color={m.done ? c.success : c.labelSecondary}
                        />
                        <Text style={[styles.progressTxt, { color: c.label }]}>{m.title}</Text>
                      </View>
                      {m.photoUrls?.length ? (
                        <FlatList
                          data={m.photoUrls.slice(0, 8)}
                          keyExtractor={(u, idx) => `${m.id}-${idx}-${u.slice(-18)}`}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.progressPhotos}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() => setProgressPhoto(item)}
                              hitSlop={8}
                            >
                              <Image
                                source={{ uri: item }}
                                style={[
                                  styles.progressPhoto,
                                  {
                                    borderColor: c.separator,
                                    backgroundColor: c.fill,
                                  },
                                ]}
                              />
                            </TouchableOpacity>
                          )}
                        />
                      ) : null}
                    </View>
                  ))}
              </View>
              <Text variant="bodySmall" style={[styles.progressHint, { color: c.labelSecondary }]}>
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

          {showMapSection ? (
            <View style={styles.section}>
              <SectionTitle title={t("projectDetails.mapTitle")} />
              <Text variant="bodySmall" style={styles.mapHint}>
                {t("projectDetails.mapHint")}
              </Text>
              <View style={styles.mapBox}>
                {mapGeoLoading ? (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator color={c.brand} />
                  </View>
                ) : mapCoords ? (
                  <ProjectMapWebView lat={mapCoords.lat} lon={mapCoords.lon} />
                ) : mapEmbed ? (
                  <ProjectMapWebView embedUrl={mapEmbed} />
                ) : null}
              </View>
              {mapOpenUrl ? (
                <View style={styles.mapActionsRow}>
                  <Button
                    mode="outlined"
                    style={styles.mapBtn}
                    contentStyle={styles.mapBtnIn as any}
                    onPress={() => void openLink(mapOpenUrl)}
                  >
                    {t("projectDetails.openMap")}
                  </Button>
                </View>
              ) : null}
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
                        color={s <= (rev.rating ?? 0) ? c.brandSecondary : c.separator}
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
                  <MaterialCommunityIcons name="chevron-right" size={22} color={c.labelSecondary} />
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
            buttonColor={c.brandSecondary}
            textColor={c.brandOn}
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>
        </View>
      </ScrollView>

      <Modal
        visible={progressPhoto != null}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => setProgressPhoto(null)}
      >
        <Pressable style={styles.viewerBg} onPress={() => setProgressPhoto(null)}>
          <View style={styles.viewerWrap} pointerEvents="box-none">
            <Pressable
              style={styles.viewerClose}
              onPress={() => setProgressPhoto(null)}
              accessibilityRole="button"
              accessibilityLabel={t("developer.close")}
            >
              <MaterialCommunityIcons name="close" size={26} color={c.onMedia} />
            </Pressable>
            <Pressable style={styles.viewerCard} onPress={() => {}}>
              {progressPhoto ? (
                <Image source={{ uri: progressPhoto }} style={styles.viewerImg} resizeMode="contain" />
              ) : null}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
