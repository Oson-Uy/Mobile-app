import React, { useCallback, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiAuthError, apiFetchCustomer } from "../../api/client";
import { clearCustomerToken } from "../../auth/customerToken";
import { useI18n } from "../../i18n/I18nProvider";
import { formatUzs } from "../../lib/currency";
import { formatUzPhoneInput } from "../../lib/phone";
import { buyerTabBarBottomInset } from "../../navigation/tabBarInsets";
import { iosScrollInset } from "../../navigation/glassOptions";
import type { CabinetStackParamList } from "../../navigation/types";
import type { CabinetMe } from "../../types/cabinet";
import { SurfaceCard } from "../../ui/SurfaceCard";
import { FullScreenLoader } from "../../ui/FullScreenLoader";
import { SectionTitle } from "../../ui/SectionTitle";
import { Screen } from "../../ui/Screen";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CabinetStackParamList, "CabinetDashboard">;

const VERIFY_BASE = "https://oson-uy.uz/cabinet/verify";

const localeFor = (l: string) =>
  l === "uz" ? "uz-UZ" : l === "en" ? "en-US" : "ru-RU";

export function CabinetDashboardScreen({ navigation }: Props) {
  const { t, locale } = useI18n();
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CabinetMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await apiFetchCustomer<CabinetMe>("/customer-cabinet/me");
      setData(res);
    } catch (e) {
      if (e instanceof ApiAuthError) {
        navigation.replace("CabinetLogin");
        return;
      }
      setError(t("common.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load(true);
  };

  const onLogout = async () => {
    await clearCustomerToken();
    navigation.replace("CabinetLogin");
  };

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  if (loading && !data) {
    return (
      <Screen>
        <FullScreenLoader />
      </Screen>
    );
  }

  if (error && !data) {
    return (
      <Screen style={styles.centered}>
        <Text style={[styles.err, { color: c.error }]}>{error}</Text>
        <Button mode="contained" onPress={() => void load()} style={styles.retry}>
          {t("common.retry")}
        </Button>
      </Screen>
    );
  }

  if (!data) return null;

  const moneyLocale = localeFor(locale);
  const verifyUrl = data.customer.verificationToken
    ? `${VERIFY_BASE}/${data.customer.verificationToken}`
    : null;

  return (
    <Screen>
      <ScrollView
        {...iosScrollInset}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: buyerTabBarBottomInset(insets.bottom) },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={[styles.title, { color: c.label }]}>
              {t("cabinet.dashboardTitle")}
            </Text>
            <Text style={[styles.meta, { color: c.labelSecondary }]}>
              {data.customer.name} · {formatUzPhoneInput(data.customer.phone)} ·{" "}
              {data.project.name}
            </Text>
          </View>
          <Button mode="text" onPress={() => void onLogout()} compact>
            {t("cabinet.logout")}
          </Button>
        </View>

        <SurfaceCard style={styles.card}>
          <SectionTitle title={t("cabinet.project")} />
          <Text style={[styles.value, { color: c.label }]}>{data.project.name}</Text>
          <Text style={[styles.hint, { color: c.labelSecondary }]}>{data.project.location}</Text>
          {data.project.developerName ? (
            <Text style={[styles.hint, { color: c.labelSecondary, marginTop: spacing.xs }]}>
              {data.project.developerName}
            </Text>
          ) : null}

          {data.apartment ? (
            <View style={styles.apartmentBlock}>
              <SectionTitle title={t("cabinet.apartment")} />
              <Text style={[styles.value, { color: c.label }]}>
                №{data.apartment.number}
              </Text>
              <Text style={[styles.hint, { color: c.labelSecondary }]}>
                {t("cabinet.floor")} {data.apartment.floor} · {data.apartment.rooms}{" "}
                {t("cabinet.rooms")} · {data.apartment.areaSqm} {t("common.m2")}
              </Text>
              {data.apartment.layoutImageUrl ? (
                <Image
                  source={{ uri: data.apartment.layoutImageUrl }}
                  style={[styles.layout, { backgroundColor: c.fill }]}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          ) : (
            <Text style={[styles.hint, { color: c.labelSecondary, marginTop: spacing.md }]}>
              {t("cabinet.noApartment")}
            </Text>
          )}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SectionTitle title={t("cabinet.payments")} />
          <Text style={[styles.hint, { color: c.labelSecondary, marginBottom: spacing.md }]}>
            {t("cabinet.paymentsSummaryHint")}
          </Text>

          <View style={styles.financeGrid}>
            <FinanceTile
              label={t("cabinet.total")}
              value={formatUzs(data.finances.totalPriceUzs, moneyLocale)}
              color={c.label}
              muted={c.labelSecondary}
            />
            <FinanceTile
              label={t("cabinet.paid")}
              value={formatUzs(data.finances.paidUzs, moneyLocale)}
              color={c.brand}
              muted={c.labelSecondary}
            />
            <FinanceTile
              label={t("cabinet.remaining")}
              value={formatUzs(data.finances.remainingUzs, moneyLocale)}
              color={c.label}
              muted={c.labelSecondary}
            />
            {data.finances.debtUzs > 0 ? (
              <FinanceTile
                label={t("cabinet.debt")}
                value={formatUzs(data.finances.debtUzs, moneyLocale)}
                color={c.error}
                muted={c.labelSecondary}
              />
            ) : null}
          </View>

          {data.finances.monthlyDueUzs != null && data.finances.monthlyDueUzs > 0 ? (
            <View style={[styles.monthlyDue, { borderColor: c.separator }]}>
              <Text style={[styles.monthlyLabel, { color: c.labelSecondary }]}>
                {t("cabinet.monthlyDue")}
              </Text>
              <Text style={[styles.monthlyValue, { color: c.brand }]}>
                {formatUzs(data.finances.monthlyDueUzs, moneyLocale)} {t("common.sum")}
              </Text>
              <Text style={[styles.hint, { color: c.labelSecondary }]}>
                {t("cabinet.monthlyDueHint")}
              </Text>
            </View>
          ) : null}

          {data.payments.length === 0 ? (
            <Text style={[styles.hint, { color: c.labelSecondary, marginTop: spacing.md }]}>
              {t("cabinet.paymentsNone")}
            </Text>
          ) : (
            <View style={styles.paymentsList}>
              {data.payments.map((pay) => (
                <View
                  key={pay.id}
                  style={[styles.paymentRow, { borderColor: c.separator }]}
                >
                  <Text style={[styles.paymentAmount, { color: c.label }]}>
                    {formatUzs(pay.amountUzs, moneyLocale)} {t("common.sum")}
                  </Text>
                  <Text style={[styles.hint, { color: c.labelSecondary }]}>
                    {new Date(pay.paidAt).toLocaleDateString(moneyLocale)} · {pay.type}
                    {pay.comment ? ` · ${pay.comment}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SectionTitle title={t("cabinet.progress")} />
          {data.progress.milestones.length === 0 ? (
            <Text style={[styles.hint, { color: c.labelSecondary }]}>—</Text>
          ) : (
            <View style={styles.milestones}>
              {data.progress.milestones.map((m) => (
                <View key={m.id} style={styles.milestone}>
                  <View style={styles.milestoneRow}>
                    <MaterialCommunityIcons
                      name={m.done ? "check-circle" : "circle-outline"}
                      size={20}
                      color={m.done ? c.brand : c.labelSecondary}
                    />
                    <Text
                      style={[
                        styles.milestoneTitle,
                        { color: m.done ? c.label : c.labelSecondary },
                      ]}
                    >
                      {m.title}
                    </Text>
                  </View>
                  {m.photoUrls?.length ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photoStrip}
                      contentContainerStyle={styles.photoStripContent}
                    >
                      {m.photoUrls.map((url, idx) => (
                        <Pressable key={`${m.id}-${idx}`} onPress={() => openUrl(url)}>
                          <Image
                            source={{ uri: url }}
                            style={[styles.progressPhoto, { backgroundColor: c.fill }]}
                          />
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <SectionTitle title={t("cabinet.documents")} />
          {data.documents.length === 0 ? (
            <Text style={[styles.hint, { color: c.labelSecondary }]}>—</Text>
          ) : (
            data.documents.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() => openUrl(doc.fileUrl)}
                style={({ pressed }) => [
                  styles.docRow,
                  { borderColor: c.separator, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MaterialCommunityIcons name="file-document-outline" size={22} color={c.brand} />
                <Text style={[styles.docTitle, { color: c.brand }]}>{doc.title}</Text>
                <MaterialCommunityIcons name="open-in-new" size={18} color={c.labelSecondary} />
              </Pressable>
            ))
          )}
          {verifyUrl ? (
            <Button
              mode="outlined"
              onPress={() => openUrl(verifyUrl)}
              style={styles.verifyBtn}
              icon="shield-check-outline"
            >
              {t("cabinet.verifyOpen")}
            </Button>
          ) : null}
        </SurfaceCard>
      </ScrollView>
    </Screen>
  );
}

function FinanceTile({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.financeTile}>
      <Text style={[styles.financeLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.financeValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: "center", alignItems: "center", padding: spacing.lg },
  err: { fontWeight: "700", textAlign: "center", marginBottom: spacing.md },
  retry: { marginTop: spacing.sm },
  scroll: { padding: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerText: { flex: 1 },
  title: { fontWeight: "900" },
  meta: { marginTop: spacing.xs, lineHeight: 20, fontSize: 13 },
  card: { padding: spacing.lg, gap: spacing.xs },
  value: { fontWeight: "800", fontSize: 16 },
  hint: { lineHeight: 20, fontSize: 13 },
  apartmentBlock: { marginTop: spacing.md, gap: spacing.xs },
  layout: {
    marginTop: spacing.md,
    width: "100%",
    height: 200,
    borderRadius: radii.lg,
  },
  financeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  financeTile: { minWidth: "42%", gap: 4 },
  financeLabel: { fontSize: 12, fontWeight: "600" },
  financeValue: { fontSize: 17, fontWeight: "900" },
  monthlyDue: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  monthlyLabel: { fontSize: 12, fontWeight: "600" },
  monthlyValue: { fontSize: 20, fontWeight: "900" },
  paymentsList: { marginTop: spacing.md, gap: spacing.sm },
  paymentRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  paymentAmount: { fontWeight: "800", fontSize: 15 },
  milestones: { marginTop: spacing.sm, gap: spacing.md },
  milestone: { gap: spacing.sm },
  milestoneRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  milestoneTitle: { flex: 1, fontWeight: "700", lineHeight: 20 },
  photoStrip: { marginLeft: 28 },
  photoStripContent: { gap: spacing.sm },
  progressPhoto: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  docTitle: { flex: 1, fontWeight: "700" },
  verifyBtn: { marginTop: spacing.md, borderRadius: radii.lg },
});
