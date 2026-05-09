import { getApiUrl } from "./config";
import { getToken } from "../auth/token";

/** Без таймаута fetch на Android может «висеть» минутами (неверный хост, сеть, TLS). */
const FETCH_TIMEOUT_MS = 18_000;

export class ApiAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "ApiAuthError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

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

