import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, View } from "react-native";
import { Card, FAB, IconButton, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
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

const THUMB = 76;

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
              <Text variant="titleMedium" style={[styles.devName, { color: p.primary }]}>
                {dev.name}
              </Text>
              <Text variant="bodySmall" style={[styles.hint, { color: p.textMuted }]}>
                {countText}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const uri = projectThumbUrl(item);
          return (
            <Card
              mode="elevated"
              style={[
                styles.card,
                { borderColor: p.outline, backgroundColor: p.surface },
              ]}
              elevation={2}
            >
              <View style={styles.cardRow}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPh, { backgroundColor: p.surfaceMuted }]}>
                    <MaterialCommunityIcons name="image-off-outline" size={28} color={p.textMuted} />
                  </View>
                )}
                <View style={styles.cardText}>
                  <Text variant="titleSmall" style={[styles.cardTitle, { color: p.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={[styles.sub, { color: p.textMuted }]} numberOfLines={2}>
                    {[item.district, item.location].filter(Boolean).join(", ")}
                  </Text>
                </View>
                <IconButton
                  icon="pencil-outline"
                  iconColor={p.primary}
                  onPress={() =>
                    navigation.navigate("DeveloperProjectEditor", {
                      projectId: item.id,
                    })
                  }
                />
                <IconButton
                  icon="progress-check"
                  iconColor={p.secondary}
                  onPress={() =>
                    navigation.navigate("DeveloperProjectProgress", {
                      projectId: item.id,
                    })
                  }
                />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={[styles.emptyTitle, { color: p.textMuted }]}>
              {error ?? t("developer.emptyProjects")}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: p.secondary }]}
        color="#FFFFFF"
        onPress={() => navigation.navigate("DeveloperProjectEditor", {})}
        label={t("developer.newProject")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.lg },
  devName: { fontWeight: "900" },
  hint: { marginTop: 4 },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
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
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: { fontWeight: "800" },
  sub: {},
  empty: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
  emptyTitle: { textAlign: "center" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: 18,
  },
});
