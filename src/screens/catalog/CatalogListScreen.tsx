import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
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
import { ProjectCatalogCard } from "./ProjectCatalogCard";
import { Screen } from "../../ui/Screen";
import { spacing } from "../../theme/tokens";

type Props = NativeStackScreenProps<CatalogStackParamList, "CatalogList">;

export function CatalogListScreen({ navigation }: Props) {
  const { t } = useI18n();
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
    void (async () => {
      try {
        setError(null);
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("catalog.title"),
      headerRight: () => (
        <IconButton
          icon="filter-variant"
          onPress={() => setFilterOpen(true)}
          accessibilityLabel={t("catalog.filters")}
        />
      ),
    });
  }, [navigation, t]);

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
        <ActivityIndicator size="large" />
        <Text style={styles.mt}>{t("common.loading")}</Text>
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
