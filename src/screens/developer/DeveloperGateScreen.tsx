import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { DeveloperStackParamList } from "../../navigation/types";
import { getToken } from "../../auth/token";
import { registerForPushAndSyncToken } from "../../push/register";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

type Props = NativeStackScreenProps<DeveloperStackParamList, "DeveloperGate">;

const GATE_MS = 8000;

export function DeveloperGateScreen({ navigation }: Props) {
  const doneRef = useRef(false);

  useEffect(() => {
    const goLogin = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigation.replace("DeveloperLogin", { finishMode: "replaceHome" });
    };
    const goHome = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigation.replace("DeveloperHome");
      void registerForPushAndSyncToken();
    };

    const watchdog = setTimeout(goLogin, GATE_MS);

    void (async () => {
      try {
        const token = await getToken();
        clearTimeout(watchdog);
        if (token) goHome();
        else goLogin();
      } catch {
        clearTimeout(watchdog);
        goLogin();
      }
    })();

    return () => clearTimeout(watchdog);
  }, [navigation]);

  return (
    <View style={{ flex: 1 }}>
      <FullScreenLoader />
    </View>
  );
}

