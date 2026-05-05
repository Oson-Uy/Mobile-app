import React, { useEffect } from "react";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DeveloperStackParamList } from "../../navigation/RootNavigator";
import { getToken } from "../../auth/token";

type Props = NativeStackScreenProps<DeveloperStackParamList, "DeveloperGate">;

export function DeveloperGateScreen({ navigation }: Props) {
  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (token) navigation.replace("DeveloperHome");
      else navigation.replace("DeveloperLogin");
    })();
  }, [navigation]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

