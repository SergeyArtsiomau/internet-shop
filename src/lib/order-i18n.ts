import { OrderStatus } from "@/types/shop";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PendingConfirmation]: "Ждём подтверждение",
  [OrderStatus.Processing]: "В обработке",
  [OrderStatus.Packaging]: "Комплектация",
  [OrderStatus.WaitingForDelivery]: "Ожидает отгрузки",
  [OrderStatus.InTransit]: "В пути",
  [OrderStatus.Delivered]: "Доставлен",
  [OrderStatus.ReturnRequested]: "Оформлен возврат",
  [OrderStatus.OrderCancelled]: "Отменён",
};
