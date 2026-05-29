import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { DevCard } from "../../ui/developer/DevCard";
import { DevIconAction } from "../../ui/developer/DevIconButton";
import { ProjectFilterChips } from "../../ui/developer/ProjectFilterChips";
import { devListPadding, devPillHeight, devSearchHeight } from "../../ui/developer/devPlatform";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type LeadStatus = "NEW" | "CONTACTED";
type ApiLead = {
  id: number;
  name: string;
  phone: string;
  status: LeadStatus;
  createdAt: string;
  project?: { id: number; name: string } | null;
  floor?: { id: number; floor: number } | null;
};

export function DeveloperLeadsScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const { palette: p, mode } = useAppTheme();
  const [items, setItems] = useState<ApiLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [projectFilterId, setProjectFilterId] = useState<number | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [busyFeedbackId, setBusyFeedbackId] = useState<number | null>(null);
  const [feedbackLink, setFeedbackLink] = useState<string | null>(null);

  const chipNewBg = mode === "dark" ? "rgba(251,191,36,0.22)" : "#FEF3C7";
  const chipNewFg = mode === "dark" ? "#FCD34D" : "#92400E";
  const chipDoneBg = mode === "dark" ? "rgba(52,211,153,0.18)" : "#DCFCE7";
  const chipDoneFg = mode === "dark" ? "#6EE7B7" : "#166534";

  const load = async () => {
    const leads = await apiFetch<ApiLead[]>("/leads");
    setItems(leads);
  };

  useEffect(() => {
    void load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const markContacted = async (id: number) => {
    await apiFetch(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CONTACTED" }),
    });
    await load();
  };

  const projectOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const l of items) {
      if (l.project?.id) map.set(l.project.id, l.project.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const scopedItems = useMemo(() => {
    if (projectFilterId == null) return items;
    return items.filter((l) => l.project?.id === projectFilterId);
  }, [items, projectFilterId]);

  const stats = useMemo(() => {
    return {
      total: scopedItems.length,
      newCount: scopedItems.filter((x) => x.status === "NEW").length,
      contacted: scopedItems.filter((x) => x.status === "CONTACTED").length,
    };
  }, [scopedItems]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scopedItems;
    return scopedItems.filter((l) => {
      const hay = [
        l.name,
        l.phone,
        l.project?.name ?? "",
        l.floor?.floor != null ? String(l.floor.floor) : "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [scopedItems, query]);

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setSnack(t("developer.copied"));
  };

  const callPhone = async (digits: string) => {
    try {
      await Linking.openURL(`tel:${digits}`);
    } catch {
      setSnack(t("developer.callError"));
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const createFeedbackLink = async (id: number) => {
    try {
      setBusyFeedbackId(id);
      const res = await apiFetch<{ feedbackUrl: string }>(`/leads/${id}/feedback-request`, {
        method: "POST",
      });
      setFeedbackLink(res.feedbackUrl);
      setSnack(t("developer.feedbackLinkReady"));
    } catch (e) {
      setSnack(e instanceof Error ? e.message : t("developer.loadError"));
    } finally {
      setBusyFeedbackId(null);
    }
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              mode="outlined"
              placeholder={t("developer.search")}
              value={query}
              onChangeText={setQuery}
              left={<TextInput.Icon icon="magnify" />}
              textColor={theme.colors.onSurface}
              style={styles.search}
              outlineStyle={styles.searchOutline}
            />
            {projectOptions.length > 0 ? (
              <View>
                <Text variant="labelMedium" style={[styles.filterLabel, { color: p.textMuted }]}>
                  {t("developer.filterByProject")}
                </Text>
                <ProjectFilterChips
                  projects={projectOptions}
                  selectedId={projectFilterId}
                  onSelect={setProjectFilterId}
                  allLabel={t("developer.allProjects")}
                />
              </View>
            ) : null}
            <View style={styles.statsRow}>
              <StatPill label={t("developer.statsAll")} value={stats.total} bg={p.surfaceMuted} fg={p.text} />
              <StatPill
                label={t("developer.statsNew")}
                value={stats.newCount}
                bg={chipNewBg}
                fg={chipNewFg}
              />
              <StatPill
                label={t("developer.statsContacted")}
                value={stats.contacted}
                bg={chipDoneBg}
                fg={chipDoneFg}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isNew = item.status === "NEW";
          const feedbackBusy = busyFeedbackId === item.id;
          return (
            <DevCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text variant="titleMedium" style={[styles.cardTitle, { color: p.text }]}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: p.textMuted }} numberOfLines={2}>
                    {(item.project?.name ?? "—") +
                      (item.floor ? ` · ${t("developer.leadFloor", { n: item.floor.floor })}` : "")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isNew ? chipNewBg : chipDoneBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTxt,
                      { color: isNew ? chipNewFg : chipDoneFg },
                    ]}
                  >
                    {isNew ? t("developer.statusNew") : t("developer.statusContacted")}
                  </Text>
                </View>
              </View>

              <Text variant="titleSmall" style={[styles.phone, { color: p.text }]}>
                {item.phone}
              </Text>
              <Text variant="bodySmall" style={{ color: p.textMuted }}>
                {formatDate(item.createdAt)}
              </Text>

              <View style={styles.actionBar}>
                <DevIconAction
                  icon="phone-outline"
                  label={t("developer.call")}
                  accessibilityLabel={t("developer.call")}
                  onPress={() => void callPhone(item.phone)}
                />
                <DevIconAction
                  icon="content-copy"
                  label={t("developer.copy")}
                  accessibilityLabel={t("developer.copy")}
                  onPress={() => void copy(item.phone)}
                />
                {isNew ? (
                  <Pressable
                    onPress={() => void markContacted(item.id)}
                    style={({ pressed }) => [
                      styles.primaryPill,
                      { backgroundColor: p.primary, opacity: pressed ? 0.88 : 1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t("developer.markContacted")}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryPillTxt}>{t("developer.markContacted")}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.primaryPillSpacer} />
                )}
              </View>

              <Pressable
                onPress={() => void createFeedbackLink(item.id)}
                disabled={feedbackBusy}
                style={({ pressed }) => [
                  styles.feedbackRow,
                  { borderColor: p.outline, opacity: pressed || feedbackBusy ? 0.75 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("developer.requestFeedback")}
              >
                {feedbackBusy ? (
                  <ActivityIndicator size="small" color={p.primary} />
                ) : (
                  <MaterialCommunityIcons name="message-text-outline" size={20} color={p.primary} />
                )}
                <Text variant="labelLarge" style={[styles.feedbackTxt, { color: p.primary }]}>
                  {t("developer.requestFeedback")}
                </Text>
              </Pressable>
            </DevCard>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={p.textMuted} />
            <Text variant="bodyLarge" style={[styles.emptyTxt, { color: p.textMuted }]}>
              {t("developer.emptyLeads")}
            </Text>
          </View>
        }
      />
      <Snackbar
        visible={snack != null}
        onDismiss={() => setSnack(null)}
        duration={2500}
        action={
          feedbackLink
            ? {
                label: t("developer.copyLink"),
                onPress: () => void copy(feedbackLink),
              }
            : undefined
        }
      >
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

function StatPill({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: number;
  bg: string;
  fg: string;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: bg }]}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: devListPadding, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.md, gap: spacing.md },
  search: {
    backgroundColor: "transparent",
    height: devSearchHeight,
  },
  searchOutline: { borderRadius: radii.lg },
  filterLabel: { fontWeight: "700", marginBottom: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statPill: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: Platform.select({ ios: 10, android: 12, default: 10 }),
    paddingHorizontal: spacing.sm,
    alignItems: "center",
  },
  statValue: {
    fontWeight: "800",
    fontSize: Platform.select({ ios: 20, android: 22, default: 20 }),
  },
  statLabel: {
    fontWeight: "600",
    fontSize: Platform.select({ ios: 10, android: 11, default: 10 }),
    marginTop: 2,
    textAlign: "center",
  },
  card: { marginBottom: spacing.md },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTopLeft: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: "800" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  statusTxt: { fontWeight: "700", fontSize: 11 },
  phone: { fontWeight: "700", marginBottom: 2 },
  actionBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  primaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    height: devPillHeight,
    borderRadius: devPillHeight / 2,
    marginLeft: "auto",
    ...Platform.select({
      ios: { marginBottom: 18 },
      android: { marginBottom: 20 },
      default: { marginBottom: 18 },
    }),
  },
  primaryPillSpacer: { flex: 1 },
  primaryPillTxt: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: Platform.select({ ios: 12, android: 14, default: 12 }),
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  feedbackTxt: { fontWeight: "700" },
  empty: {
    paddingVertical: spacing.xxl * 2,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyTxt: { textAlign: "center" },
});
