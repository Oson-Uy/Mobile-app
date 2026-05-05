import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Divider,
  FAB,
  Menu,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { formatMoneyInput, parseMoneyInput } from "../../lib/currency";
import { uploadImageAsset } from "../../dev/uploadImage";
import { palette, radii, spacing } from "../../theme/tokens";

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

type FloorDraft = {
  projectId: number;
  floor: string;
  pricePerM2: string;
  title: string;
  areas: string[];
  layouts: { imageUrl: string; title: string }[];
};

const emptyDraft = (projectId: number): FloorDraft => ({
  projectId,
  floor: "1",
  pricePerM2: "",
  title: "",
  areas: [""],
  layouts: [{ imageUrl: "", title: "" }],
});

export function DeveloperFloorsScreen() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [floors, setFloors] = useState<ApiFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FloorDraft>(emptyDraft(0));
  const [snack, setSnack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = async () => {
    setError(null);
    const [developer, allProjects, allFloors] = await Promise.all([
      apiFetch<ApiDeveloper>("/developers"),
      apiFetch<ApiProject[]>("/projects"),
      apiFetch<ApiFloor[]>("/floors"),
    ]);
    const own = allProjects.filter((p) => p.developerId === developer.id);
    const ownIds = new Set(own.map((p) => p.id));
    const ownFloors = allFloors
      .filter((f) => ownIds.has(f.projectId))
      .map((f) => ({
        ...f,
        areaOptions: f.areaOptions ?? [],
        layouts: f.layouts ?? [],
      }));
    setProjects(own);
    setFloors(ownFloors);
    if (!draft.projectId && own[0]?.id) setDraft((d) => ({ ...d, projectId: own[0].id }));
  };

  useEffect(() => {
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
  }, []);

  const floorsView = useMemo(() => {
    return [...floors].sort((a, b) => b.floor - a.floor);
  }, [floors]);

  const openCreate = () => {
    const pid = draft.projectId || projects[0]?.id || 0;
    setDraft(emptyDraft(pid));
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (f: ApiFloor) => {
    setDraft({
      projectId: f.projectId,
      floor: String(f.floor),
      pricePerM2: formatMoneyInput(String(Math.round(f.pricePerM2 || 0))),
      title: f.title ?? "",
      areas:
        (f.areaOptions ?? [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((a) => String(a.areaSqm)) || [""],
      layouts:
        (f.layouts ?? [])
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((l) => ({ imageUrl: l.imageUrl, title: l.title ?? "" })) || [
          { imageUrl: "", title: "" },
        ],
    });
    setEditingId(f.id);
    setEditorOpen(true);
  };

  const pickLayoutImage = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack(t("developer.mediaPermission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      const url = await uploadImageAsset(res.assets[0]);
      setDraft((d) => {
        const layouts = [...d.layouts];
        layouts[index] = { ...layouts[index], imageUrl: url };
        return { ...d, layouts };
      });
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.uploadError"));
    }
  };

  const save = async () => {
    const areaOptions = draft.areas
      .map((s) => Number(String(s).replace(",", ".")))
      .filter((n) => n > 0)
      .map((areaSqm, i) => ({ areaSqm, sortOrder: i }));
    if (!areaOptions.length) {
      setSnack(t("developer.needOneArea"));
      return;
    }
    const layouts = draft.layouts
      .filter((l) => l.imageUrl.trim())
      .map((l, i) => ({
        imageUrl: l.imageUrl.trim(),
        title: l.title.trim() || undefined,
        sortOrder: i,
      }));

    const body: any = {
      projectId: draft.projectId,
      floor: Number(draft.floor),
      pricePerM2: parseMoneyInput(draft.pricePerM2),
      title: draft.title.trim() || undefined,
      areaOptions,
    };
    if (layouts.length) body.layouts = layouts;

    try {
      setSaving(true);
      if (editingId) {
        await apiFetch(`/floors/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/floors`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setSnack(t("developer.saved"));
      setEditorOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setSaving(false);
    }
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

  return (
    <Screen>
      <Portal>
        <Modal
          visible={editorOpen}
          onDismiss={() => setEditorOpen(false)}
          contentContainerStyle={styles.modal}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.lg }}
          >
            <SectionTitle
              title={editingId ? t("developer.editFloor") : t("developer.newFloor")}
              subtitle={t("developer.floorEditorHint")}
            />

            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={
                <Button mode="outlined" onPress={() => setMenuOpen(true)}>
                  {projects.find((p) => p.id === draft.projectId)?.name ??
                    t("developer.chooseProject")}
                </Button>
              }
            >
              {projects.map((p) => (
                <Menu.Item
                  key={p.id}
                  onPress={() => {
                    setDraft((d) => ({ ...d, projectId: p.id }));
                    setMenuOpen(false);
                  }}
                  title={p.name}
                />
              ))}
            </Menu>

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label={t("developer.floor")}
                value={draft.floor}
                onChangeText={(v) =>
                  setDraft((d) => ({ ...d, floor: v.replace(/[^\d]/g, "") }))
                }
                keyboardType="number-pad"
                style={[styles.flex, styles.field]}
              />
              <TextInput
                mode="outlined"
                label={t("developer.pricePerM2")}
                value={draft.pricePerM2}
                onChangeText={(v) =>
                  setDraft((d) => ({ ...d, pricePerM2: formatMoneyInput(v) }))
                }
                keyboardType="number-pad"
                style={[styles.flex, styles.field]}
              />
            </View>
            <TextInput
              mode="outlined"
              label={t("developer.titleOptional")}
              value={draft.title}
              onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
              style={styles.field}
            />

            <Divider style={styles.div} />
            <Text style={styles.small}>{t("developer.areas")}</Text>
            {draft.areas.map((a, idx) => (
              <View key={idx} style={styles.row}>
                <TextInput
                  mode="outlined"
                  value={a}
                  onChangeText={(v) =>
                    setDraft((d) => {
                      const areas = [...d.areas];
                      areas[idx] = v.replace(/[^\d.,]/g, "");
                      return { ...d, areas };
                    })
                  }
                  style={[styles.flex, styles.field]}
                  keyboardType="decimal-pad"
                />
                <Button
                  mode="text"
                  textColor={palette.error}
                  onPress={() =>
                    setDraft((d) => ({
                      ...d,
                      areas: d.areas.length > 1 ? d.areas.filter((_, i) => i !== idx) : d.areas,
                    }))
                  }
                >
                  {t("developer.remove")}
                </Button>
              </View>
            ))}
            <Button
              mode="outlined"
              onPress={() => setDraft((d) => ({ ...d, areas: [...d.areas, ""] }))}
            >
              {t("developer.addArea")}
            </Button>

            <Divider style={styles.div} />
            <Text style={styles.small}>{t("developer.layouts")}</Text>
            {draft.layouts.map((l, idx) => (
              <SectionCard key={idx} style={styles.layoutCard} padded>
                <TextInput
                  mode="outlined"
                  label={t("developer.layoutUrl")}
                  value={l.imageUrl}
                  onChangeText={(v) =>
                    setDraft((d) => {
                      const layouts = [...d.layouts];
                      layouts[idx] = { ...layouts[idx], imageUrl: v };
                      return { ...d, layouts };
                    })
                  }
                  style={styles.field}
                />
                <TextInput
                  mode="outlined"
                  label={t("developer.layoutTitle")}
                  value={l.title}
                  onChangeText={(v) =>
                    setDraft((d) => {
                      const layouts = [...d.layouts];
                      layouts[idx] = { ...layouts[idx], title: v };
                      return { ...d, layouts };
                    })
                  }
                  style={styles.field}
                />
                <View style={styles.row}>
                  <Button mode="contained-tonal" onPress={() => void pickLayoutImage(idx)}>
                    {t("developer.upload")}
                  </Button>
                  <Button
                    mode="text"
                    textColor={palette.error}
                    onPress={() =>
                      setDraft((d) => ({
                        ...d,
                        layouts:
                          d.layouts.length > 1
                            ? d.layouts.filter((_, i) => i !== idx)
                            : d.layouts,
                      }))
                    }
                  >
                    {t("developer.remove")}
                  </Button>
                </View>
              </SectionCard>
            ))}
            <Button
              mode="outlined"
              onPress={() =>
                setDraft((d) => ({
                  ...d,
                  layouts: [...d.layouts, { imageUrl: "", title: "" }],
                }))
              }
            >
              {t("developer.addLayout")}
            </Button>

            <Divider style={styles.div} />
            <Button
              mode="contained"
              loading={saving}
              disabled={saving || !draft.projectId}
              onPress={() => void save()}
              style={styles.saveBtn}
            >
              {t("developer.save")}
            </Button>
          </ScrollView>
        </Modal>
      </Portal>

      <FlatList
        contentContainerStyle={styles.list}
        data={floorsView}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="titleMedium" style={styles.head}>
              {t("developer.floors")}
            </Text>
            {error ? <Text style={styles.err}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <SectionCard style={styles.floorCard} padded>
            <View style={styles.floorTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.floorTitle}>
                  {t("developer.floorLabel", { n: item.floor })}
                </Text>
                <Text variant="bodySmall" style={styles.muted}>
                  {projects.find((p) => p.id === item.projectId)?.name ?? "—"}
                </Text>
                <Text style={styles.muted}>
                  {t("developer.pricePerM2")}: {item.pricePerM2}
                </Text>
              </View>
              <View style={styles.actions}>
                <Button compact mode="text" onPress={() => openEdit(item)}>
                  {t("developer.edit")}
                </Button>
                <Button compact mode="text" textColor={palette.error} onPress={() => void remove(item.id)}>
                  {t("developer.delete")}
                </Button>
              </View>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            <Text variant="bodySmall" style={styles.muted}>
              {t("developer.areas")}:{" "}
              {(item.areaOptions ?? [])
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((a) => a.areaSqm)
                .join(", ") || "—"}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {t("developer.layouts")}: {(item.layouts ?? []).length}
            </Text>
          </SectionCard>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <Text>{t("common.loading")}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.muted}>{t("developer.emptyFloors")}</Text>
            </View>
          )
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
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
  head: { fontWeight: "900", color: palette.primary },
  err: { color: palette.error, marginTop: 6 },
  empty: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: palette.secondary,
    borderRadius: 18,
  },
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.lg,
    marginVertical: 42,
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  flex: { flex: 1 },
  field: { marginBottom: spacing.md },
  div: { marginVertical: spacing.md },
  small: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.textMuted,
    marginBottom: 8,
  },
  layoutCard: { marginBottom: spacing.md, backgroundColor: palette.surfaceMuted },
  saveBtn: { borderRadius: radii.lg, marginTop: spacing.sm },
  floorCard: { marginBottom: spacing.md },
  floorTop: { flexDirection: "row", gap: spacing.md },
  floorTitle: { fontWeight: "900", fontSize: 16, color: palette.primary },
  muted: { opacity: 0.75 },
  actions: { justifyContent: "center" },
});

