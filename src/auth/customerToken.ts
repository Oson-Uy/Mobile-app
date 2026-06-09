import * as SecureStore from "expo-secure-store";

import { getSecureItemWithTimeout } from "../lib/secureRead";

const CUSTOMER_TOKEN_KEY = "osonuy_customer_token";

export async function getCustomerToken(): Promise<string | null> {
  return getSecureItemWithTimeout(CUSTOMER_TOKEN_KEY);
}

export async function setCustomerToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CUSTOMER_TOKEN_KEY, token);
}

export async function clearCustomerToken(): Promise<void> {
  await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
}
