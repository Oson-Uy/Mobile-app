import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getCustomerToken } from "../../auth/customerToken";
import type { CabinetStackParamList } from "../../navigation/types";
import { FullScreenLoader } from "../../ui/FullScreenLoader";

type Props = NativeStackScreenProps<CabinetStackParamList, "CabinetGate">;

const GATE_MS = 8000;

export function CabinetGateScreen({ navigation }: Props) {
  const doneRef = useRef(false);

  useEffect(() => {
    const goLogin = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigation.replace("CabinetLogin");
    };
    const goDashboard = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      navigation.replace("CabinetDashboard");
    };

    const watchdog = setTimeout(goLogin, GATE_MS);

    void (async () => {
      try {
        const token = await getCustomerToken();
        clearTimeout(watchdog);
        if (token) goDashboard();
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
