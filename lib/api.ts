const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function isPrivateLanHost(host: string) {
  return /^192\.168\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host);
}

export function apiBaseUrl(): string {
  if (typeof window !== "undefined" && isPrivateLanHost(window.location.hostname)) {
    return window.location.origin;
  }

  return configuredApiUrl;
}

export const API_URL = configuredApiUrl;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  code?: string;

  constructor(message: string, status: number, errors?: Record<string, string[]>, code?: string) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

export function fieldError(error: unknown, field: string): string | undefined {
  if (error instanceof ApiError) {
    return error.errors?.[field]?.[0];
  }
  return undefined;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

export async function ensureCsrf(): Promise<void> {
  await fetch(`${apiBaseUrl()}/api/v1/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    await ensureCsrf();
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.message ?? "Something went wrong. Please try again.",
      response.status,
      body?.errors,
      body?.code,
    );
  }

  return body as T;
}

export async function downloadAuthorized(url: string, filename: string): Promise<void> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new ApiError("The download could not be started.", response.status);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
