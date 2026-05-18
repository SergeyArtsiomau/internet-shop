"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiRequestError } from "@/lib/http-client";
import { applyServerFieldErrors } from "@/lib/form-helpers";
import { changePassword, fetchProfile, updateProfile } from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";

const nameSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(2, "Имя слишком короткое")
        .refine((value) => !/\s/.test(value), {
          message: "Пробелы в нике сервер не принимает — одно слово или, например, Sergey_Artsiombau.",
        }),
    ),
});

type NameFormValues = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(8, "Текущий пароль обязателен"),
    newPassword: z.string().min(8, "Новый пароль минимум 8 символов"),
    confirm: z.string().min(8, "Повторите новый пароль"),
  })
  .refine((vals) => vals.newPassword === vals.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileCard() {
  const token = useAuthStore((state) => state.token);
  const profileQuery = useQuery({
    queryKey: ["profile", token],
    queryFn: () => fetchProfile(token!),
    enabled: Boolean(token),
  });

  if (profileQuery.isLoading) {
    return <div className="soft-card animate-pulse p-10 text-neutral-600 dark:text-neutral-300">Профиль…</div>;
  }

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <div className="soft-card px-10 py-12 text-neutral-700 dark:text-neutral-300">
        Профиль временно недоступен — попробуйте обновить страницу.
      </div>
    );
  }

  return (
    <section className="soft-card space-y-6 px-8 py-10">
      <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Профиль</p>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{profile.name || "Гость склада"}</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{profile.email}</p>
      </div>
      <div className="grid gap-2 text-sm">
        <p>
          Командный id:{" "}
          <span className="font-mono">{profile.commandId ? profile.commandId : "общий режим без привязки"}</span>
        </p>
        <p>Дата регистрации: {new Date(profile.signUpDate).toLocaleDateString("ru-RU")}</p>
      </div>
      {profileQuery.isError ? (
        <p className="text-sm text-red-600">Не удалось обновить данные профиля.</p>
      ) : null}
    </section>
  );
}

export function NameUpdateForm() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile", token],
    queryFn: () => fetchProfile(token!),
    enabled: Boolean(token),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    const name = profileQuery.data?.name;
    if (name !== undefined) {
      reset({ name: name ?? "" });
    }
  }, [profileQuery.data?.name, reset]);

  const mutation = useMutation({
    mutationFn: (values: NameFormValues) => updateProfile(token!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile", token] });
    },
    onError: (error: unknown) => {
      if (!(error instanceof ApiRequestError)) return;
      applyServerFieldErrors(setError, error.parsed);
      if (!error.parsed.fieldErrors.name) {
        setError("name", { type: "server", message: error.parsed.message });
      }
    },
  });

  return (
    <section className="soft-card px-8 py-8">
      <h2 className="font-semibold text-lg">Отображаемое имя</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Имя на сервере — это ник: без пробелов внутри (иначе API вернёт ошибку). Подпись видна группе при
        правках каталога.
      </p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={handleSubmit(async (vals) => {
          try {
            await mutation.mutateAsync(vals);
            reset(vals);
          } catch {}
        })}
        noValidate
      >
        <label className="grid gap-2 text-sm">
          Ник для сервера
          <input className="rounded-2xl border border-[var(--border)] px-4 py-3" {...register("name")} />
          {errors.name ? <span className="text-sm text-red-500">{errors.name.message}</span> : null}
        </label>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="pill w-fit border-[var(--accent)] bg-[var(--accent-muted)] font-semibold"
        >
          Сохранить имя
        </button>
      </form>
    </section>
  );
}

export function ChangePasswordSection() {
  const token = useAuthStore((state) => state.token);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      confirm: "",
      newPassword: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      changePassword(token!, {
        password: values.password,
        newPassword: values.newPassword,
      }),
    onSuccess: () => reset({ confirm: "", newPassword: "", password: "" }),
    onError: (error: unknown) => {
      if (error instanceof ApiRequestError) {
        applyServerFieldErrors(setError, error.parsed);
        if (!Object.keys(error.parsed.fieldErrors).length) {
          setError("password", { type: "server", message: error.parsed.message });
        }
      }
    },
  });

  return (
    <section className="soft-card px-8 py-8">
      <h2 className="font-semibold text-lg">Безопасность</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Смена пароля опциональна, но здесь уже видно ответ сервера с подсветкой полей.
      </p>
      <form
        className="mt-6 grid gap-4"
        noValidate
        onSubmit={handleSubmit(async (values) => mutation.mutate(values))}
      >
        <label className="grid gap-2 text-sm">
          Текущий пароль
          <input type="password" {...register("password")} className="rounded-2xl border px-4 py-3" />
          {errors.password ? <span className="text-sm text-red-500">{errors.password.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          Новый пароль
          <input type="password" {...register("newPassword")} className="rounded-2xl border px-4 py-3" />
          {errors.newPassword ? <span className="text-sm text-red-500">{errors.newPassword.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          Подтверждение
          <input type="password" {...register("confirm")} className="rounded-2xl border px-4 py-3" />
          {errors.confirm ? <span className="text-sm text-red-500">{errors.confirm.message}</span> : null}
        </label>
        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="pill w-fit border-transparent bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
        >
          Обновить пароль
        </button>
        {mutation.isSuccess ? <p className="text-sm text-emerald-600">Пароль обновлён.</p> : null}
      </form>
    </section>
  );
}

export function LogOutButton() {
  const setToken = useAuthStore((state) => state.setToken);
  return (
    <div className="flex justify-start">
      <button
        type="button"
        className="pill border border-red-200 text-red-600 dark:border-red-500/70 dark:text-red-100"
        onClick={() => {
          setToken(null);
          window.location.href = "/login";
        }}
      >
        Выйти
      </button>
    </div>
  );
}
