import { API_URL } from "@/lib/env";

export function resolveMediaUrl(photo?: string | null): string | undefined {
  return resolveMediaUrlWithBase(photo, API_URL);
}

export function resolveMediaUrlWithBase(
  photo?: string | null,
  apiBase?: string | null,
): string | undefined {
  if (!photo) return undefined;
  if (photo.startsWith("http")) return photo;
  const resolvedBase = apiBase ?? "";
  const origin = resolvedBase.replace(/\/api\/?$/, "");
  const path = photo.startsWith("/") ? photo : `/${photo}`;
  return `${origin}${path}`;
}
