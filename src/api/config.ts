import Constants from "expo-constants";

export function getApiUrl(): string {
  const extra: any = Constants.expoConfig?.extra ?? {};
  const raw = (extra.apiUrl as string | undefined)?.trim();
  return raw || "http://localhost:3002";
}

