import React, { useCallback, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Divider,
  FAB,
  Snackbar,
  Text,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

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
  const { palette: p, mode } = useAppTheme();
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [floors, setFloors] = useState<ApiFloor[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

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

  const openProjectPicker = () => {
    if (!projects.length) return;
    if (Platform.OS === "ios") {
      const labels = projects.map((x) => x.name);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("developer.cancel"), ...labels],
          cancelButtonIndex: 0,
          title: t("developer.pickProjectTitle"),
          userInterfaceStyle: mode === "dark" ? "dark" : "light",
        },
        (idx) => {
          if (idx != null && idx > 0) setSelectedProjectId(projects[idx - 1]!.id);
        },
      );
    } else {
      setProjectPickerOpen(true);
    }
  };

  return (
    <Screen>
      <Modal
        visible={projectPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setProjectPickerOpen(false)}
      >
        <View style={styles.pickerRoot}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setProjectPickerOpen(false)} />
          <View style={[styles.pickerSheet, { backgroundColor: p.surface }]}>
            <Text variant="titleLarge" style={[styles.pickerTitle, { color: p.text }]}>
              {t("developer.pickProjectTitle")}
            </Text>
            <ScrollView
              style={styles.pickerList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {projects.map((proj) => {
                const sel = proj.id === selectedProjectId;
                return (
                  <Pressable
                    key={proj.id}
                    onPress={() => {
                      setSelectedProjectId(proj.id);
                      setProjectPickerOpen(false);
                    }}
                    style={[
                      styles.pickerRow,
                      { borderBottomColor: p.outline },
                      sel && { backgroundColor: p.surfaceMuted },
                    ]}
                  >
                    <Text style={[styles.pickerRowLabel, { color: p.text }]}>{proj.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              <Button
                mode="outlined"
                icon="chevron-down"
                onPress={openProjectPicker}
                style={styles.filterBtn}
                contentStyle={styles.filterBtnContent}
              >
                {t("developer.filterByProject")}: {selectedProjectName}
              </Button>
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
              <FullScreenLoader compact message={t("common.loading")} />
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
  pickerRoot: { flex: 1, justifyContent: "flex-end" },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  pickerSheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: "72%",
  },
  pickerTitle: { fontWeight: "800", paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  pickerList: { maxHeight: 420 },
  pickerRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  pickerRowLabel: { fontSize: 17, paddingVertical: 12, paddingHorizontal: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 3 },
  head: { fontWeight: "900" },
  filterBtn: { marginTop: spacing.sm, alignSelf: "stretch" },
  filterBtnContent: { flexWrap: "wrap", justifyContent: "flex-start" },
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
