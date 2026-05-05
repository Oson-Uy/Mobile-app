import React, { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Card, FAB, IconButton, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { palette, radii, spacing } from "../../theme/tokens";

type ApiDeveloper = { id: number; name: string };
type ApiProject = {
  id: number;
  name: string;
  location: string;
  district?: string | null;
  developerId?: number;
};

export function DeveloperProjectsScreen() {
  const { t } = useI18n();
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
    setItems(projects.filter((p) => p.developerId === developer.id));
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
              <Text variant="titleMedium" style={styles.devName}>
                {dev.name}
              </Text>
              <Text variant="bodySmall" style={styles.hint}>
                {countText}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card mode="elevated" style={styles.card} elevation={2}>
            <Card.Title
              title={item.name}
              titleStyle={styles.cardTitle}
              subtitle={[item.district, item.location].filter(Boolean).join(", ")}
              subtitleStyle={styles.sub}
              right={() => (
                <IconButton
                  icon="pencil-outline"
                  onPress={() =>
                    navigation.navigate("DeveloperProjectEditor", {
                      projectId: item.id,
                    })
                  }
                />
              )}
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyTitle}>
              {error ?? t("developer.emptyProjects")}
            </Text>
          </View>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("DeveloperProjectEditor", {})}
        label={t("developer.newProject")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.lg },
  devName: { fontWeight: "900", color: palette.primary },
  hint: { opacity: 0.65, marginTop: 4 },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.card,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
  },
  cardTitle: { fontWeight: "800" },
  sub: { opacity: 0.75 },
  empty: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
  emptyTitle: { textAlign: "center", opacity: 0.8 },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: palette.secondary,
    borderRadius: 18,
  },
});
