import * as SecureStore from "expo-secure-store";

const READ_MS = 3500;

/**
 * На части Android SecureStore.getItemAsync может долго не отвечать — тогда
 * splash не скрывается (см. App.tsx + провайдеры). Обрываем ожидание и идём с дефолтами.
 */
export async function getSecureItemWithTimeout(
  key: string,
): Promise<string | null> {
  try {
    const timeout = new Promise<"__timeout__">((resolve) => {
      setTimeout(() => resolve("__timeout__"), READ_MS);
    });
    const value = await Promise.race([SecureStore.getItemAsync(key), timeout]);
    if (value === "__timeout__") {
      if (__DEV__) {
        console.warn(
          `[SecureStore] read timed out (${READ_MS}ms) for key: ${key}`,
        );
      }
      return null;
    }
    return value;
  } catch {
    return null;
  }
}
