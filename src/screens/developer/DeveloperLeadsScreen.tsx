import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

import { apiFetch } from "../../api/client";

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
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      data={items}
      keyExtractor={(i) => String(i.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 12 }}>
          <Card.Title
            title={item.name}
            subtitle={`${item.project?.name ?? "—"}${item.floor ? ` · floor ${item.floor.floor}` : ""}`}
          />
          <Card.Content style={{ gap: 8 }}>
            <Text variant="bodySmall">{item.phone}</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Chip>{item.status}</Chip>
              {item.status === "NEW" ? (
                <Button mode="contained" onPress={() => void markContacted(item.id)}>
                  Mark contacted
                </Button>
              ) : null}
            </View>
          </Card.Content>
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

