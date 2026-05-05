import React, { useEffect } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DeveloperStackParamList } from "../../navigation/RootNavigator";
import { getToken } from "../../auth/token";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

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
    <View style={{ flex: 1 }}>
      <FullScreenLoader />
    </View>
  );
}

