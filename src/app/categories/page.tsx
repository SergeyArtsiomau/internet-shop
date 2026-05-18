"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ProtectedGate } from "@/components/auth/protected-gate";
import { Modal } from "@/components/ui/modal";
import { applyServerFieldErrors } from "@/lib/form-helpers";
import { ApiRequestError } from "@/lib/http-client";
import { resolveMediaUrl } from "@/lib/media-url";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  uploadPhoto,
} from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";
import type { Category } from "@/types/shop";

const categorySchema = z.object({
  name: z.string().min(1, "Заполните название категории"),
  photo: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function CategoryWorkspace() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [modalTarget, setModalTarget] = useState<Category | null | undefined>();

  const listQuery = useQuery({
    queryKey: ["categories", token ?? "guest", "mgmt"],
    queryFn: () => fetchCategories(undefined, token),
    enabled: Boolean(token),
  });

  const savingForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", photo: "" },
  });

  const setFormFromCategory = (category?: Category) => {
    savingForm.reset({
      name: category?.name ?? "",
      photo: category?.photo ?? "",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (vals: CategoryFormValues) =>
      createCategory(token!, { name: vals.name.trim(), photo: vals.photo?.trim() || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ([id, vals]: [string, CategoryFormValues]) =>
      updateCategory(token!, id, { name: vals.name.trim(), photo: vals.photo?.trim() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleUploadPreview = async (file?: File | null) => {
    if (!file || !token) return;
    try {
      const { url } = await uploadPhoto(token, file);
      savingForm.setValue("photo", url, { shouldValidate: true, shouldDirty: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        savingForm.setError("photo", { type: "server", message: error.parsed.message });
      }
    }
  };

  async function persistCategory(values: CategoryFormValues) {
    try {
      if (modalTarget) {
        await updateMutation.mutateAsync([modalTarget.id, values]);
      } else {
        await createMutation.mutateAsync(values);
      }
      setModalTarget(undefined);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        applyServerFieldErrors(savingForm.setError, error.parsed);
        if (!Object.keys(error.parsed.fieldErrors).length) {
          savingForm.setError("name", { message: error.parsed.message, type: "server" });
        }
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Каталогисту</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Категории</h1>
        </div>
        <button
          type="button"
          className="pill bg-[var(--accent-muted)] font-semibold"
          onClick={() => {
            setModalTarget(null);
            setFormFromCategory();
          }}
        >
          Добавить категорию
        </button>
      </header>

      <div className="soft-card overflow-x-auto px-6 py-4">
        {listQuery.isLoading ? <p>Подготовка строк…</p> : null}
        <table className="mt-5 w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="uppercase tracking-[0.3em] text-xs text-neutral-500">
              <th className="pb-4">Изображение</th>
              <th className="pb-4">Название</th>
              <th className="pb-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900/15 dark:divide-white/15">
            {listQuery.data?.data.map((category) => (
              <tr key={category.id}>
                <td className="py-4">
                  {resolveMediaUrl(category.photo) ? (
                    <img src={resolveMediaUrl(category.photo)} alt="" className="h-16 w-28 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-xl bg-neutral-800 text-[0.65rem] text-neutral-400">
                      нет
                    </div>
                  )}
                </td>
                <td className="py-4 text-base font-semibold">{category.name}</td>
                <td className="py-4 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      className="pill text-xs uppercase tracking-[0.2em]"
                      onClick={() => {
                        setModalTarget(category);
                        setFormFromCategory(category);
                      }}
                    >
                      Править
                    </button>
                    <button
                      type="button"
                      className="text-xs uppercase tracking-[0.2em] text-red-600"
                      onClick={() => {
                        const ok = window.confirm("Удалить категорию для всей группы?");
                        if (ok) deleteMutation.mutate(category.id);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!listQuery.data?.data.length && !listQuery.isLoading ? (
          <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">
            Ещё нет категорий — добавьте первую, затем можно заводить товары.
          </p>
        ) : null}
      </div>

      <Modal
        title={modalTarget ? "Изменить категорию" : "Новая категория"}
        open={modalTarget !== undefined}
        onClose={() => setModalTarget(undefined)}
      >
        <form className="grid gap-4" onSubmit={savingForm.handleSubmit(persistCategory)} noValidate>
          <label className="grid gap-2 text-sm">
            Имя
            <input
              className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
              {...savingForm.register("name")}
            />
            {savingForm.formState.errors.name ? (
              <span className="text-sm text-red-500">{savingForm.formState.errors.name.message}</span>
            ) : null}
          </label>
          <label className="grid gap-2 text-sm">
            Изображение (URL после загрузки)
            <input readOnly {...savingForm.register("photo")} className="rounded-2xl border px-4 py-3" />
            {savingForm.formState.errors.photo ? (
              <span className="text-sm text-red-500">{savingForm.formState.errors.photo.message}</span>
            ) : null}
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.3em] text-neutral-500">
            файл
            <input
              type="file"
              accept="image/*"
              className="text-sm normal-case tracking-normal"
              onChange={(event) => void handleUploadPreview(event.target.files?.[0])}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="pill flex-1 border-[var(--accent)] bg-[var(--accent-muted)] font-semibold"
            >
              {modalTarget ? "Обновить" : "Добавить"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedGate>
      <CategoryWorkspace />
    </ProtectedGate>
  );
}
