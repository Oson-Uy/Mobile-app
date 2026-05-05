import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Divider,
  FAB,
  Menu,
  Snackbar,
  Text,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { spacing } from "../../theme/tokens";

type ApiProject = { id: number; name: string; developerId: number };
type ApiDeveloper = { id: number };
type ApiFloor = {
  id: number;
  projectId: number;
  floor: number;
  pricePerM2: number;
  title?: string | null;
  areaOptions?: { areaSqm: number; sortOrder?: number }[];
  layouts?: { imageUrl: string; title?: string | null; sortOrder?: number }[];
};

export function DeveloperFloorsScreen() {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [floors, setFloors] = useState<ApiFloor[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const [developer, allProjects, allFloors] = await Promise.all([
      apiFetch<ApiDeveloper>("/developers"),
      apiFetch<ApiProject[]>("/projects"),
      apiFetch<ApiFloor[]>("/floors"),
    ]);
    const own = allProjects.filter((proj) => proj.developerId === developer.id);
    const ownIds = new Set(own.map((proj) => proj.id));
    const ownFloors = allFloors
      .filter((f) => ownIds.has(f.projectId))
      .map((f) => ({
        ...f,
        areaOptions: f.areaOptions ?? [],
        layouts: f.layouts ?? [],
      }));
    setProjects(own);
    setFloors(ownFloors);
    setSelectedProjectId((prev) => {
      if (!own.length) return 0;
      if (prev && own.some((x) => x.id === prev)) return prev;
      return own[0]!.id;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          setLoading(true);
          await load();
        } catch (e) {
          setError(e instanceof Error ? e.message : t("developer.loadError"));
        } finally {
          setLoading(false);
        }
      })();
    }, [load, t]),
  );

  const floorsView = useMemo(() => {
    if (!selectedProjectId) return [];
    return floors
      .filter((f) => f.projectId === selectedProjectId)
      .sort((a, b) => b.floor - a.floor);
  }, [floors, selectedProjectId]);

  const openCreate = () => {
    const pid = selectedProjectId || projects[0]?.id || 0;
    if (!pid) {
      setSnack(t("developer.emptyProjects"));
      return;
    }
    navigation.navigate("DeveloperFloorEditor", { projectId: pid });
  };

  const openEdit = (item: ApiFloor) => {
    navigation.navigate("DeveloperFloorEditor", {
      projectId: item.projectId,
      floorId: item.id,
    });
  };

  const remove = async (id: number) => {
    Alert.alert(
      t("developer.delete"),
      t("developer.confirmDelete"),
      [
        { text: t("developer.cancel"), style: "cancel" as const },
        {
          text: t("developer.delete"),
          style: "destructive" as const,
          onPress: () => {
            void (async () => {
              try {
                await apiFetch(`/floors/${id}`, { method: "DELETE" });
                await load();
              } catch (e) {
                setSnack(e instanceof Error ? e.message : t("developer.loadError"));
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  };

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

  const selectedProjectName =
    projects.find((x) => x.id === selectedProjectId)?.name ?? t("developer.chooseProject");

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={floorsView}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="titleMedium" style={[styles.head, { color: p.primary }]}>
              {t("developer.floors")}
            </Text>
            {projects.length > 0 ? (
              <Menu
                visible={filterMenuOpen}
                onDismiss={() => setFilterMenuOpen(false)}
                anchor={
                  <Button
                    mode="outlined"
                    icon="chevron-down"
                    onPress={() => setFilterMenuOpen(true)}
                    style={styles.filterBtn}
                  >
                    {t("developer.filterByProject")}: {selectedProjectName}
                  </Button>
                }
              >
                {projects.map((proj) => (
                  <Menu.Item
                    key={proj.id}
                    onPress={() => {
                      setSelectedProjectId(proj.id);
                      setFilterMenuOpen(false);
                    }}
                    title={proj.name}
                  />
                ))}
              </Menu>
            ) : null}
            {error ? <Text style={[styles.err, { color: p.error }]}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <SectionCard style={styles.floorCard} padded>
            <View style={styles.floorTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.floorTitle, { color: p.primary }]}>
                  {t("developer.floorLabel", { n: item.floor })}
                </Text>
                <Text variant="bodySmall" style={[styles.muted, { color: p.textMuted }]}>
                  {projects.find((proj) => proj.id === item.projectId)?.name ?? "—"}
                </Text>
                <Text style={[styles.muted, { color: p.text }]}>
                  {t("developer.pricePerM2")}: {item.pricePerM2}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button compact mode="text" onPress={() => openEdit(item)}>
                  {t("developer.edit")}
                </Button>
                <Button compact mode="text" textColor={p.error} onPress={() => void remove(item.id)}>
                  {t("developer.delete")}
                </Button>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            <Text variant="bodySmall" style={[styles.muted, { color: p.textMuted }]}>
              {t("developer.areas")}:{" "}
              {(item.areaOptions ?? [])
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((a) => a.areaSqm)
                .join(", ") || "—"}
            </Text>
            <Text variant="bodySmall" style={[styles.muted, { color: p.textMuted }]}>
              {t("developer.layouts")}: {(item.layouts ?? []).length}
            </Text>
          </SectionCard>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text style={{ color: p.text }}>{t("common.loading")}</Text>
            </View>
          ) : projects.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.muted, { color: p.textMuted }]}>{t("developer.emptyProjects")}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.muted, { color: p.textMuted }]}>
                {t("developer.noFloorsForProject")}
              </Text>
            </View>
          )
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: p.secondary }]}
        color="#FFFFFF"
        onPress={openCreate}
        label={t("developer.newFloor")}
      />
      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={3000}>
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 3 },
  head: { fontWeight: "900" },
  filterBtn: { marginTop: spacing.sm, alignSelf: "stretch" },
  err: { marginTop: 6 },
  empty: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    borderRadius: 18,
  },
  floorCard: { marginBottom: spacing.md },
  floorTop: { flexDirection: "row", gap: spacing.md },
  floorTitle: { fontWeight: "900", fontSize: 16 },
  muted: {},
  actions: { justifyContent: "center" },
});
