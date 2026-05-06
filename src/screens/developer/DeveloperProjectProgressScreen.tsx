import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, IconButton, Snackbar, Text, TextInput } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "../../api/client";
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
};

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

  const normalize = (r: ApiMilestone[]) =>
    r
      .slice()
      .map((x) => ({ ...x, title: x.title.trim() }))
      .filter((x) => Boolean(x.title))
      .map((x, idx) => ({ ...x, sortOrder: idx }));

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
            <View key={idx} style={styles.row}>
              <IconButton
                icon={r.done ? "check-circle" : "checkbox-blank-circle-outline"}
                iconColor={r.done ? p.success : p.textMuted}
                onPress={() => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, done: !x.done } : x)))}
              />
              <TextInput
                mode="outlined"
                value={r.title}
                onChangeText={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, title: v } : x)))}
                placeholder={t("developer.progressPointPlaceholder")}
                style={styles.field}
              />
              <View style={styles.actions}>
                <IconButton icon="chevron-up" iconColor={p.primary} onPress={() => move(idx, -1)} />
                <IconButton icon="chevron-down" iconColor={p.primary} onPress={() => move(idx, 1)} />
                <IconButton icon="trash-can-outline" iconColor={p.error} onPress={() => removeRow(idx)} />
              </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  field: { flex: 1, backgroundColor: "transparent" },
  actions: { flexDirection: "row", alignItems: "center" },
  addBtn: { marginTop: spacing.sm, borderRadius: radii.lg },
  saveBtn: { marginTop: spacing.lg, borderRadius: radii.lg },
});

