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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function encodeProductFilters(filters: ListingFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set(
    "pagination",
    JSON.stringify({
      pageSize: filters.pageSize ?? 12,
      pageNumber: filters.pageNumber ?? 1,
    }),
  );
  if (filters.sorting) {
    params.set("sorting", JSON.stringify(filters.sorting));
  }
  if (filters.categoryIds?.length) {
    params.set("categoryIds", JSON.stringify(filters.categoryIds));
  }
  const searchName = filters.name?.trim();
  if (searchName) {
    params.set(
      "name",
      JSON.stringify({
        $regex: escapeRegex(searchName),
        $options: "i",
      }),
    );
  }
  return params;
}

export async function signIn(payload: { email: string; password: string }) {
  return httpRequest<AuthResponse>("/signin", { method: "POST", body: payload });
}

export async function signUp(payload: {
  email: string;
  password: string;
  commandId?: string | null;
}) {
  const body = {
    ...payload,
    commandId:
      typeof payload.commandId === "undefined" ? "" : (payload.commandId ?? ""),
  };
  return httpRequest<AuthResponse>("/signup", { method: "POST", body });
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
  const params = new URLSearchParams();
  params.set(
    "pagination",
    JSON.stringify({
      pageSize: filters.pageSize ?? 200,
      pageNumber: filters.pageNumber ?? 1,
    }),
  );

  return httpRequest<ListResponse<Category>>("/categories", { token }, params);
}

export async function fetchProducts(filters: ListingFilters, token?: string | null) {
  return httpRequest<ListResponse<Product>>("/products", { token }, encodeProductFilters(filters));
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
  const params = new URLSearchParams();
  params.set(
    "pagination",
    JSON.stringify({
      pageSize: filters?.pageSize ?? 20,
      pageNumber: filters?.pageNumber ?? 1,
    }),
  );

  return httpRequest<ListResponse<Order>>("/orders", { token: token ?? undefined }, params);
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
