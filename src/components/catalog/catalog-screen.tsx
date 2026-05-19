"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { resolveMediaUrl } from "@/lib/media-url";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  patchProduct,
  uploadPhoto,
} from "@/services/shop-api";
import type { Product, SortDirection, SortingField } from "@/types/shop";
import { ApiRequestError } from "@/lib/http-client";
import { applyServerFieldErrors } from "@/lib/form-helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Resolver, useForm } from "react-hook-form";
import { z } from "zod";
const optionalPositiveFromInput = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string" && value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  })
  .refine((value) => value === undefined || value > 0, {
    message: "Старая цена должна быть больше 0",
  });

const productSchema = z.object({
  name: z.string().trim().min(1, "Укажите название"),
  desc: z.string().optional(),
  price: z.coerce.number().positive("Укажите цену больше нуля"),
  oldPrice: optionalPositiveFromInput,
  categoryId: z.string().min(1, "Выберите категорию"),
  photo: z.string().optional(),
});

const fieldControlClass =
  "w-full rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] px-4 py-2.5 text-sm shadow-sm transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_22%,transparent)]";

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="font-medium text-[var(--foreground)]">
      {children}
      {required ? (
        <span className="ml-0.5 text-red-500" title="Обязательное поле" aria-hidden="true">
          *
        </span>
      ) : null}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-red-600 dark:text-red-400">{message}</p>;
}

type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
  token: string;
  categories: Array<{ id: string; name: string }>;
  product?: Product;
  onSaved(): void;
  onCancel(): void;
};

function ProductForm({ token, categories, product, onSaved, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: product?.name ?? "",
      desc: product?.desc ?? "",
      price: product?.price ?? 0,
      oldPrice: product?.oldPrice,
      categoryId: product?.category.id ?? "",
      photo: product?.photo ?? "",
    },
  });

  const queryClient = useQueryClient();

  const saveProduct = async (values: ProductFormValues) => {
    const body = {
      name: values.name.trim(),
      desc: values.desc?.trim() || undefined,
      price: values.price,
      oldPrice: values.oldPrice,
      categoryId: values.categoryId,
      photo: values.photo?.trim() || undefined,
    };

    try {
      if (product) {
        await patchProduct(token, product.id, body);
      } else {
        await createProduct(token, body);
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        applyServerFieldErrors(setError, error.parsed);
        if (!Object.keys(error.parsed.fieldErrors).length) {
          setError("name", { type: "server", message: error.parsed.message });
        }
      } else {
        setError("name", { type: "server", message: "Не удалось сохранить товар" });
      }
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      const result = await uploadPhoto(token, file);
      setValue("photo", result.url, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setError("photo", { type: "server", message: error.parsed.message });
      }
    }
  };

  return (
    <form className="grid gap-8" onSubmit={handleSubmit(saveProduct)} noValidate>
      <fieldset className="grid gap-4">
        <legend className="sr-only">Основные данные</legend>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Основное</p>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel required>Название</FieldLabel>
          <input
            required
            aria-required="true"
            placeholder="Например, Оливковое масло"
            className={fieldControlClass}
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </label>
        <label className="grid gap-1.5 text-sm">
          <FieldLabel required>Категория</FieldLabel>
          <select
            required
            aria-required="true"
            className={fieldControlClass}
            {...register("categoryId")}
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.categoryId?.message} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">
            <FieldLabel required>Цена, ₽</FieldLabel>
            <input
              type="number"
              step="0.01"
              min={0.01}
              required
              aria-required="true"
              placeholder="0.00"
              className={fieldControlClass}
              {...register("price")}
            />
            <FieldError message={errors.price?.message} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[var(--foreground)]">Старая цена, ₽</span>
            <input
              type="number"
              step="0.01"
              placeholder="Для акции"
              className={fieldControlClass}
              {...register("oldPrice")}
            />
            <FieldError message={errors.oldPrice?.message} />
          </label>
        </div>
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="sr-only">Описание и фото</legend>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Дополнительно</p>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">Описание</span>
          <textarea
            rows={3}
            placeholder="Кратко о товаре"
            className={clsx(fieldControlClass, "min-h-[5.5rem] resize-y")}
            {...register("desc")}
          />
        </label>
        <div className="grid gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--accent-muted)_35%,transparent)] p-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-[var(--foreground)]">Изображение</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Загрузите файл — ссылка подставится автоматически
            </span>
            <input
              type="file"
              accept="image/*"
              className="text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:file:text-[#1b0b07]"
              onChange={(event) => void handleUpload(event.target.files?.[0])}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Ссылка на фото</span>
            <input
              readOnly
              placeholder="Появится после загрузки"
              className={clsx(fieldControlClass, "text-neutral-500")}
              {...register("photo")}
            />
            <FieldError message={errors.photo?.message} />
          </label>
        </div>
      </fieldset>
      <footer className="flex flex-col-reverse gap-4 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          <span className="text-red-500" aria-hidden="true">
            *
          </span>{" "}
          — обязательное поле
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="pill px-5 py-2.5" onClick={onCancel}>
            Отмена
          </button>
          <button
            disabled={isSubmitting}
            type="submit"
            className="pill border-transparent bg-[var(--accent)] px-5 py-2.5 font-semibold text-white disabled:opacity-60 dark:text-[#1f0f0b]"
          >
            {isSubmitting ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </footer>
    </form>
  );
}

type ProductTileProps = {
  product: Product;
  editable: boolean;
  onEdit(product: Product): void;
};

function ProductTile({ product, editable, onEdit }: ProductTileProps) {
  const photo = resolveMediaUrl(product.photo);
  const addToCart = useCartStore((state) => state.add);

  return (
    <article className="soft-card flex h-full flex-col gap-4 p-5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800">
        {photo ? (
          <img src={photo} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">Нет фото</div>
        )}
        {product.oldPrice ? (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            −{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">{product.category.name}</p>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl">{product.name}</h3>
          {product.desc ? <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{product.desc}</p> : null}
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold">{product.price.toFixed(2)} ₽</p>
            {product.oldPrice ? (
              <p className="text-sm text-neutral-500 line-through">{product.oldPrice.toFixed(2)} ₽</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <button type="button" className="pill text-xs uppercase tracking-[0.2em]" onClick={() => onEdit(product)}>
                Править
              </button>
            ) : null}
            <button
              type="button"
              className="pill border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-semibold"
              onClick={() => addToCart(product)}
            >
              В корзину
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CatalogScreen() {
  const token = useAuthStore((state) => state.token);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [sortField, setSortField] = useState<SortingField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchDraft.trim()), 450);
    return () => window.clearTimeout(id);
  }, [searchDraft]);

  useEffect(() => setPage(1), [search, categoryIds, sortField, sortDirection]);

  const filters = useMemo(
    () => ({
      pageNumber: page,
      pageSize,
      sorting: { field: sortField, type: sortDirection },
      name: search || undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
    }),
    [categoryIds, page, sortDirection, sortField, search],
  );

  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["categories", token ?? "guest"],
    queryFn: () => fetchCategories(undefined, token),
  });

  const productsQuery = useQuery({
    queryKey: ["products", filters, token ?? "guest"],
    queryFn: () => fetchProducts(filters, token),
  });

  const [productModal, setProductModal] = useState<Product | undefined | null>(null);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]));
  };

  const removeMutation = useMutation({
    mutationFn: (productId: string) => {
      if (!token) throw new Error("Необходим токен");
      return deleteProduct(token, productId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const pagination = productsQuery.data?.pagination;

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / Math.max(pagination.pageSize || pageSize, 1)))
    : 1;

  const disableNextPage = pagination ? page >= Math.max(totalPages, 1) : false;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <section className="rounded-3xl border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_85%,transparent)] px-6 py-8 sm:px-10">
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Каталог</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          Рыночные новинки недели
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Локальная витрина для учебного Otus проекта.
        </p>
      </section>

      <div className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] px-6 py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm sm:min-w-[220px] sm:flex-1">
          Поиск по названию
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Горошок, смородина…"
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Сортировать по полю
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortingField)}
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
          >
            <option value="name">Название</option>
            <option value="createdAt">Дата добавления</option>
            <option value="updatedAt">Последнее обновление</option>
            <option value="date">Хронология</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Направление
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as SortDirection)}
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
          >
            <option value="ASC">По возрастанию</option>
            <option value="DESC">По убыванию</option>
          </select>
        </label>
        {token ? (
          <button
            type="button"
            className="pill self-end border-[var(--accent)] bg-[var(--accent-muted)] font-semibold"
            onClick={() => setProductModal(null)}
          >
            Новый товар
          </button>
        ) : null}
      </div>

      <section>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Фильтр по категориям — можно несколько</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categoriesQuery.isLoading ? (
            <span className="text-sm text-neutral-500">Категории загружаются…</span>
          ) : null}
          {categoriesQuery.data?.data.map((category) => {
            const active = categoryIds.includes(category.id);
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={clsx(
                  "pill",
                  active &&
                    "border-[var(--accent)] bg-[var(--accent-muted)] font-semibold dark:bg-[rgba(255,173,146,0.15)]",
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </section>

      {productsQuery.isLoading ? (
        <div className="rounded-3xl border border-dashed px-8 py-12 text-center text-neutral-600 dark:text-neutral-300">
          Загрузка позиций…
        </div>
      ) : null}

      {productsQuery.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-red-900 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100">
          Не удалось получить каталог. Проверьте URL API и параметры фильтров.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {productsQuery.data?.data.map((product) => (
          <div key={product.id} className="flex flex-col gap-3">
            <ProductTile editable={Boolean(token)} product={product} onEdit={(candidate) => setProductModal(candidate)} />
            {token ? (
              <button
                type="button"
                className="text-xs uppercase tracking-[0.3em] text-red-600"
                onClick={() => {
                  const confirmed = window.confirm("Удалить товар у всей команды?");
                  if (confirmed) removeMutation.mutate(product.id);
                }}
              >
                Удалить
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {!productsQuery.data?.data.length && !productsQuery.isLoading ? (
        <div className="rounded-3xl border border-[var(--border)] px-6 py-14 text-center text-neutral-600 dark:text-neutral-300">
          Пусто по выбранным фильтрам. Попробуйте сменить категории или добавить свой товар после входа.
        </div>
      ) : null}

      {pagination && totalPages && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Страница {pagination.pageNumber} из {Math.max(totalPages, 1)} · найдено {pagination.total}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="pill"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Назад
            </button>
            <button
              type="button"
              className="pill"
              disabled={disableNextPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Дальше
            </button>
          </div>
        </nav>
      ) : null}

      <Modal
        open={productModal !== undefined}
        title={productModal ? "Редактирование товара" : "Новый товар"}
        onClose={() => setProductModal(undefined)}
      >
        {token && productModal !== undefined ? (
          <ProductForm
            token={token}
            categories={categoriesQuery.data?.data ?? []}
            product={productModal ?? undefined}
            onCancel={() => setProductModal(undefined)}
            onSaved={() => setProductModal(undefined)}
          />
        ) : null}
      </Modal>
    </div>
  );
}
