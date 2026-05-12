"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { ThemeSwitchListener } from "@/components/system/theme-switch-listener";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (attempts, err: unknown) => {
              const status =
                typeof err === "object" && err !== null && "status" in err
                  ? (err as { status?: number }).status
                  : undefined;
              const retriable = status === undefined || (status >= 500 && status < 600);
              return attempts < 2 && status !== 401 && retriable;
            },
            staleTime: 45_000,
          },
          mutations: { retry: false },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeSwitchListener />
      {children}
    </QueryClientProvider>
  );
}
