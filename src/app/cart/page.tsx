"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiRequestError } from "@/lib/http-client";
import { resolveMediaUrl } from "@/lib/media-url";
import { createOrder } from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";
import { calculateCartTotals, useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const items = useCartStore((state) => state.items);
  const setQty = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  const totals = calculateCartTotals(items);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Нет токена");
      return createOrder(
        token,
        items.map((row) => ({ id: row.productId, quantity: row.quantity })),
      );
    },
    onMutate: () => setCheckoutError(null),
    onSuccess: async () => {
      clear();
      await queryClient.invalidateQueries({ queryKey: ["orders", token ?? "guest"] });
      router.push("/orders");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        setCheckoutError(error.parsed.message);
        return;
      }
      setCheckoutError(error instanceof Error ? error.message : "Заказ не создан");
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Корзина</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Подготовка к отгрузке</h1>
      </header>
      {!items.length ? (
        <div className="soft-card px-8 py-12 text-center">
          Корзина пуста — вернитесь в{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/">
            каталог
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => {
            const thumbUrl = resolveMediaUrl(item.thumb);
            return (
              <article key={item.productId} className="soft-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                <div className="h-36 w-full overflow-hidden rounded-2xl bg-neutral-800 sm:h-28 sm:w-40">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-neutral-400">
                      нет изображения
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold">{item.title}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {item.price.toFixed(2)} ₽ · количество
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      className="w-24 rounded-2xl border border-[var(--border)] px-3 py-2"
                      onChange={(event) => setQty(item.productId, Number(event.target.value))}
                    />
                    <button type="button" className="text-sm text-red-500" onClick={() => removeLine(item.productId)}>
                      Убрать
                    </button>
                  </div>
                </div>
                <div className="text-right text-xl font-semibold">
                  {(item.price * item.quantity).toFixed(2)} ₽
                </div>
              </article>
            );
          })}
        </div>
      )}
      {items.length ? (
        <div className="soft-card grid gap-4 px-8 py-6 text-sm leading-relaxed sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Количество единиц: <span className="font-semibold text-[var(--foreground)]">{totals.quantity}</span>
            </p>
            <p className="text-3xl font-bold">{totals.sum.toFixed(2)} ₽</p>
          </div>
          <button
            type="button"
            disabled={checkout.isPending}
            className="pill border-[var(--accent)] bg-[var(--accent)] text-white dark:text-[#22110b]"
            onClick={() => {
              if (!token) {
                router.push(`/login?next=${encodeURIComponent("/cart")}`);
                return;
              }
              checkout.mutate();
            }}
          >
            Оформить заказ через API
          </button>
        </div>
      ) : null}
      {checkoutError ? (
        <div className="rounded-3xl border border-red-400/70 bg-red-500/15 px-5 py-4 text-red-950 dark:bg-red-500/25 dark:text-red-50">
          {checkoutError}
        </div>
      ) : null}
    </div>
  );
}
