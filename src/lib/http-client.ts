import { API_URL } from "@/lib/env";
import { isApiErrorsPayload, parseApiErrors, type ParsedApiError } from "@/lib/api-errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
};

export class ApiRequestError extends Error {
  status: number;

  parsed: ParsedApiError;

  raw: unknown;

  constructor(status: number, raw: unknown, parsed: ParsedApiError) {
    super(parsed.message || "ApiRequestError");
    this.status = status;
    this.raw = raw;
    this.parsed = parsed;
  }
}

function buildUrl(path: string, search?: URLSearchParams): string {
  const base = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  return search && [...search].length ? `${base}?${search.toString()}` : base;
}

export async function httpRequest<T>(
  path: string,
  { method = "GET", body, token, headers: headersInit, ...rest }: RequestOptions = {},
  search?: URLSearchParams,
): Promise<T> {
  const headers = new Headers(headersInit);
  if (!(body instanceof FormData) && body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, search), {
    method,
    headers,
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    ...rest,
  });

  const rawText = await response.text();
  const payload = rawText ? safeParseJson(rawText) : null;

  if (!response.ok) {
    const parsed = isApiErrorsPayload(payload)
      ? parseApiErrors(payload)
      : {
          message:
            typeof payload === "object" && payload && "message" in payload
              ? String((payload as { message: unknown }).message)
              : response.statusText || "Ошибка сети",
          fieldErrors: {},
        };
    throw new ApiRequestError(response.status, payload ?? rawText, parsed);
  }

  return payload as T;
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
