import { getApiUrl } from "./config";
import { getToken } from "../auth/token";

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
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    throw new ApiAuthError();
  }
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

