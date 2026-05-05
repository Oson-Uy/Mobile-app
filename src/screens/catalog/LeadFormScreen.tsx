import React, { useState } from "react";
import { Alert, View } from "react-native";
import { Button, Card, TextInput, Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CatalogStackParamList } from "../../navigation/RootNavigator";
import { apiFetch } from "../../api/client";

type Props = NativeStackScreenProps<CatalogStackParamList, "LeadForm">;

function normalizeUzPhoneDigits(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("998")) return digits;
  if (digits.startsWith("8") && digits.length === 10) return "998" + digits.slice(1);
  if (digits.length === 9) return "998" + digits;
  return digits;
}

export function LeadFormScreen({ route, navigation }: Props) {
  const { projectId, floorId, projectName } = route.params;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const clean = normalizeUzPhoneDigits(phone);
    if (clean.length !== 12) {
      Alert.alert("Phone", "Enter a valid Uzbekistan phone number");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/leads", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone: clean,
          projectId,
          floorId,
        }),
      });
      Alert.alert("Done", "We will contact you soon.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Card>
        <Card.Title title="Request a call" subtitle={projectName ?? ""} />
        <Card.Content style={{ gap: 12 }}>
          {floorId ? (
            <Text variant="bodySmall">Floor interest: #{floorId}</Text>
          ) : null}
          <TextInput label="Name" value={name} onChangeText={setName} />
          <TextInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Button mode="contained" loading={busy} onPress={() => void submit()}>
            Submit
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

