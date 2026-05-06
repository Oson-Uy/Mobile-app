import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToDeveloperLoginFromSettings() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("DeveloperLogin", { finishMode: "goBackMain" });
  }
}
