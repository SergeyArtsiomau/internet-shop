"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore, calculateCartTotals } from "@/store/cart-store";
import { useThemeStore, type ThemeState } from "@/store/theme-store";
import { HydrationSafe } from "@/components/system/hydration-safe";

const nav = [
  { href: "/", label: "Каталог" },
  { href: "/cart", label: "Корзина" },
  { href: "/orders", label: "Заказы" },
  { href: "/categories", label: "Категории" },
];

const themeSequence: ThemeState["theme"][] = ["system", "light", "dark"];

export function SiteHeader() {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const items = useCartStore((state) => state.items);
  const { quantity } = calculateCartTotals(items);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const cycleTheme = () => {
    const idx = themeSequence.indexOf(theme);
    const next = themeSequence[(idx + 1) % themeSequence.length];
    setTheme(next);
  };

  const themeLabel =
    theme === "system" ? "Системная" : theme === "dark" ? "Тёмная" : "Светлая";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-5 sm:px-6 lg:gap-12">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl sm:text-[1.6rem]" aria-label="Главная">
          Бакалея Побережья
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-3 text-[0.85rem] sm:gap-4 sm:text-sm">
          {nav.map((item) => {
            const active = pathname === item.href;
            const isCart = item.href === "/cart";
            const badgeNeeded = isCart && quantity > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={clsx(
                  "pill inline-flex items-center gap-2 font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-muted)] border-[rgba(220,132,107,0.45)] dark:border-[rgba(255,173,146,0.35)]"
                    : "hover:border-[var(--accent)]",
                )}
              >
                {item.label}
                {badgeNeeded ? (
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[0.7rem] text-white">
                    {quantity}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <button
            type="button"
            onClick={cycleTheme}
            className="pill border-dashed text-xs uppercase tracking-[0.2em] sm:text-[0.75rem]"
          >
            {themeLabel}
          </button>
          <HydrationSafe
            fallback={
              <span className="pill text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                …
              </span>
            }
          >
            {token ? (
              <Link
                href="/profile"
                className="pill border-[var(--accent)] bg-[var(--accent)] text-white dark:text-[#1b0b07]"
              >
                Профиль
              </Link>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link href="/login" className="pill">
                  Вход
                </Link>
                <Link
                  href="/register"
                  className="pill border-[var(--accent)] bg-[var(--accent-muted)] font-semibold"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </HydrationSafe>
        </div>
      </div>
    </header>
  );
}
