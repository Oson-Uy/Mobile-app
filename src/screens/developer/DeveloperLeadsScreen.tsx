import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

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
  project?: { name: string } | null;
  floor?: { floor: number } | null;
};

export function DeveloperLeadsScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<ApiLead[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
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
              <Text variant="bodyMedium" style={styles.phone}>
                {item.phone}
              </Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
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
