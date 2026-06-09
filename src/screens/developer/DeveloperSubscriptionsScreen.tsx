import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  Modal,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { apiFetch } from "../../api/client";
import { iosScrollInset } from "../../navigation/glassOptions";
import { useI18n } from "../../i18n/I18nProvider";
import { Screen } from "../../ui/Screen";
import { SectionCard } from "../../ui/SectionCard";
import { SectionTitle } from "../../ui/SectionTitle";
import { formatUzs } from "../../lib/currency";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

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

type PlanDef = {
  id: string;
  price: number;
  color: string;
  icon: "rocket-launch-outline" | "shield-check-outline" | "star-outline";
  popular?: boolean;
};

export function DeveloperSubscriptionsScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const { colors: c } = useAppTheme();

  const PLANS = useMemo<PlanDef[]>(
    () => [
      { id: "START", price: 0, color: c.brand, icon: "rocket-launch-outline" },
      {
        id: "PRO",
        price: 0,
        color: c.brandSecondary,
        icon: "shield-check-outline",
        popular: true,
      },
      { id: "ULTIMATE", price: 0, color: c.label, icon: "star-outline" },
    ],
    [c.brand, c.brandSecondary, c.label],
  );

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [active, setActive] = useState<ActivePayment | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const load = async () => {
    const [developer, allProjects] = await Promise.all([
      apiFetch<ApiDeveloper>("/developers"),
      apiFetch<ApiProject[]>("/projects"),
    ]);
    const own = allProjects.filter((proj) => proj.developerId === developer.id);
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
    () => projects.find((proj) => proj.id === selectedProjectId) ?? null,
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
      const payload: Record<string, unknown> = {
        projectId: selectedProjectId,
        plan,
        paymentMethod: "CARD_TRANSFER",
      };
      const trimmedPromo = promoCode.trim();
      if (trimmedPromo) {
        // TODO(api): Align field name and validation with Swagger for POST /billing/checkout.
        payload.promoCode = trimmedPromo;
      }
      const data = await apiFetch<any>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
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
        <FullScreenLoader message={t("common.loading")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Portal>
        <Modal
          visible={active != null}
          onDismiss={() => setActive(null)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <SectionTitle title={t("developer.paymentTitle")} subtitle={`#${active?.externalRef ?? ""}`} />
          <SectionCard style={styles.payCard}>
            <Text style={[styles.payRow, { color: c.label }]}>
              {t("developer.plan")}:{" "}
              <Text style={[styles.bold, { color: c.brand }]}>{active?.plan ?? ""}</Text>
            </Text>
            <Text style={[styles.payRow, { color: c.label }]}>
              {t("developer.amount")}:{" "}
              <Text style={[styles.bold, { color: c.brand }]}>
                {formatUzs(active?.amountUzs ?? 0)}
              </Text>
            </Text>
            <Divider style={{ marginVertical: spacing.md }} />
            <Text style={[styles.payHint, { color: c.labelSecondary }]}>{t("developer.instructions")}</Text>
            <Text style={[styles.payText, { color: c.label }]}>{active?.instructions ?? ""}</Text>
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

      <ScrollView {...iosScrollInset} contentContainerStyle={styles.scroll}>
        <SectionCard>
          <SectionTitle title={t("developer.subscriptions")} subtitle={t("developer.subscriptionsSubtitle")} />
          {err ? (
            <Text style={[styles.err, { color: c.error }]}>{err}</Text>
          ) : null}

          <Text style={[styles.small, { color: c.labelSecondary }]}>{t("developer.selectedProject")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.projectRow}>
              {projects.map((proj) => {
                const activePlan = proj.subscription?.plan;
                const isSel = proj.id === selectedProjectId;
                return (
                  <Button
                    key={proj.id}
                    mode={isSel ? "contained" : "outlined"}
                    onPress={() => setSelectedProjectId(proj.id)}
                    style={styles.projectBtn}
                    contentStyle={styles.projectBtnContent}
                    labelStyle={styles.projectBtnLabel}
                  >
                    {proj.name}
                    {activePlan ? ` · ${activePlan}` : ""}
                  </Button>
                );
              })}
            </View>
          </ScrollView>

          <TextInput
            mode="outlined"
            label={t("developer.promoCode")}
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            style={styles.promoField}
          />
          <Text variant="bodySmall" style={[styles.promoHint, { color: c.labelSecondary }]}>
            {t("developer.promoHint")}
          </Text>
        </SectionCard>

        <View style={{ height: spacing.lg }} />

        {PLANS.map((plan) => {
          const isBusy = busyKey === `${selectedProjectId}-${plan.id}`;
          const connected = selected?.subscription?.plan === plan.id;
          return (
            <SectionCard key={plan.id} style={styles.planCard}>
              <View style={styles.planHead}>
                <View style={[styles.planIcon, { backgroundColor: plan.color + "18" }]}>
                  <MaterialCommunityIcons name={plan.icon} size={26} color={plan.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: c.brand }]}>{plan.id}</Text>
                  <Text style={[styles.planPrice, { color: c.label }]}>
                    {formatUzs(plan.price)}{" "}
                    <Text style={[styles.planPer, { color: c.labelSecondary }]}>{t("developer.perMonth")}</Text>
                  </Text>
                </View>
                {plan.popular ? (
                  <View style={[styles.popular, { backgroundColor: c.brandSecondary }]}>
                    <Text style={[styles.popularTxt, { color: c.onMedia }]}>
                      {t("developer.popular")}
                    </Text>
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
  err: { marginBottom: spacing.sm, fontWeight: "700" },
  small: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  projectRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: 2 },
  projectBtn: { borderRadius: 14, minWidth: 112, maxWidth: 280 },
  projectBtnContent: { paddingHorizontal: 12, flexWrap: "wrap", justifyContent: "center" },
  projectBtnLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  promoField: { marginTop: spacing.md },
  promoHint: { marginTop: 6, lineHeight: 18 },
  planCard: { borderRadius: radii.xl },
  planHead: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  planIcon: { height: 56, width: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  planTitle: { fontWeight: "900", fontSize: 18 },
  planPrice: { fontWeight: "900", fontSize: 16 },
  planPer: { fontWeight: "700" },
  popular: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  popularTxt: { fontWeight: "900", fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" },
  modal: {
    marginHorizontal: spacing.lg,
    marginVertical: 42,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  payCard: { marginVertical: spacing.md },
  payRow: { marginBottom: 6 },
  bold: { fontWeight: "900" },
  payHint: { fontWeight: "800", marginBottom: 6 },
  payText: {},
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
