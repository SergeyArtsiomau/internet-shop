"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore, calculateCartTotals } from "@/store/cart-store";
import { useThemeStore, type ThemeState } from "@/store/theme-store";
import { HydrationSafe } from "@/components/system/hydration-safe";
import { SHOP_NAME } from "@/lib/site";

const nav = [
  { href: "/", label: "Каталог" },
  { href: "/cart", label: "Корзина" },
  { href: "/orders", label: "Заказы" },
  { href: "/categories", label: "Категории" },
] as const;

const themeSequence: ThemeState["theme"][] = ["system", "light", "dark"];

function HeaderActions({
  themeLabel,
  onCycleTheme,
  token,
}: {
  themeLabel: string;
  onCycleTheme(): void;
  token: string | null;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onCycleTheme}
        className="pill shrink-0 border-dashed px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200"
        title="Переключить тему"
      >
        {themeLabel}
      </button>
      <HydrationSafe fallback={<span className="pill shrink-0 px-3 py-2 text-sm text-neutral-500">…</span>}>
        {token ? (
          <Link
            href="/profile"
            className="pill shrink-0 border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white dark:text-[#1b0b07]"
          >
            Профиль
          </Link>
        ) : (
          <>
            <Link href="/login" className="pill shrink-0 px-3 py-2 text-sm font-medium">
              Вход
            </Link>
            <Link
              href="/register"
              className="pill shrink-0 border-[var(--accent)] bg-[var(--accent-muted)] px-3 py-2 text-sm font-semibold"
            >
              Регистрация
            </Link>
          </>
        )}
      </HydrationSafe>
    </>
  );
}

function NavLinks({
  pathname,
  quantity,
}: {
  pathname: string;
  quantity: number;
}) {
  return (
    <>
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
              "pill inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-[rgba(220,132,107,0.45)] bg-[var(--accent-muted)] dark:border-[rgba(255,173,146,0.35)]"
                : "hover:border-[var(--accent)]",
            )}
          >
            {item.label}
            {badgeNeeded ? (
              <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[0.65rem] leading-none text-white">
                {quantity}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const token = useAuthStore((state) => state.token);
  const items = useCartStore((state) => state.items);
  const { quantity } = calculateCartTotals(items);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const cycleTheme = () => {
    const idx = themeSequence.indexOf(theme);
    setTheme(themeSequence[(idx + 1) % themeSequence.length]);
  };

  const themeLabel =
    theme === "system" ? "Системная" : theme === "dark" ? "Тёмная" : "Светлая";

  const actions = (
    <HeaderActions themeLabel={themeLabel} onCycleTheme={cycleTheme} token={token} />
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,17rem)_1fr_auto] lg:items-center lg:gap-x-8 lg:gap-y-0">
          <div className="flex items-center justify-between gap-3 lg:contents">
            <Link
              href="/"
              className="min-w-0 font-[family-name:var(--font-display)] text-base font-semibold leading-snug sm:text-lg lg:col-start-1 lg:text-[1.15rem]"
              aria-label="Главная"
            >
              {SHOP_NAME}
            </Link>
            <div className="flex shrink-0 items-center gap-2 lg:hidden">{actions}</div>
          </div>

          <nav
            className={clsx(
              "flex items-center gap-2 overflow-x-auto pb-0.5",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              "lg:col-start-2 lg:justify-center lg:overflow-visible lg:pb-0",
            )}
            aria-label="Основное меню"
          >
            <NavLinks pathname={pathname} quantity={quantity} />
          </nav>

          <div className="hidden items-center justify-end gap-2 lg:col-start-3 lg:flex">{actions}</div>
        </div>
      </div>
    </header>
  );
}
