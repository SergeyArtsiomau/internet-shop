"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { ORDER_STATUS_LABEL } from "@/lib/order-i18n";
import { resolveMediaUrl } from "@/lib/media-url";
import { fetchOrders, patchOrder } from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";
import { OrderStatus, type Order } from "@/types/shop";

function OrdersDashboard() {
  const token = useAuthStore((state) => state.token);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const filters = useMemo(
    () => ({
      pageNumber: page,
      pageSize: 8,
    }),
    [page],
  );

  const ordersQuery = useQuery({
    queryKey: ["orders", token, page],
    queryFn: () => fetchOrders(filters, token),
    enabled: Boolean(token),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => patchOrder(token!, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const statuses = Object.values(OrderStatus);

  const totalPages =
    ordersQuery.data?.pagination && ordersQuery.data.pagination.pageSize !== 0
      ? Math.max(1, Math.ceil(ordersQuery.data.pagination.total / ordersQuery.data.pagination.pageSize))
      : 1;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">История клиента</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Заказы</h1>
        <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          После успешной оплаты (эмуляция) можно отследить каждую позицию. Статус доступен каждому владельцу заказа,
          PATCH уходит только на свой id.
        </p>
      </header>

      {ordersQuery.isLoading ? (
        <div className="rounded-3xl border border-dashed px-6 py-14 text-neutral-600 dark:text-neutral-300">
          Подтягиваем заказы Otus REST…
        </div>
      ) : null}

      {ordersQuery.isError ? (
        <div className="rounded-3xl border border-red-400/70 bg-red-500/15 px-5 py-4 text-red-900 dark:bg-red-500/35 dark:text-red-50">
          Не удалось получить список заказов.
        </div>
      ) : null}

      <div className="grid gap-6">
        {ordersQuery.data?.data.map((order) => {
          const syncing =
            statusMutation.isPending && statusMutation.variables?.id === order.id;
          return (
            <OrderCard
              key={order.id}
              order={order}
              statuses={statuses}
              syncing={syncing}
              onStatusChange={(status) => statusMutation.mutate({ id: order.id, status })}
            />
          );
        })}
      </div>

      {!ordersQuery.data?.data.length && !ordersQuery.isLoading ? (
        <div className="soft-card px-10 py-12 text-neutral-700 dark:text-neutral-200">
          Пока пусто. Оформите заказ через корзину — появится и здесь.
        </div>
      ) : null}

      <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--border)] pt-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Страница {ordersQuery.data?.pagination.pageNumber ?? page} из {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-3">
          <button type="button" className="pill" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Ранее
          </button>
          <button type="button" className="pill" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Далее
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedGate>
      <OrdersDashboard />
    </ProtectedGate>
  );
}

type OrderCardProps = {
  order: Order;
  statuses: OrderStatus[];
  syncing: boolean;
  onStatusChange(status: OrderStatus): void;
};

function OrderCard({ order, statuses, syncing, onStatusChange }: OrderCardProps) {
  return (
    <article className="soft-card px-8 py-6">
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Заказ {order.id}</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}
          </p>
          <label className="flex flex-wrap items-center gap-3 text-sm">
            Статус
            <select
              className="pill bg-transparent px-4 py-2"
              disabled={syncing}
              value={order.status}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-3xl bg-[color-mix(in_srgb,var(--accent-muted)_92%,transparent)] px-5 py-4 text-xs uppercase tracking-[0.25em] text-neutral-700 dark:text-neutral-200">
          Площадка сервера: {ORDER_STATUS_LABEL[order.status]}
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {order.products.map((line) => {
          const thumb = resolveMediaUrl(line.product.photo);
          return (
            <div key={`${order.id}-${line._id}`} className="rounded-2xl border border-[var(--border)] px-4 py-3">
              <div className="flex gap-3">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={line.product.name} className="h-24 w-24 rounded-xl object-cover" />
                ) : null}
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{line.product.name}</p>
                  <p className="text-neutral-600 dark:text-neutral-400">× {line.quantity}</p>
                  <p>{(line.product.price * line.quantity).toFixed(2)} ₽</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
