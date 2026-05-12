"use client";

import clsx from "clsx";
import type { PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title?: string;
  subtitle?: ReactNode;
  footer?: ReactNode;
  onClose(): void;
}>;

export function Modal({ open, title, subtitle, footer, children, onClose }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "keydown",
      (ev) => {
        if (!open) return;
        if (ev.key === "Escape") onClose();
      },
      { signal: controller.signal },
    );

    const previousOverflow = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";

    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!mounted || typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-10 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={clsx(
          "mx-auto grid w-full max-w-4xl gap-6 rounded-3xl border border-neutral-600/35 bg-[rgba(247,246,246,0.92)] p-6 shadow-2xl sm:p-8",
          "dark:bg-[rgba(20,21,31,0.92)]",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle ? (
              <p className="mt-2 text-[0.925rem] text-neutral-700 dark:text-neutral-300">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-xl border px-4 py-2 text-sm uppercase tracking-[0.15em]"
          >
            Закрыть
          </button>
        </header>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-3">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
