import { httpRequest } from "@/lib/http-client";
import type {
  AuthResponse,
  Category,
  ListResponse,
  Order,
  Product,
  Profile,
  SortDirection,
  SortingField,
} from "@/types/shop";

export type PaginationInput = {
  pageSize?: number;
  pageNumber?: number;
};

export type ListingFilters = PaginationInput & {
  name?: string;
  categoryIds?: string[];
  sorting?: { type: SortDirection; field: SortingField };
};

function cleanedListing(filters: ListingFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set(
    "pagination",
    JSON.stringify({
      pageSize: filters.pageSize ?? 12,
      pageNumber: filters.pageNumber ?? 1,
    }),
  );
  if (filters.sorting) {
    qs.set("sorting", JSON.stringify(filters.sorting));
  }
  if (filters.categoryIds?.length) {
    qs.set("categoryIds", JSON.stringify(filters.categoryIds));
  }
  if (filters.name) {
    qs.set("name", filters.name);
  }
  return qs;
}

export async function signIn(payload: { email: string; password: string }) {
  return httpRequest<AuthResponse>("/signin", { method: "POST", body: payload });
}

export async function signUp(payload: {
  email: string;
  password: string;
  commandId?: string | null;
}) {
  const bodyWithCommandId = {
    ...payload,
    commandId:
      typeof payload.commandId === "undefined" ? "" : (payload.commandId ?? ""),
  };
  return httpRequest<AuthResponse>("/signup", { method: "POST", body: bodyWithCommandId });
}

export async function fetchProfile(token: string) {
  return httpRequest<Profile>("/profile", { method: "GET", token });
}

export async function updateProfile(token: string, body: { name: string }) {
  return httpRequest<Profile>("/profile", { method: "PATCH", body, token });
}

export async function changePassword(
  token: string,
  payload: { password: string; newPassword: string },
) {
  return httpRequest<{ success: boolean }>("/profile/change-password", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function fetchCategories(filters: PaginationInput | undefined = {}, token?: string | null) {
  const qs = new URLSearchParams();
  qs.set(
    "pagination",
    JSON.stringify({
      pageSize: filters.pageSize ?? 200,
      pageNumber: filters.pageNumber ?? 1,
    }),
  );

  const data = await httpRequest<ListResponse<Category>>("/categories", { token }, qs);
  return data;
}

export async function fetchProducts(filters: ListingFilters, token?: string | null) {
  return httpRequest<ListResponse<Product>>("/products", { token }, cleanedListing(filters));
}

export async function fetchProduct(productId: string, token?: string | null) {
  return httpRequest<Product>(`/products/${productId}`, { method: "GET", token });
}

export async function createCategory(token: string, body: { name: string; photo?: string }) {
  return httpRequest<Category>("/categories", { method: "POST", body, token });
}

export async function updateCategory(
  token: string,
  categoryId: string,
  body: { name?: string; photo?: string },
) {
  return httpRequest<Category>(`/categories/${categoryId}`, {
    method: "PATCH",
    body,
    token,
  });
}

export async function deleteCategory(token: string, categoryId: string) {
  return httpRequest<Category>(`/categories/${categoryId}`, { method: "DELETE", token });
}

export async function createProduct(
  token: string,
  body: {
    name: string;
    price: number;
    categoryId: string;
    photo?: string;
    desc?: string;
    oldPrice?: number | null;
  },
) {
  return httpRequest<Product>("/products", { method: "POST", body, token });
}

export async function patchProduct(
  token: string,
  productId: string,
  body: Partial<{
    name: string;
    photo?: string | null;
    desc?: string | null;
    oldPrice?: number | null;
    price?: number;
    categoryId?: string | null;
  }>,
) {
  return httpRequest<Product>(`/products/${productId}`, {
    method: "PATCH",
    body,
    token,
  });
}

export async function deleteProduct(token: string, productId: string) {
  return httpRequest<Product>(`/products/${productId}`, { method: "DELETE", token });
}

export async function createOrder(token: string, products: Array<{ id: string; quantity: number }>) {
  return httpRequest<Order>("/orders", {
    method: "POST",
    body: { products },
    token,
  });
}

export async function fetchOrders(filters: PaginationInput | undefined, token: string | null | undefined) {
  const qs = new URLSearchParams();
  qs.set(
    "pagination",
    JSON.stringify({
      pageSize: filters?.pageSize ?? 20,
      pageNumber: filters?.pageNumber ?? 1,
    }),
  );

  return httpRequest<ListResponse<Order>>("/orders", { token: token ?? undefined }, qs);
}

export async function patchOrder(
  token: string,
  orderId: string,
  body: { status?: unknown; products?: Array<{ id: string; quantity: number }> },
) {
  return httpRequest<Order>(`/orders/${orderId}`, {
    method: "PATCH",
    body,
    token,
  });
}

export async function uploadPhoto(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return httpRequest<{ url: string }>("/upload", {
    method: "POST",
    body: form,
    token,
  });
}
