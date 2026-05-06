import Constants from "expo-constants";

const DEV_FALLBACK = "http://10.0.2.2:3002";

function readExtra(): Record<string, unknown> | undefined {
  const a = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  if (a) return a;
  const m = Constants.manifest as { extra?: Record<string, unknown> } | null;
  if (m?.extra) return m.extra;
  const m2 = Constants.manifest2 as { extra?: Record<string, unknown> } | null;
  return m2?.extra;
}

export function getApiUrl(): string {
  const raw = (readExtra()?.apiUrl as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (__DEV__) return DEV_FALLBACK;
  return "https://api.oson-uy.uz";
}

