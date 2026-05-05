import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiFloor, ApiProjectFull, ApiProjectPreview } from "../../types/project";
import { minPricePerM2FromApiProject } from "../../lib/project-price";
import { formatUzs } from "../../lib/currency";
import { FloorLayoutsModal } from "./FloorLayoutsModal";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { palette, radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "ProjectDetails">;

const localeFor = (l: string) =>
  l === "uz" ? "uz-UZ" : l === "en" ? "en-US" : "ru-RU";

type SpecRow = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value: string;
};

function RelatedStrip({
  title,
  projects,
  onSelect,
  t,
  loc,
}: {
  title: string;
  projects: ApiProjectPreview[];
  onSelect: (id: number) => void;
  t: (k: string, v?: Record<string, string | number>) => string;
  loc: string;
}) {
  if (!projects?.length) return null;
  return (
    <View style={styles.relatedBlock}>
      <SectionTitle title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.relatedRow}>
          {projects.map((p) => (
            <Pressable
              key={p.id}
              style={styles.relatedCard}
              onPress={() => onSelect(p.id)}
            >
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={styles.relatedImg} />
              ) : (
                <View style={[styles.relatedImg, styles.relatedPh]} />
              )}
              <Text variant="labelLarge" numberOfLines={2} style={styles.relatedName}>
                {p.name}
              </Text>
              {p.priceFrom != null && p.priceFrom > 0 ? (
                <Text variant="labelSmall" style={styles.relatedPrice}>
                  {t("projectDetails.priceFromShort")}{" "}
                  {formatUzs(p.priceFrom, loc)} {t("common.sum")}/{t("common.m2")}
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
        <ActivityIndicator size="large" />
        <Text style={styles.mt}>{t("common.loading")}</Text>
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
              <MaterialCommunityIcons name="image-off-outline" size={48} color={palette.textMuted} />
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
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={palette.secondary} />
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
              <Chip compact style={styles.chip}>{t("projectCard.installment")}</Chip>
            ) : null}
            {data.badgeVerified ? (
              <Chip compact icon="shield-check" style={styles.chip}>
                {t("projectCard.verifiedDeveloper")}
              </Chip>
            ) : null}
          </View>

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
                  color={palette.primary}
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
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color={palette.success} />
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
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>

          <SectionCard style={styles.section}>
            <SectionTitle title={t("projectDetails.specsTitle")} />
            {specRows.map((row, i) => (
              <View key={`${row.label}-${i}`} style={styles.specRow}>
                <MaterialCommunityIcons name={row.icon} size={22} color={palette.primary} />
                <View style={styles.specTxt}>
                  <Text style={styles.specLbl}>{row.label}</Text>
                  <Text variant="bodyMedium">{row.value}</Text>
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
                  <MaterialCommunityIcons name="phone-outline" size={20} color={palette.primary} />
                  <Text style={styles.linkTxt}>{dev.phone}</Text>
                </Pressable>
              ) : null}
              {dev.email ? (
                <Pressable
                  style={styles.linkRow}
                  onPress={() => void openLink(`mailto:${dev.email}`)}
                >
                  <MaterialCommunityIcons name="email-outline" size={20} color={palette.primary} />
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
                  <MaterialCommunityIcons name="web" size={20} color={palette.primary} />
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

          <RelatedStrip
            title={t("projectDetails.siblingsTitle")}
            projects={data.siblingProjects ?? []}
            onSelect={(pid) => navigation.push("ProjectDetails", { id: pid })}
            t={t}
            loc={loc}
          />
          <RelatedStrip
            title={t("projectDetails.nearbyTitle")}
            projects={data.nearbyProjects ?? []}
            onSelect={(pid) => navigation.push("ProjectDetails", { id: pid })}
            t={t}
            loc={loc}
          />

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
                  <MaterialCommunityIcons name="chevron-right" size={22} color={palette.textMuted} />
                </Pressable>
              ))
            ) : (
              <Text style={styles.muted}>{t("projectDetails.floorNotPublished")}</Text>
            )}
          </SectionCard>

          <Button
            mode="contained-tonal"
            style={styles.cta2}
            onPress={() => goLead()}
          >
            {t("projectDetails.leaveRequest")}
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  mt: { marginTop: spacing.md },
  err: { color: palette.error, fontWeight: "700", textAlign: "center" },
  heroWrap: { position: "relative", backgroundColor: "#000" },
  heroPh: {
    backgroundColor: palette.surfaceMuted,
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
  thumbOn: { borderColor: palette.secondary },
  heroBadges: { position: "absolute", top: spacing.md, left: spacing.md, gap: 6 },
  hBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  hPop: { backgroundColor: palette.popular },
  hPlan: { backgroundColor: palette.secondary },
  hBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  body: { padding: spacing.lg, gap: spacing.md },
  h1: { fontWeight: "900", color: palette.primary, letterSpacing: 0.2 },
  locRow: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  loc: { flex: 1, fontWeight: "600" },
  priceHero: { fontWeight: "700" },
  priceHeroNum: { color: palette.primary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: palette.surfaceMuted },
  metrics: { flexDirection: "row", gap: spacing.sm },
  metric: {
    flex: 1,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: "800",
    color: palette.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metricVal: { fontWeight: "800", color: palette.primary, fontSize: 13 },
  accHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surface,
  },
  accTitle: { fontWeight: "800", color: palette.primary, fontSize: 12, letterSpacing: 0.5 },
  accBody: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  desc: { lineHeight: 22 },
  advRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  advTxt: { flex: 1, fontWeight: "600", fontSize: 12 },
  cta: { marginTop: spacing.sm, borderRadius: radii.lg },
  ctaIn: { paddingVertical: 8 },
  cta2: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radii.lg },
  section: { marginTop: spacing.md },
  specRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.outline,
  },
  specTxt: { flex: 1 },
  specLbl: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  logo: { width: 120, height: 48, marginBottom: spacing.sm },
  devSub: { fontWeight: "800", marginBottom: 4 },
  devDesc: { opacity: 0.85 },
  divider: { marginVertical: spacing.md },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8 },
  linkTxt: { color: palette.primary, fontWeight: "600", flex: 1 },
  addr: { marginTop: spacing.sm, opacity: 0.85 },
  addrLbl: { fontWeight: "800" },
  relatedBlock: { marginTop: spacing.lg },
  relatedRow: { flexDirection: "row", gap: spacing.md, paddingVertical: spacing.sm },
  relatedCard: {
    width: 160,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
    overflow: "hidden",
    paddingBottom: spacing.sm,
  },
  relatedImg: { width: "100%", height: 88, backgroundColor: palette.surfaceMuted },
  relatedPh: {},
  relatedName: { fontWeight: "800", paddingHorizontal: spacing.sm, marginTop: spacing.sm, minHeight: 36 },
  relatedPrice: { paddingHorizontal: spacing.sm, color: palette.primary, fontWeight: "700" },
  floorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
  },
  floorNum: { fontWeight: "900", fontSize: 16 },
  floorPrice: { opacity: 0.8 },
  muted: { opacity: 0.7, fontStyle: "italic" },
});
