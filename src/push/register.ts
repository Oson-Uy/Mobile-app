import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { apiFetch } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushAndSyncToken(): Promise<void> {
  if (!Device.isDevice) return; // real device required

  if (Device.osName === "Android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await apiFetch("/developers/me/push-tokens", {
    method: "POST",
    body: JSON.stringify({
      expoPushToken: token,
      platform: Device.osName ?? "unknown",
    }),
  });
}

