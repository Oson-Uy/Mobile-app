import React, { useEffect, useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  Menu,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { formatMoneyInput, parseMoneyInput } from "../../lib/currency";
import { uploadImageAsset } from "../../dev/uploadImage";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type ApiProject = { id: number; name: string; developerId: number };
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

type RouteParams = { projectId: number; floorId?: number };

const emptyDraft = (projectId: number): FloorDraft => ({
  projectId,
  floor: "1",
  pricePerM2: "",
  title: "",
  areas: [""],
  layouts: [{ imageUrl: "", title: "" }],
});

export function DeveloperFloorEditorScreen({ navigation }: any) {
  const { t } = useI18n();
  const { palette: themePalette } = useAppTheme();
  const route = useRoute();
  const { projectId: paramProjectId, floorId } = (route.params ?? {}) as RouteParams;

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<FloorDraft>(emptyDraft(paramProjectId));
  const [editingId, setEditingId] = useState<number | null>(floorId ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = editingId ? t("developer.editFloor") : t("developer.newFloor");

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setErr(null);
        const developer = await apiFetch<{ id: number }>("/developers");
        const allProjects = await apiFetch<ApiProject[]>("/projects");
        const own = allProjects.filter((proj) => proj.developerId === developer.id);
        setProjects(own);

        const pid =
          paramProjectId && own.some((p) => p.id === paramProjectId)
            ? paramProjectId
            : own[0]?.id ?? 0;

        if (floorId) {
          const allFloors = await apiFetch<ApiFloor[]>("/floors");
          const f = allFloors.find((x) => x.id === floorId);
          if (f && own.some((p) => p.id === f.projectId)) {
            setEditingId(f.id);
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
          } else {
            setErr(t("developer.loadError"));
            setDraft(emptyDraft(pid));
            setEditingId(null);
          }
        } else {
          setEditingId(null);
          setDraft(emptyDraft(pid));
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("developer.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [floorId, paramProjectId, t]);

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

    const body: Record<string, unknown> = {
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
      navigation.goBack();
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={{ color: themePalette.text }}>{t("common.loading")}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionCard>
          <SectionTitle title={title} subtitle={t("developer.floorEditorHint")} />

          {err ? (
            <Text style={[styles.err, { color: themePalette.error }]}>{err}</Text>
          ) : null}

          <Text style={[styles.smallLabel, { color: themePalette.textMuted }]}>
            {t("developer.filterByProject")}
          </Text>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuOpen(true)} style={styles.field}>
                {projects.find((proj) => proj.id === draft.projectId)?.name ??
                  t("developer.chooseProject")}
              </Button>
            }
          >
            {projects.map((proj) => (
              <Menu.Item
                key={proj.id}
                onPress={() => {
                  setDraft((d) => ({ ...d, projectId: proj.id }));
                  setMenuOpen(false);
                }}
                title={proj.name}
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
          <Text style={[styles.smallLabel, { color: themePalette.textMuted }]}>
            {t("developer.areas")}
          </Text>
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
                textColor={themePalette.error}
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
            style={styles.field}
          >
            {t("developer.addArea")}
          </Button>

          <Divider style={styles.div} />
          <Text style={[styles.smallLabel, { color: themePalette.textMuted }]}>
            {t("developer.layouts")}
          </Text>
          {draft.layouts.map((l, idx) => (
            <SectionCard
              key={idx}
              style={[styles.layoutCard, { backgroundColor: themePalette.surfaceMuted }]}
              padded
            >
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
                  textColor={themePalette.error}
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
            style={styles.field}
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
            contentStyle={styles.saveBtnIn}
          >
            {t("developer.save")}
          </Button>
        </SectionCard>
      </ScrollView>
      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={3000}>
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  field: { marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  flex: { flex: 1 },
  div: { marginVertical: spacing.md },
  err: { marginBottom: spacing.md, fontWeight: "700" },
  smallLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  layoutCard: { marginBottom: spacing.md },
  saveBtn: { marginTop: spacing.sm, borderRadius: radii.lg },
  saveBtnIn: { paddingVertical: 6 },
});
