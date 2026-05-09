import { createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Открыть полный кабинет застройщика (стек Gate → Login / Home). */
export function navigateToDeveloperWorkspace() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("DeveloperWorkspace");
  }
}

/** Закрыть кабинет и вернуться к каталогу. */
export function exitDeveloperWorkspace() {
  if (!navigationRef.isReady()) return;
  if (navigationRef.canGoBack()) {
    navigationRef.goBack();
  } else {
    navigationRef.navigate("Main");
  }
}

/** @deprecated Используйте navigateToDeveloperWorkspace */
export function navigateToDeveloperLoginFromSettings() {
  navigateToDeveloperWorkspace();
}
