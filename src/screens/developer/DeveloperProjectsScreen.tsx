import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { FAB, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { DevCard } from "../../ui/developer/DevCard";
import { DevIconButton } from "../../ui/developer/DevIconButton";
import { devFabRadius, devListPadding } from "../../ui/developer/devPlatform";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import type { ApiMedia } from "../../types/project";

type ApiDeveloper = { id: number; name: string };
type ApiProject = {
  id: number;
  name: string;
  location: string;
  district?: string | null;
  developerId?: number;
  imageUrl?: string | null;
  media?: ApiMedia[];
};

const THUMB = Platform.select({ ios: 72, android: 76, default: 72 })!;

function projectThumbUrl(item: ApiProject): string | null {
  if (item.imageUrl) return item.imageUrl;
  const fromMedia = (item.media ?? []).map((m) => m.imageUrl).filter(Boolean);
  return fromMedia[0] ?? null;
}

export function DeveloperProjectsScreen() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const navigation = useNavigation<any>();
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [items, setItems] = useState<ApiProject[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const developer = await apiFetch<ApiDeveloper>("/developers");
    const projects = await apiFetch<ApiProject[]>("/projects");
    setDev(developer);
    setItems(projects.filter((proj) => proj.developerId === developer.id));
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : t("developer.loadError"));
      }
    })();
  }, [t]);

  const countText = useMemo(() => {
    const n = items.length;
    return n ? t("developer.projectsCount", { n }) : t("developer.emptyProjects");
  }, [items.length, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        ListHeaderComponent={
          dev ? (
            <View style={styles.header}>
              <Text variant="titleLarge" style={[styles.devName, { color: p.text }]}>
                {dev.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: p.textMuted }}>
                {countText}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const uri = projectThumbUrl(item);
          return (
            <DevCard style={styles.card} padded={false}>
              <View style={styles.cardRow}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPh, { backgroundColor: p.surfaceMuted }]}>
                    <MaterialCommunityIcons name="image-off-outline" size={26} color={p.textMuted} />
                  </View>
                )}
                <View style={styles.cardText}>
                  <Text variant="titleSmall" style={[styles.cardTitle, { color: p.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: p.textMuted }} numberOfLines={2}>
                    {[item.district, item.location].filter(Boolean).join(", ")}
                  </Text>
                </View>
                <View style={styles.iconCol}>
                  <DevIconButton
                    icon="pencil-outline"
                    variant="tonal"
                    accessibilityLabel={t("developer.edit")}
                    onPress={() =>
                      navigation.navigate("DeveloperProjectEditor", { projectId: item.id })
                    }
                  />
                  <DevIconButton
                    icon="progress-check"
                    variant="plain"
                    accessibilityLabel={t("developer.progressTitle")}
                    onPress={() =>
                      navigation.navigate("DeveloperProjectProgress", { projectId: item.id })
                    }
                  />
                </View>
              </View>
            </DevCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="office-building-outline" size={48} color={p.textMuted} />
            <Text variant="bodyLarge" style={[styles.emptyTitle, { color: p.textMuted }]}>
              {error ?? t("developer.emptyProjects")}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: p.primary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate("DeveloperProjectEditor", {})}
        label={t("developer.newProject")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: devListPadding, paddingBottom: spacing.xxl * 3 },
  header: { marginBottom: spacing.lg, gap: 4 },
  devName: { fontWeight: "800" },
  card: { marginBottom: spacing.md },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radii.md,
  },
  thumbPh: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: { fontWeight: "800" },
  iconCol: { gap: spacing.xs },
  empty: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTitle: { textAlign: "center" },
  fab: {
    position: "absolute",
    right: devListPadding,
    bottom: devListPadding,
    borderRadius: devFabRadius,
  },
});
