import { CommonActions, createNavigationContainerRef } from "@react-navigation/native";

import type { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Открыть полный кабинет застройщика (стек Gate → Login / Home). */
export function navigateToDeveloperWorkspace() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("DeveloperWorkspace");
  }
}

/** Закрыть кабинет и вернуться к каталогу (сброс стека — для logout и кнопки «Каталог»). */
export function exitDeveloperWorkspace() {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Main" }],
    }),
  );
}

/** @deprecated Используйте navigateToDeveloperWorkspace */
export function navigateToDeveloperLoginFromSettings() {
  navigateToDeveloperWorkspace();
}
