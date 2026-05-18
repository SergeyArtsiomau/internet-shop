export type Category = {
  id: string;
  name: string;
  photo?: string;
  commandId: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  photo?: string;
  desc?: string;
  createdAt: string;
  updatedAt: string;
  oldPrice?: number;
  price: number;
  commandId: string;
  category: Category;
};

export enum OrderStatus {
  PendingConfirmation = "pending_confirmation",
  Processing = "processing",
  Packaging = "packaging",
  WaitingForDelivery = "waiting_for_delivery",
  InTransit = "in_transit",
  Delivered = "delivered",
  ReturnRequested = "return_requested",
  OrderCancelled = "order_cancelled",
}

export type OrderProduct = {
  _id: string;
  product: Product | null;
  quantity: number;
};

export type OrderUser = {
  id: string;
  name?: string;
  commandId?: string;
};

export type Order = {
  id: string;
  products: OrderProduct[];
  status: OrderStatus;
  user: OrderUser;
  createdAt: string;
  updatedAt: string;
  commandId: string;
};

export type Profile = {
  id: string;
  name?: string;
  email: string;
  signUpDate: string;
  commandId?: string;
};

export type AuthResponse = {
  token: string;
  profile?: Profile;
};

export type SortingField = "id" | "createdAt" | "updatedAt" | "name" | "date";

export type SortDirection = "ASC" | "DESC";

export type Pagination = {
  pageSize: number;
  pageNumber: number;
  total: number;
};

export type ListResponse<T> = {
  data: T[];
  pagination: Pagination;
  sorting: {
    type: SortDirection;
    field: SortingField;
  };
};
