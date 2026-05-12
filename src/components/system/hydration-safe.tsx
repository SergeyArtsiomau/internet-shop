"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type HydrationSafeProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

/** Убираем миграции между SSR и сохранением в localStorage */
export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setReady(true));
  }, []);

  if (!ready) return fallback;
  return children;
}
