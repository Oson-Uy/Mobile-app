import * as SecureStore from "expo-secure-store";

import { getSecureItemWithTimeout } from "../lib/secureRead";

const TOKEN_KEY = "oson_uy_token";

export async function getToken(): Promise<string | null> {
  return getSecureItemWithTimeout(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

