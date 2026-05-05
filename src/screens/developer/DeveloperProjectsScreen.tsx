import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Card, Text } from "react-native-paper";

import { apiFetch } from "../../api/client";

type ApiDeveloper = { id: number; name: string };
type ApiProject = { id: number; name: string; location: string; district?: string | null };

export function DeveloperProjectsScreen() {
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [items, setItems] = useState<ApiProject[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const developer = await apiFetch<ApiDeveloper>("/developers");
    const projects = await apiFetch<any[]>("/projects");
    setDev(developer);
    setItems(projects.filter((p) => p.developerId === developer.id));
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

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      data={items}
      keyExtractor={(i) => String(i.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        dev ? (
          <View style={{ marginBottom: 10 }}>
            <Text variant="titleSmall" style={{ fontWeight: "800" }}>
              {dev.name}
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 12 }}>
          <Card.Title title={item.name} subtitle={[item.district, item.location].filter(Boolean).join(", ")} />
        </Card>
      )}
      ListEmptyComponent={
        <View style={{ paddingVertical: 24 }}>
          <Text>—</Text>
        </View>
      }
    />
  );
}

