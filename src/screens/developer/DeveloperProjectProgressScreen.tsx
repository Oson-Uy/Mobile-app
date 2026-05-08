import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Divider, IconButton, Snackbar, Text, TextInput } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { apiFetch } from "../../api/client";
import { uploadImageAsset } from "../../dev/uploadImage";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

type RouteParams = { projectId: number };

type ApiMilestone = {
  id?: number;
  title: string;
  done: boolean;
  sortOrder: number;
  photoUrls?: string[];
};

/** Тело PATCH: без id — иначе 400 если API ещё не обновили. */
type MilestoneSaveBody = Pick<ApiMilestone, "title" | "done" | "sortOrder" | "photoUrls">;

type ApiProgress = {
  percent: number | null;
  total: number;
  done: number;
  milestones: ApiMilestone[];
};

const emptyRow = (sortOrder: number): ApiMilestone => ({
  title: "",
  done: false,
  sortOrder,
  photoUrls: [],
});

export function DeveloperProjectProgressScreen({ navigation }: any) {
  const { t } = useI18n();
  const { palette: p } = useAppTheme();
  const route = useRoute();
  const { projectId } = (route.params ?? {}) as RouteParams;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<ApiMilestone[]>([emptyRow(0)]);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: t("developer.progressTitle") });
  }, [navigation, t]);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const data = await apiFetch<ApiProgress>(`/projects/${projectId}/progress`);
      const sorted = (data.milestones ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setRows(sorted.length ? sorted.map((r, idx) => ({ ...r, sortOrder: idx })) : [emptyRow(0)]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const percent = useMemo(() => {
    const total = rows.filter((r) => r.title.trim()).length;
    const done = rows.filter((r) => r.title.trim() && r.done).length;
    return total ? Math.floor((done / total) * 100) : null;
  }, [rows]);

  const normalize = (r: ApiMilestone[]): MilestoneSaveBody[] =>
    r
      .slice()
      .map((x) => ({ ...x, title: x.title.trim() }))
      .filter((x) => Boolean(x.title))
      .map((x, idx) => ({
        title: x.title,
        done: x.done,
        sortOrder: idx,
        photoUrls: (x.photoUrls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 12),
      }));

  const addPhoto = async (idx: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSnack(t("developer.uploadError"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    try {
      setSnack(null);
      const url = await uploadImageAsset(res.assets[0]);
      setRows((prev) =>
        prev.map((m, i) =>
          i === idx ? { ...m, photoUrls: [...(m.photoUrls ?? []), url].slice(0, 12) } : m,
        ),
      );
      setSnack(t("developer.photoAdded"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.uploadError"));
    }
  };

  const removePhoto = (idx: number, url: string) => {
    setRows((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, photoUrls: (m.photoUrls ?? []).filter((u) => u !== url) } : m,
      ),
    );
  };

  const onSave = async () => {
    const milestones = normalize(rows);
    if (!milestones.length) {
      Alert.alert(t("common.error"), t("developer.needOneProgressPoint"));
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/projects/${projectId}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ milestones }),
      });
      setSnack(t("developer.saved"));
      await load();
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    setRows((prev) => {
      const next = prev.slice();
      const to = idx + dir;
      if (to < 0 || to >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[to];
      next[to] = tmp;
      return next.map((r, i) => ({ ...r, sortOrder: i }));
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(prev.length)]);

  const removeRow = (idx: number) =>
    setRows((prev) => {
      const next = prev.slice();
      next.splice(idx, 1);
      return (next.length ? next : [emptyRow(0)]).map((r, i) => ({ ...r, sortOrder: i }));
    });

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <FullScreenLoader message={t("common.loading")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionCard>
          <View style={styles.headRow}>
            <SectionTitle title={t("developer.progressTitle")} subtitle={t("developer.progressHint")} />
            <View style={styles.pctPill}>
              <MaterialCommunityIcons name="progress-check" size={18} color={p.primary} />
              <Text style={[styles.pctTxt, { color: p.text }]}>{percent != null ? `${percent}%` : "—"}</Text>
            </View>
          </View>

          {err ? <Text style={[styles.err, { color: p.error }]}>{err}</Text> : null}

          <Divider style={[styles.div, { backgroundColor: p.outline }]} />

          {rows.map((r, idx) => (
            <View key={idx}>
              <View style={styles.item}>
                <View style={styles.rowTop}>
                  <IconButton
                    icon={r.done ? "check-circle" : "checkbox-blank-circle-outline"}
                    iconColor={r.done ? p.success : p.textMuted}
                    onPress={() =>
                      setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, done: !x.done } : x)))
                    }
                  />
                  <TextInput
                    mode="outlined"
                    value={r.title}
                    onChangeText={(v) =>
                      setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)))
                    }
                    placeholder={t("developer.progressPointPlaceholder")}
                    dense={false}
                    contentStyle={styles.fieldContent}
                    style={styles.field}
                  />
                </View>

                <View style={styles.rowActions}>
                  <IconButton icon="chevron-up" iconColor={p.primary} onPress={() => move(idx, -1)} />
                  <IconButton icon="chevron-down" iconColor={p.primary} onPress={() => move(idx, 1)} />
                  <IconButton icon="camera-plus-outline" iconColor={p.primary} onPress={() => void addPhoto(idx)} />
                  <IconButton icon="trash-can-outline" iconColor={p.error} onPress={() => removeRow(idx)} />
                </View>
              </View>
              {r.photoUrls?.length ? (
                <FlatList
                  data={r.photoUrls}
                  keyExtractor={(u, i) => `${idx}-${i}-${u.slice(-18)}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoRow}
                  renderItem={({ item }) => (
                    <View style={styles.photoWrap}>
                      <TouchableOpacity activeOpacity={0.85} onPress={() => setPreview(item)} hitSlop={8}>
                        <Image
                          source={{ uri: item }}
                          style={[styles.photo, { borderColor: p.outline, backgroundColor: p.surfaceMuted }]}
                        />
                      </TouchableOpacity>
                      <IconButton
                        icon="close-circle"
                        size={18}
                        iconColor={p.error}
                        style={styles.photoRemove}
                        onPress={() => removePhoto(idx, item)}
                      />
                    </View>
                  )}
                />
              ) : null}
            </View>
          ))}

          <Button mode="outlined" onPress={addRow} style={styles.addBtn}>
            {t("developer.addProgressPoint")}
          </Button>

          <Button
            mode="contained"
            onPress={() => void onSave()}
            loading={saving}
            disabled={saving}
            buttonColor={p.secondary}
            textColor="#FFFFFF"
            style={styles.saveBtn}
          >
            {t("common.save")}
          </Button>
        </SectionCard>
      </ScrollView>
      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={2500}>
        {snack}
      </Snackbar>

      <Modal
        visible={preview != null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <Pressable style={styles.viewerBg} onPress={() => setPreview(null)}>
          <Pressable style={styles.viewerCard} onPress={() => {}}>
            {preview ? <Image source={{ uri: preview }} style={styles.viewerImg} resizeMode="contain" /> : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  pctPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#00000022",
  },
  pctTxt: { fontWeight: "900" },
  err: { marginTop: spacing.sm, fontWeight: "700" },
  div: { marginVertical: spacing.md },
  item: { marginBottom: spacing.sm },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 2,
    paddingLeft: 56,
  },
  photoRow: { paddingLeft: 56, paddingBottom: spacing.md, gap: 10 },
  photoWrap: { position: "relative" },
  photo: {
    width: 88,
    height: 64,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  photoRemove: {
    position: "absolute",
    top: -10,
    right: -10,
    margin: 0,
  },
  viewerBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  viewerCard: {
    width: "100%",
    height: "80%",
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  viewerImg: { width: "100%", height: "100%" },
  field: { flex: 1, backgroundColor: "transparent" },
  fieldContent: { minHeight: 48 },
  addBtn: { marginTop: spacing.sm, borderRadius: radii.lg },
  saveBtn: { marginTop: spacing.lg, borderRadius: radii.lg },
});

