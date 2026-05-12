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
  { method = "GET", body, token, headers, ...rest }: RequestOptions = {},
  search?: URLSearchParams,
): Promise<T> {
  const finalHeaders = new Headers(headers);
  if (!(body instanceof FormData) && body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  const res = await fetch(buildUrl(path, search), {
    method,
    headers: finalHeaders,
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    ...rest,
  });

  const text = await res.text();
  const data = text ? safeParseJson(text) : null;

  if (!res.ok) {
    const parsed = isApiErrorsPayload(data)
      ? parseApiErrors(data)
      : {
          message:
            typeof data === "object" && data && "message" in data
              ? String((data as { message: unknown }).message)
              : res.statusText || "Ошибка сети",
          fieldErrors: {},
        };
    throw new ApiRequestError(res.status, data ?? text, parsed);
  }

  return data as T;
}

function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
