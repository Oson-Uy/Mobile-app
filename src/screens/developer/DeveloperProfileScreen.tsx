import React, { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";

import { apiFetch } from "../../api/client";
import { clearToken } from "../../auth/token";
import { registerForPushAndSyncToken } from "../../push/register";

type ApiDeveloper = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  legalAddress?: string | null;
  officeAddress?: string | null;
  description?: string | null;
};

export function DeveloperProfileScreen() {
  const [dev, setDev] = useState<ApiDeveloper | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const data = await apiFetch<ApiDeveloper>("/developers");
    setDev(data);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!dev) return;
    setBusy(true);
    try {
      await apiFetch(`/developers/${dev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          phone: dev.phone || undefined,
          website: dev.website || undefined,
          legalAddress: dev.legalAddress || undefined,
          officeAddress: dev.officeAddress || undefined,
          description: dev.description || undefined,
        }),
      });
      Alert.alert("Saved");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await clearToken();
    Alert.alert("Signed out");
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Card>
        <Card.Title title="Profile" subtitle={dev?.name ?? ""} />
        <Card.Content style={{ gap: 10 }}>
          <Text variant="bodySmall">{dev?.email ?? ""}</Text>
          <TextInput
            label="Phone"
            value={dev?.phone ?? ""}
            onChangeText={(v) => setDev((d) => (d ? { ...d, phone: v } : d))}
          />
          <TextInput
            label="Website"
            value={dev?.website ?? ""}
            onChangeText={(v) => setDev((d) => (d ? { ...d, website: v } : d))}
          />
          <TextInput
            label="Legal address"
            value={dev?.legalAddress ?? ""}
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, legalAddress: v } : d))
            }
          />
          <TextInput
            label="Office address"
            value={dev?.officeAddress ?? ""}
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, officeAddress: v } : d))
            }
          />
          <TextInput
            label="Description"
            value={dev?.description ?? ""}
            multiline
            onChangeText={(v) =>
              setDev((d) => (d ? { ...d, description: v } : d))
            }
          />
          <Button mode="contained" loading={busy} onPress={() => void save()}>
            Save
          </Button>
          <Button mode="contained-tonal" onPress={() => void registerForPushAndSyncToken()}>
            Sync push token
          </Button>
          <Button mode="outlined" onPress={() => void signOut()}>
            Sign out
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

