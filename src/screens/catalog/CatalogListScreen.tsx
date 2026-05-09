import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { FlatList, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { HeaderButton } from "@react-navigation/elements";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import {
  defaultCatalogFilters,
  filterCatalogProjects,
  normalizeFiltersForQuery,
  type CatalogFilterState,
} from "../../catalog/filterProjects";
import type { ApiProjectListItem } from "../../types/project";
import { CatalogFilterModal } from "./CatalogFilterModal";
import { FullScreenLoader } from "../../ui/FullScreenLoader";
import { CatalogHero } from "./CatalogHero";
import { CatalogSettingsModal } from "./CatalogSettingsModal";
import { ProjectCatalogCard } from "./ProjectCatalogCard";
import { Screen } from "../../ui/Screen";
import { spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "CatalogList">;

const ICON_SIZE = 22;

export function CatalogListScreen({ navigation }: Props) {
  const { t } = useI18n();
  const theme = useTheme();
  const [raw, setRaw] = useState<ApiProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilterState>(
    defaultCatalogFilters,
  );
  const [draftFilters, setDraftFilters] = useState<CatalogFilterState>(
    defaultCatalogFilters,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (filterOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [filterOpen, appliedFilters]);

  const normalizedApplied = useMemo(
    () => normalizeFiltersForQuery(appliedFilters),
    [appliedFilters],
  );

  const items = useMemo(
    () => filterCatalogProjects(raw, normalizedApplied),
    [raw, normalizedApplied],
  );

  const load = useCallback(async () => {
    const data = await apiFetch<ApiProjectListItem[]>("/projects");
    setRaw(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setError(null);
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /** Страховка: если запрос не завершился (редкий зависание сокета) — уходим с ошибкой. */
  useEffect(() => {
    if (!loading) return;
    const id = setTimeout(() => {
      setLoading(false);
      setError((prev) => prev ?? t("common.loadError"));
    }, 22_000);
    return () => clearTimeout(id);
  }, [loading, t]);

  useLayoutEffect(() => {
    const iconColor = theme.colors.primary;
    navigation.setOptions({
      title: t("catalog.title"),
      headerRight: () => (
        <>
          <HeaderButton
            accessibilityLabel={t("catalog.settings")}
            onPress={() => setSettingsOpen(true)}
          >
            <MaterialCommunityIcons name="cog-outline" size={ICON_SIZE} color={iconColor} />
          </HeaderButton>
          <HeaderButton
            accessibilityLabel={t("catalog.filters")}
            onPress={() => setFilterOpen(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={ICON_SIZE} color={iconColor} />
          </HeaderButton>
        </>
      ),
    });
  }, [navigation, t, theme.colors.primary, theme.colors.outlineVariant]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setRefreshing(false);
    }
  };

  const resetFilters = () => {
    setAppliedFilters(defaultCatalogFilters);
    setDraftFilters(defaultCatalogFilters);
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <FullScreenLoader message={t("common.loading")} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.error}>{t("common.loadError")}</Text>
        <Button mode="contained" onPress={() => void onRefresh()} style={styles.mt}>
          {t("common.retry")}
        </Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <CatalogSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <CatalogFilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => {
          setAppliedFilters(normalizeFiltersForQuery(draftFilters));
        }}
        onReset={() => {
          resetFilters();
          setFilterOpen(false);
        }}
      />
      <FlatList
        ListHeaderComponent={<CatalogHero />}
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {t("catalog.noResults")}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyHint}>
              {t("catalog.noResultsHint")}
            </Text>
            <Button mode="outlined" onPress={resetFilters} style={styles.mt}>
              {t("catalog.drawer.reset")}
            </Button>
          </View>
        }
        renderItem={({ item }) => (
          <ProjectCatalogCard
            project={item}
            onPress={() => navigation.navigate("ProjectDetails", { id: item.id })}
            onLeaveRequest={() =>
              navigation.navigate("LeadForm", {
                projectId: item.id,
                projectName: item.name,
              })
            }
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  mt: { marginTop: spacing.md },
  error: { color: "#DC2626", textAlign: "center" },
  empty: {
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  emptyTitle: { fontWeight: "800", textAlign: "center" },
  emptyHint: { opacity: 0.7, textAlign: "center", marginTop: spacing.sm },
});
