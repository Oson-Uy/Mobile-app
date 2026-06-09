import { getApiUrl } from "./config";
import { getToken } from "../auth/token";
import { clearCustomerToken, getCustomerToken } from "../auth/customerToken";

/** Без таймаута fetch на Android может «висеть» минутами (неверный хост, сеть, TLS). */
const FETCH_TIMEOUT_MS = 18_000;

export class ApiAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ApiAuthError";
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  bearer: string | null,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);

  const base = getApiUrl().replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Request timed out (${FETCH_TIMEOUT_MS / 1000}s)`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiAuthError();
  }
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Invalid response from server");
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  return requestJson<T>(path, init, token);
}

/** Запросы без авторизации. */
export async function apiFetchPublic<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return requestJson<T>(path, init, null);
}

/** Запросы личного кабинета покупателя (телефон + код доступа). */
export async function apiFetchCustomer<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getCustomerToken();
  try {
    return await requestJson<T>(path, init, token);
  } catch (e) {
    if (e instanceof ApiAuthError) {
      await clearCustomerToken();
    }
    throw e;
  }
}
