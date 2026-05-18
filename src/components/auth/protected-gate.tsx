"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useClientGate } from "@/hooks/use-client-gate";

type ProtectedGateProps = {
  children: ReactNode;
};

export function ProtectedGate({ children }: ProtectedGateProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const mounted = useClientGate();

  useEffect(() => {
    if (!mounted) return;
    if (!token) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      router.replace(`/login?next=${next}`);
    }
  }, [mounted, router, token]);

  if (!mounted) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Подготавливаем доступ…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Перенаправляем на страницу входа…
      </div>
    );
  }

  return <>{children}</>;
}
