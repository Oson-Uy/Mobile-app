import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { apiFetch } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegisterResult =
  | { ok: true; token: string }
  | {
      ok: false;
      reason: "simulator" | "denied" | "no_project_id" | "token_error" | "sync_error";
      message?: string;
    };

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromExtra = extra?.eas?.projectId?.trim();
  if (fromExtra) return fromExtra;
  const fromEas = Constants.easConfig?.projectId?.trim();
  if (fromEas) return fromEas;
  return undefined;
}

/** Регистрирует Expo Push Token и отправляет на API (только кабинет застройщика). */
export async function registerForPushAndSyncToken(): Promise<PushRegisterResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: "simulator" };
  }

  if (Device.osName === "Android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = req.status;
  }
  if (status !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    return { ok: false, reason: "no_project_id" };
  }

  let token: string;
  try {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch (e) {
    return {
      ok: false,
      reason: "token_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    await apiFetch("/developers/me/push-tokens", {
      method: "POST",
      body: JSON.stringify({
        expoPushToken: token,
        platform: Device.osName ?? "unknown",
      }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: "sync_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  return { ok: true, token };
}
