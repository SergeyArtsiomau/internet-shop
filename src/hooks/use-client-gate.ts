"use client";

import { useEffect, useState } from "react";

/** Минимальная задержка, чтобы zustand persist успел подтянуть localStorage */
export function useClientGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return ready;
}
