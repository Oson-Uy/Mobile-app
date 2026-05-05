import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Button, Card, Chip, Divider, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";

type Props = NativeStackScreenProps<CatalogStackParamList, "ProjectDetails">;

type ApiFloor = {
  id: number;
  floor: number;
  pricePerM2: number;
  layouts: { id?: number; imageUrl: string; title?: string | null }[];
  areaOptions: { areaSqm: number }[];
};

type ApiProject = {
  id: number;
  name: string;
  location: string;
  district?: string | null;
  deliveryDate: string;
  imageUrl?: string | null;
  media?: { imageUrl: string }[];
  floors?: ApiFloor[];
  hasInstallment?: boolean;
};

export function ProjectDetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [data, setData] = useState<ApiProject | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const load = async () => {
    const p = await apiFetch<ApiProject>(`/projects/${id}/full`);
    setData(p);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const gallery = useMemo(() => {
    if (!data) return [];
    const imgs =
      data.media?.length ? data.media.map((m) => m.imageUrl) : [];
    if (imgs.length) return imgs.filter(Boolean);
    return data.imageUrl ? [data.imageUrl] : [];
  }, [data]);

  if (!data) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const place = [data.district, data.location].filter(Boolean).join(", ");

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={{ overflow: "hidden" }}>
        {gallery.length ? (
          <>
            <FlatList
              data={gallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(u, idx) => `${idx}-${u.slice(-24)}`}
              onMomentumScrollEnd={(e) => {
                const w = e.nativeEvent.layoutMeasurement.width;
                const x = e.nativeEvent.contentOffset.x;
                setActiveImg(Math.round(x / w));
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: 340, height: 210 }}
                  resizeMode="cover"
                />
              )}
            />
            <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
              {gallery.slice(0, 8).map((u, idx) => (
                <Pressable
                  key={`${idx}-${u.slice(-16)}`}
                  onPress={() => setActiveImg(idx)}
                >
                  <Image
                    source={{ uri: u }}
                    style={{
                      width: 52,
                      height: 40,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: activeImg === idx ? "#F97316" : "transparent",
                    }}
                  />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleLarge" style={{ fontWeight: "900" }}>
            {data.name}
          </Text>
          <Text>{place}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {data.hasInstallment ? <Chip>Installment</Chip> : null}
            <Chip>Delivery: {data.deliveryDate}</Chip>
          </View>
          <Divider />
          <Button
            mode="contained"
            onPress={() =>
              navigation.navigate("LeadForm", {
                projectId: data.id,
                projectName: data.name,
              })
            }
          >
            Leave request
          </Button>
        </Card.Content>
      </Card>

      <View style={{ height: 16 }} />

      <Card>
        <Card.Title title="Floors" />
        <Card.Content style={{ gap: 10 }}>
          {(data.floors ?? [])
            .slice()
            .sort((a, b) => b.floor - a.floor)
            .slice(0, 12)
            .map((f) => (
              <Pressable
                key={f.id}
                onPress={() =>
                  navigation.navigate("LeadForm", {
                    projectId: data.id,
                    floorId: f.id,
                    projectName: data.name,
                  })
                }
              >
                <View
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <Text style={{ fontWeight: "800" }}>{f.floor} floor</Text>
                  <Text variant="bodySmall">
                    {Math.round(f.pricePerM2)} UZS / m²
                  </Text>
                </View>
              </Pressable>
            ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

