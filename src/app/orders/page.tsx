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
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const listParams = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize: 8,
    }),
    [currentPage],
  );

  const {
    data: ordersResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders", token, currentPage],
    queryFn: () => fetchOrders(listParams, token),
    enabled: Boolean(token),
  });

  const saveOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => patchOrder(token!, id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });

  const allStatuses = Object.values(OrderStatus);

  const pageCount =
    ordersResponse?.pagination && ordersResponse.pagination.pageSize !== 0
      ? Math.max(
          1,
          Math.ceil(ordersResponse.pagination.total / ordersResponse.pagination.pageSize),
        )
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

      {isLoading ? (
        <div className="rounded-3xl border border-dashed px-6 py-14 text-neutral-600 dark:text-neutral-300">
          Подтягиваем заказы Otus REST…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-3xl border border-red-400/70 bg-red-500/15 px-5 py-4 text-red-900 dark:bg-red-500/35 dark:text-red-50">
          Не удалось получить список заказов.
        </div>
      ) : null}

      <div className="grid gap-6">
        {ordersResponse?.data.map((order) => {
          const isUpdatingThisOrder =
            saveOrderStatus.isPending && saveOrderStatus.variables?.id === order.id;
          return (
            <OrderCard
              key={order.id}
              order={order}
              statuses={allStatuses}
              statusBusy={isUpdatingThisOrder}
              onStatusChange={(status) => saveOrderStatus.mutate({ id: order.id, status })}
            />
          );
        })}
      </div>

      {!ordersResponse?.data.length && !isLoading ? (
        <div className="soft-card px-10 py-12 text-neutral-700 dark:text-neutral-200">
          Пока пусто. Оформите заказ через корзину — появится и здесь.
        </div>
      ) : null}

      <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--border)] pt-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Страница {ordersResponse?.pagination.pageNumber ?? currentPage} из {Math.max(pageCount, 1)}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="pill"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((n) => Math.max(1, n - 1))}
          >
            Ранее
          </button>
          <button
            type="button"
            className="pill"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage((n) => n + 1)}
          >
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
  statusBusy: boolean;
  onStatusChange(status: OrderStatus): void;
};

function OrderCard({ order, statuses, statusBusy, onStatusChange }: OrderCardProps) {
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
              disabled={statusBusy}
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
        {order.products.map((row) => {
          const product = row.product;
          const imageSrc = product ? resolveMediaUrl(product.photo) : undefined;
          const name = product?.name ?? "Товар недоступен";
          const totalRub =
            product != null ? (product.price * row.quantity).toFixed(2) : null;
          return (
            <div key={`${order.id}-${row._id}`} className="rounded-2xl border border-[var(--border)] px-4 py-3">
              <div className="flex gap-3">
                {imageSrc ? (
                  <img src={imageSrc} alt={name} className="h-24 w-24 rounded-xl object-cover" />
                ) : (
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-200 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    aria-hidden
                  >
                    {product ? "Нет фото" : "—"}
                  </div>
                )}
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{name}</p>
                  <p className="text-neutral-600 dark:text-neutral-400">× {row.quantity}</p>
                  <p>{totalRub != null ? `${totalRub} ₽` : "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
