import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { apiFetch } from "../../api/client";
import { useI18n } from "../../i18n/I18nProvider";
import type { CatalogStackParamList } from "../../navigation/RootNavigator";

type ApiProjectRow = {
  id: number;
  name: string;
  location: string;
  district?: string | null;
  imageUrl?: string | null;
};

type Props = NativeStackScreenProps<CatalogStackParamList, "CatalogList">;

export function CatalogListScreen({ navigation }: Props) {
  const { t } = useI18n();
  const [items, setItems] = useState<ApiProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await apiFetch<ApiProjectRow[]>("/projects");
    setItems(data);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      data={items}
      keyExtractor={(i) => String(i.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={{ paddingVertical: 24 }}>
          <Text>{loading ? t("common.loading") : "—"}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card
          style={{ marginBottom: 12 }}
          onPress={() => navigation.navigate("ProjectDetails", { id: item.id })}
        >
          <Card.Title title={item.name} subtitle={item.district ?? item.location} />
          <Card.Content>
            <Text variant="bodySmall">{item.location}</Text>
          </Card.Content>
        </Card>
      )}
    />
  );
}

