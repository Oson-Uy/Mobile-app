import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Divider,
  Modal,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";

import type { CatalogFilterState } from "../../catalog/filterProjects";
import { formatMoneyInput } from "../../lib/currency";
import { useI18n } from "../../i18n/I18nProvider";
import { radii, spacing } from "../../theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  /** Commits draft filters to parent (call before onClose). */
  onApply: () => void;
  onReset: () => void;
};

export function CatalogFilterModal({
  visible,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
}: Props) {
  const { t } = useI18n();

  const labelStyle = styles.label;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.sheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <Text variant="titleLarge" style={styles.title}>
            {t("catalog.drawer.title")}
          </Text>
          <Text variant="bodyMedium" style={styles.desc}>
            {t("catalog.drawer.description")}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <Text style={labelStyle}>{t("catalog.drawer.pricePerM2Label")}</Text>
            <View style={styles.row}>
              <TextInput
                mode="outlined"
                dense
                style={styles.input}
                placeholder={t("catalog.drawer.from")}
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

            <Text style={labelStyle}>{t("catalog.drawer.areaLabel")}</Text>
            <View style={styles.row}>
              <TextInput
                mode="outlined"
                dense
                style={styles.input}
                placeholder={t("catalog.drawer.area_from")}
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
                value={filters.areaMax}
                onChangeText={(v) =>
                  onChange({ ...filters, areaMax: v.replace(/[^\d.]/g, "") })
                }
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={labelStyle}>{t("catalog.locationLabel")}</Text>
            <TextInput
              mode="outlined"
              dense
              placeholder={t("catalog.locationPlaceholder")}
              value={filters.location}
              onChangeText={(v) => onChange({ ...filters, location: v })}
            />

            <Text style={[labelStyle, styles.mt]}>{t("catalog.districtLabel")}</Text>
            <TextInput
              mode="outlined"
              dense
              placeholder={t("catalog.districtPlaceholder")}
              value={filters.district}
              onChangeText={(v) => onChange({ ...filters, district: v })}
            />

            <Text style={[labelStyle, styles.mt]}>
              {t("catalog.drawer.additionalLabel")}
            </Text>
            <View style={styles.checkRow}>
              <Checkbox
                status={filters.verified ? "checked" : "unchecked"}
                onPress={() =>
                  onChange({ ...filters, verified: !filters.verified })
                }
              />
              <Text onPress={() => onChange({ ...filters, verified: !filters.verified })}>
                {t("catalog.drawer.verified")}
              </Text>
            </View>
            <View style={styles.checkRow}>
              <Checkbox
                status={filters.popular ? "checked" : "unchecked"}
                onPress={() =>
                  onChange({ ...filters, popular: !filters.popular })
                }
              />
              <Text onPress={() => onChange({ ...filters, popular: !filters.popular })}>
                {t("catalog.popular")}
              </Text>
            </View>
            <View style={styles.checkRow}>
              <Checkbox
                status={filters.hasInstallment ? "checked" : "unchecked"}
                onPress={() =>
                  onChange({
                    ...filters,
                    hasInstallment: !filters.hasInstallment,
                  })
                }
              />
              <Text
                onPress={() =>
                  onChange({
                    ...filters,
                    hasInstallment: !filters.hasInstallment,
                  })
                }
              >
                {t("projectCard.installment")}
              </Text>
            </View>
          </ScrollView>

          <Divider style={styles.divider} />
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
            >
              {t("catalog.drawer.apply")}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.lg,
    marginTop: 48,
    marginBottom: 48,
    borderRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "88%",
  },
  title: { fontWeight: "900", marginBottom: 4 },
  desc: { opacity: 0.7, marginBottom: spacing.md },
  scroll: { paddingBottom: spacing.lg, gap: spacing.sm },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#64748B",
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
    marginLeft: -8,
  },
  divider: { marginVertical: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
  btn: { flex: 1 },
});
