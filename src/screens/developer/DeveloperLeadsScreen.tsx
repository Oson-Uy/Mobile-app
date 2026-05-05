import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Linking, RefreshControl, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Divider, Snackbar, Text, TextInput } from "react-native-paper";
import * as Clipboard from "expo-clipboard";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { palette, radii, spacing } from "../../theme/tokens";

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
  const [items, setItems] = useState<ApiLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [snack, setSnack] = useState<string | null>(null);
  const [busyFeedbackId, setBusyFeedbackId] = useState<number | null>(null);
  const [feedbackLink, setFeedbackLink] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((x) => x.status === "NEW").length,
      contacted: items.filter((x) => x.status === "CONTACTED").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((l) => {
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
  }, [items, query]);

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setSnack(t("developer.copied"));
  };

  const callPhone = async (digits: string) => {
    const url = `tel:${digits}`;
    try {
      await Linking.openURL(url);
    } catch {
      setSnack(t("developer.callError"));
    }
  };

  const whatsapp = async (digits: string) => {
    const clean = digits.replace(/[^\d]/g, "");
    const url = `https://wa.me/${clean}`;
    try {
      await Linking.openURL(url);
    } catch {
      setSnack(t("developer.whatsappError"));
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
            />
            <View style={styles.statsRow}>
              <Chip style={styles.statChip}>{t("developer.statsAll")}: {stats.total}</Chip>
              <Chip style={styles.statChip}>{t("developer.statsNew")}: {stats.newCount}</Chip>
              <Chip style={styles.statChip}>{t("developer.statsContacted")}: {stats.contacted}</Chip>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card mode="elevated" style={styles.card} elevation={2}>
            <Card.Title
              title={item.name}
              titleStyle={styles.cardTitle}
              subtitle={`${item.project?.name ?? "—"}${
                item.floor
                  ? ` · ${t("developer.leadFloor", { n: item.floor.floor })}`
                  : ""
              }`}
              subtitleStyle={styles.sub}
            />
            <Card.Content style={styles.content}>
              <Text variant="bodyMedium" style={styles.phone}>{item.phone}</Text>
              <View style={styles.quickRow}>
                <Button mode="outlined" compact onPress={() => void callPhone(item.phone)}>
                  {t("developer.call")}
                </Button>
                <Button mode="outlined" compact onPress={() => void whatsapp(item.phone)}>
                  WhatsApp
                </Button>
                <Button mode="outlined" compact onPress={() => void copy(item.phone)}>
                  {t("developer.copy")}
                </Button>
              </View>
              <Divider />
              <View style={styles.row}>
                <Chip
                  style={
                    item.status === "NEW" ? styles.chipNew : styles.chipDone
                  }
                  textStyle={styles.chipTxt}
                >
                  {item.status === "NEW"
                    ? t("developer.statusNew")
                    : t("developer.statusContacted")}
                </Chip>
                {item.status === "NEW" ? (
                  <Button
                    mode="contained"
                    compact
                    onPress={() => void markContacted(item.id)}
                  >
                    {t("developer.markContacted")}
                  </Button>
                ) : null}
                <Button
                  mode="contained-tonal"
                  compact
                  loading={busyFeedbackId === item.id}
                  onPress={() => void createFeedbackLink(item.id)}
                >
                  {t("developer.requestFeedback")}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyTxt}>
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

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.md, gap: spacing.sm },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: { backgroundColor: palette.surfaceMuted },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outline,
  },
  cardTitle: { fontWeight: "800" },
  sub: { opacity: 0.75 },
  content: { gap: spacing.sm, paddingTop: 0 },
  phone: { fontWeight: "700" },
  quickRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  chipNew: { backgroundColor: "#FEF3C7" },
  chipDone: { backgroundColor: "#DCFCE7" },
  chipTxt: { fontWeight: "700", fontSize: 12 },
  empty: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
  emptyTxt: { opacity: 0.75, textAlign: "center" },
});
