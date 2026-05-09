import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Divider, Switch, Text, TextInput, useTheme } from "react-native-paper";

import type { CatalogFilterState } from "../../catalog/filterProjects";
import { formatMoneyInput } from "../../lib/currency";
import { UZB_LOCATIONS } from "../../lib/locations";
import { useI18n } from "../../i18n/I18nProvider";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  onApply: () => void;
  onReset: () => void;
};

function FilterCheckRow({
  checked,
  onToggle,
  label,
  outline,
  primary,
  textColor,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  outline: string;
  primary: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.88 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        style={[
          styles.checkBox,
          {
            borderColor: checked ? primary : outline,
            backgroundColor: checked ? primary : "transparent",
          },
        ]}
      >
        {checked ? <MaterialCommunityIcons name="check" size={15} color="#FFFFFF" /> : null}
      </View>
      <Text style={[styles.checkLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function CatalogFilterModal({
  visible,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
}: Props) {
  const { t } = useI18n();
  const theme = useTheme();
  const { palette: p } = useAppTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState<null | "region" | "district">(null);

  const regionEntry = useMemo(
    () => UZB_LOCATIONS.find((r) => r.region === filters.location),
    [filters.location],
  );
  const districtOptions = regionEntry?.districts ?? [];

  const pickRegion = (region: string) => {
    if (!region) {
      onChange({ ...filters, location: "", district: "" });
    } else {
      const entry = UZB_LOCATIONS.find((l) => l.region === region);
      const first = entry?.districts[0] ?? "";
      onChange({ ...filters, location: region, district: first });
    }
    setPickOpen(null);
  };

  const pickDistrict = (district: string) => {
    onChange({ ...filters, district });
    setPickOpen(null);
  };

  const pickerListMaxH = Math.min(Dimensions.get("window").height * 0.55, 420);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
          pointerEvents={pickOpen != null ? "none" : "auto"}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={[
              styles.sheet,
              {
                backgroundColor: p.surface,
                borderTopColor: p.outline,
              },
            ]}
          >
            <View style={styles.sheetHandleZone}>
              <View style={[styles.handle, { backgroundColor: p.outline }]} />
            </View>
            <Text variant="titleLarge" style={[styles.title, { color: p.text }]}>
              {t("catalog.drawer.title")}
            </Text>
            <Text variant="bodyMedium" style={[styles.desc, { color: p.textMuted }]}>
              {t("catalog.drawer.description")}
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scrollFlex}
              contentContainerStyle={styles.scroll}
            >
              <Text style={[styles.label, { color: p.textMuted }]}>
                {t("catalog.drawer.pricePerM2Label")}
              </Text>
              <View style={styles.row}>
                <TextInput
                  mode="outlined"
                  dense
                  style={styles.input}
                  placeholder={t("catalog.drawer.from")}
                  placeholderTextColor={p.textMuted}
                  textColor={p.text}
                  outlineColor={p.outline}
                  activeOutlineColor={theme.colors.primary}
                  value={filters.pricePerM2Min}
                  onChangeText={(v) =>
                    onChange({
                      ...filters,
                      pricePerM2Min: formatMoneyInput(v),
                    })
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  mode="outlined"
                  dense
                  style={styles.input}
                  placeholder={t("catalog.drawer.to")}
                  placeholderTextColor={p.textMuted}
                  textColor={p.text}
                  outlineColor={p.outline}
                  activeOutlineColor={theme.colors.primary}
                  value={filters.pricePerM2Max}
                  onChangeText={(v) =>
                    onChange({
                      ...filters,
                      pricePerM2Max: formatMoneyInput(v),
                    })
                  }
                  keyboardType="numeric"
                />
              </View>

              <Text style={[styles.label, styles.mt, { color: p.textMuted }]}>
                {t("catalog.drawer.areaLabel")}
              </Text>
              <View style={styles.row}>
                <TextInput
                  mode="outlined"
                  dense
                  style={styles.input}
                  placeholder={t("catalog.drawer.area_from")}
                  placeholderTextColor={p.textMuted}
                  textColor={p.text}
                  outlineColor={p.outline}
                  activeOutlineColor={theme.colors.primary}
                  value={filters.areaMin}
                  onChangeText={(v) =>
                    onChange({ ...filters, areaMin: v.replace(/[^\d.]/g, "") })
                  }
                  keyboardType="decimal-pad"
                />
                <TextInput
                  mode="outlined"
                  dense
                  style={styles.input}
                  placeholder={t("catalog.drawer.area_to")}
                  placeholderTextColor={p.textMuted}
                  textColor={p.text}
                  outlineColor={p.outline}
                  activeOutlineColor={theme.colors.primary}
                  value={filters.areaMax}
                  onChangeText={(v) =>
                    onChange({ ...filters, areaMax: v.replace(/[^\d.]/g, "") })
                  }
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={[styles.label, styles.mt, { color: p.textMuted }]}>
                {t("catalog.drawer.additionalLabel")}
              </Text>
              <FilterCheckRow
                checked={filters.verified}
                onToggle={() => onChange({ ...filters, verified: !filters.verified })}
                label={t("catalog.drawer.verified")}
                outline={p.outline}
                primary={p.primary}
                textColor={p.text}
              />
              <FilterCheckRow
                checked={filters.popular}
                onToggle={() => onChange({ ...filters, popular: !filters.popular })}
                label={t("catalog.popular")}
                outline={p.outline}
                primary={p.primary}
                textColor={p.text}
              />

              <View style={[styles.advancedToggle, { borderColor: p.outline }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.advancedTitle, { color: p.text }]}>
                    {t("catalog.filtersAdvanced")}
                  </Text>
                  <Text style={[styles.advancedHint, { color: p.textMuted }]}>
                    {t("catalog.filtersAdvancedHint")}
                  </Text>
                </View>
                <Switch value={advancedOpen} onValueChange={setAdvancedOpen} />
              </View>

              {advancedOpen ? (
                <>
                  <Text style={[styles.label, { color: p.textMuted }]}>
                    {t("catalog.drawer.region")}
                  </Text>
                  <Pressable
                    onPress={() => setPickOpen("region")}
                    style={({ pressed }) => [
                      styles.selectField,
                      {
                        borderColor: p.outline,
                        backgroundColor: pressed ? p.surfaceMuted : p.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.selectText, { color: filters.location ? p.text : p.textMuted }]}
                      numberOfLines={2}
                    >
                      {filters.location || t("catalog.drawer.selectRegion")}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={22} color={p.textMuted} />
                  </Pressable>

                  <Text style={[styles.label, styles.mt, { color: p.textMuted }]}>
                    {t("catalog.drawer.district")}
                  </Text>
                  <Pressable
                    onPress={() => {
                      if (!filters.location) setPickOpen("region");
                      else setPickOpen("district");
                    }}
                    disabled={!filters.location}
                    style={({ pressed }) => [
                      styles.selectField,
                      {
                        borderColor: p.outline,
                        backgroundColor: pressed ? p.surfaceMuted : p.surface,
                        opacity: filters.location ? 1 : 0.55,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.selectText, { color: filters.district ? p.text : p.textMuted }]}
                      numberOfLines={2}
                    >
                      {filters.district || t("catalog.drawer.selectDistrict")}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={22} color={p.textMuted} />
                  </Pressable>

                  <View style={styles.mt}>
                    <FilterCheckRow
                      checked={filters.hasInstallment}
                      onToggle={() =>
                        onChange({
                          ...filters,
                          hasInstallment: !filters.hasInstallment,
                        })
                      }
                      label={t("projectCard.installment")}
                      outline={p.outline}
                      primary={p.primary}
                      textColor={p.text}
                    />
                  </View>
                </>
              ) : null}
            </ScrollView>

            <Divider style={[styles.divider, { backgroundColor: p.outline }]} />
            <View style={styles.actions}>
              <Button mode="outlined" onPress={onReset} style={styles.btn}>
                {t("catalog.drawer.reset")}
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  onApply();
                  onClose();
                }}
                style={styles.btn}
                buttonColor={theme.colors.primary}
              >
                {t("catalog.drawer.apply")}
              </Button>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {pickOpen != null ? (
          <View style={styles.pickerStack} pointerEvents="box-none">
            <Pressable style={styles.pickerDim} onPress={() => setPickOpen(null)} />
            <View style={styles.pickerSheetWrap} pointerEvents="box-none">
            <SafeAreaView
              edges={["bottom"]}
              style={[
                styles.pickerSheet,
                { backgroundColor: p.surface, borderTopColor: p.outline },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: p.text }]}>
                {pickOpen === "region"
                  ? t("catalog.drawer.region")
                  : t("catalog.drawer.district")}
              </Text>
              {pickOpen === "region" ? (
                <FlatList
                  data={[
                    { id: "__any", label: t("catalog.drawer.anyRegion"), value: "" },
                    ...UZB_LOCATIONS.map((l, i) => ({
                      id: `r-${i}`,
                      label: l.region,
                      value: l.region,
                    })),
                  ]}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: pickerListMaxH }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => pickRegion(item.value)}
                      style={({ pressed }) => [
                        styles.pickerRow,
                        { backgroundColor: pressed ? p.surfaceMuted : "transparent" },
                      ]}
                    >
                      <Text style={[styles.pickerRowText, { color: p.text }]} numberOfLines={3}>
                        {item.label}
                      </Text>
                      {filters.location === item.value ? (
                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                      ) : null}
                    </Pressable>
                  )}
                />
              ) : null}
              {pickOpen === "district" ? (
                <FlatList
                  data={[
                    { id: "__any", label: t("catalog.drawer.anyDistrict"), value: "" },
                    ...districtOptions.map((d, i) => ({ id: `d-${i}`, label: d, value: d })),
                  ]}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: pickerListMaxH }}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => pickDistrict(item.value)}
                      style={({ pressed }) => [
                        styles.pickerRow,
                        { backgroundColor: pressed ? p.surfaceMuted : "transparent" },
                      ]}
                    >
                      <Text style={[styles.pickerRowText, { color: p.text }]} numberOfLines={3}>
                        {item.label}
                      </Text>
                      {filters.district === item.value ? (
                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                      ) : null}
                    </Pressable>
                  )}
                />
              ) : null}
              <Button mode="text" onPress={() => setPickOpen(null)}>
                {t("developer.close")}
              </Button>
            </SafeAreaView>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    position: "relative",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.5)",
  },
  sheetWrap: {
    maxHeight: "92%",
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetHandleZone: {
    alignItems: "center",
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: { fontWeight: "900", marginBottom: 4 },
  desc: { marginBottom: spacing.md },
  scrollFlex: { maxHeight: 420 },
  scroll: { paddingBottom: spacing.md, gap: spacing.sm },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: { flex: 1 },
  mt: { marginTop: spacing.md },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  advancedTitle: { fontWeight: "800", fontSize: 15 },
  advancedHint: { fontSize: 12, marginTop: 2 },
  divider: { marginVertical: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm, paddingBottom: spacing.sm },
  btn: { flex: 1 },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  selectText: { flex: 1, fontSize: 15, fontWeight: "600" },
  pickerStack: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  pickerDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pickerSheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerSheet: {
    maxHeight: "78%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontWeight: "900", fontSize: 18, marginBottom: spacing.sm },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  pickerRowText: { flex: 1, fontSize: 15 },
});
