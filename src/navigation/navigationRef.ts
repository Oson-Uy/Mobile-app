import { router } from "expo-router";

/** Открыть полный кабинет застройщика (стек Gate → Login / Home). */
export function navigateToDeveloperWorkspace() {
  router.push("/developer");
}

/** Закрыть кабинет и вернуться к каталогу. */
export function exitDeveloperWorkspace() {
  router.replace("/(buyer)/(catalog)");
}
