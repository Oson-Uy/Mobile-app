import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  Modal,
  Portal,
  Snackbar,
  Text,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { formatUzs } from "../../lib/currency";
import { palette, radii, spacing } from "../../theme/tokens";

type ApiDeveloper = { id: number };
type ApiProject = {
  id: number;
  name: string;
  developerId: number;
  subscription?: { plan?: string; status?: string } | null;
};

type ActivePayment = {
  plan: string;
  externalRef: string;
  amountUzs: number;
  instructions: string;
};

const PLANS = [
  { id: "START", price: 1000000, color: palette.primary, icon: "rocket-launch-outline" as const },
  { id: "PRO", price: 3000000, color: palette.secondary, icon: "shield-check-outline" as const, popular: true },
  { id: "ULTIMATE", price: 5000000, color: "#111827", icon: "star-outline" as const },
];

export function DeveloperSubscriptionsScreen() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [active, setActive] = useState<ActivePayment | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = async () => {
    const [developer, allProjects] = await Promise.all([
      apiFetch<ApiDeveloper>("/developers"),
      apiFetch<ApiProject[]>("/projects"),
    ]);
    const own = allProjects.filter((p) => p.developerId === developer.id);
    setProjects(own);
    if (selectedProjectId == null && own[0]?.id) setSelectedProjectId(own[0].id);
  };

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setErr(null);
        await load();
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("developer.loadError"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const checkout = async (plan: string) => {
    if (!selectedProjectId) {
      setSnack(t("developer.chooseProject"));
      return;
    }
    try {
      setBusyKey(`${selectedProjectId}-${plan}`);
      setErr(null);
      const data = await apiFetch<any>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProjectId,
          plan,
          paymentMethod: "CARD_TRANSFER",
        }),
      });
      setActive({
        plan,
        externalRef: data.externalRef,
        amountUzs: data.amountUzs || 0,
        instructions: data.instructions?.comment || data.message || "",
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("developer.subscriptionError"));
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <Text>{t("common.loading")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Portal>
        <Modal visible={active != null} onDismiss={() => setActive(null)} contentContainerStyle={styles.modal}>
          <SectionTitle title={t("developer.paymentTitle")} subtitle={`#${active?.externalRef ?? ""}`} />
          <SectionCard style={styles.payCard}>
            <Text style={styles.payRow}>
              {t("developer.plan")}: <Text style={styles.bold}>{active?.plan ?? ""}</Text>
            </Text>
            <Text style={styles.payRow}>
              {t("developer.amount")}: <Text style={styles.bold}>{formatUzs(active?.amountUzs ?? 0)}</Text>
            </Text>
            <Divider style={{ marginVertical: spacing.md }} />
            <Text style={styles.payHint}>{t("developer.instructions")}</Text>
            <Text style={styles.payText}>{active?.instructions ?? ""}</Text>
          </SectionCard>
          <View style={styles.row}>
            <Button mode="outlined" style={styles.flex} onPress={() => setActive(null)}>
              {t("developer.close")}
            </Button>
            <Button
              mode="contained"
              style={styles.flex}
              onPress={() => {
                setActive(null);
                void load();
              }}
            >
              {t("developer.paid")}
            </Button>
          </View>
        </Modal>
      </Portal>

      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionCard>
          <SectionTitle title={t("developer.subscriptions")} subtitle={t("developer.subscriptionsSubtitle")} />
          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Text style={styles.small}>{t("developer.selectedProject")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.projectRow}>
              {projects.map((p) => {
                const activePlan = p.subscription?.plan;
                const isSel = p.id === selectedProjectId;
                return (
                  <Button
                    key={p.id}
                    mode={isSel ? "contained" : "outlined"}
                    onPress={() => setSelectedProjectId(p.id)}
                    style={styles.projectBtn}
                  >
                    {p.name}
                    {activePlan ? ` · ${activePlan}` : ""}
                  </Button>
                );
              })}
            </View>
          </ScrollView>
        </SectionCard>

        <View style={{ height: spacing.lg }} />

        {PLANS.map((plan) => {
          const isBusy = busyKey === `${selectedProjectId}-${plan.id}`;
          const connected = selected?.subscription?.plan === plan.id;
          return (
            <SectionCard key={plan.id} style={styles.planCard}>
              <View style={styles.planHead}>
                <View style={[styles.planIcon, { backgroundColor: plan.color + "12" }]}>
                  <MaterialCommunityIcons name={plan.icon} size={26} color={plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{plan.id}</Text>
                  <Text style={styles.planPrice}>
                    {formatUzs(plan.price)}{" "}
                    <Text style={styles.planPer}>{t("developer.perMonth")}</Text>
                  </Text>
                </View>
                {plan.popular ? (
                  <View style={styles.popular}>
                    <Text style={styles.popularTxt}>{t("developer.popular")}</Text>
                  </View>
                ) : null}
              </View>
              <Divider style={{ marginVertical: spacing.md }} />
              <Button
                mode={connected ? "contained-tonal" : "contained"}
                onPress={() => void checkout(plan.id)}
                disabled={isBusy}
                loading={isBusy}
              >
                {connected ? t("developer.alreadyConnected") : t("developer.selectPlan")}
              </Button>
            </SectionCard>
          );
        })}
      </ScrollView>

      <Snackbar visible={snack != null} onDismiss={() => setSnack(null)} duration={2500}>
        {snack ?? ""}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  err: { color: palette.error, marginBottom: spacing.sm, fontWeight: "700" },
  small: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: palette.textMuted,
    marginBottom: 8,
  },
  projectRow: { flexDirection: "row", gap: spacing.sm },
  projectBtn: { borderRadius: 14 },
  planCard: { borderRadius: radii.xl },
  planHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  planIcon: { height: 56, width: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  planTitle: { fontWeight: "900", fontSize: 18, color: palette.primary },
  planPrice: { fontWeight: "900", fontSize: 16 },
  planPer: { fontWeight: "700", opacity: 0.6 },
  popular: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: palette.secondary },
  popularTxt: { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" },
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.lg,
    marginVertical: 42,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  payCard: { marginVertical: spacing.md },
  payRow: { marginBottom: 6 },
  bold: { fontWeight: "900", color: palette.primary },
  payHint: { fontWeight: "800", opacity: 0.7, marginBottom: 6 },
  payText: { opacity: 0.85 },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});

