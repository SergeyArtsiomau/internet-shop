"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiRequestError } from "@/lib/http-client";
import {
  getDisplayErrorMessage,
  isDuplicateEmailError,
} from "@/lib/api-errors";
import { applyServerFieldErrors } from "@/lib/form-helpers";
import { COMMAND_ID } from "@/lib/env";
import { signUp } from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";
import { useClientGate } from "@/hooks/use-client-gate";

const schema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Некорректный email")
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8, "Пароль минимум 8 символов"),
    confirm: z.string().min(8, "Повторите пароль"),
    commandId: z.string(),
  })
  .refine((vals) => vals.password === vals.confirm, {
    path: ["confirm"],
    message: "Пароли не совпадают",
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const clientReady = useClientGate();
  const setToken = useAuthStore((state) => state.setToken);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      commandId: COMMAND_ID,
    },
  });

  const onSubmit = async (values: FormValues) => {
    clearErrors();

    try {
      const result = await signUp({
        email: values.email,
        password: values.password,
        commandId: values.commandId.trim() || undefined,
      });
      setToken(result.token);
      router.replace("/profile");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const { parsed } = error;
        const message = getDisplayErrorMessage(parsed);

        applyServerFieldErrors(setError, parsed, { fallbackField: "email" });

        if (isDuplicateEmailError(parsed) || !parsed.fieldErrors.email) {
          setError("email", {
            type: "server",
            message: parsed.fieldErrors.email ?? message,
          });
        }
        return;
      }

      setError("email", { message: "Регистрация не выполнена", type: "server" });
    }
  };

  if (!clientReady) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Новый участник команды</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">Создайте профиль для витрины</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          Уже есть вход?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Перейти к авторизации
          </Link>
        </p>
      </div>

      <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="grid gap-2 text-sm">
          Email
          <input
            type="email"
            autoComplete="email"
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
            {...register("email")}
          />
          {errors.email ? <span className="text-sm text-red-500">{errors.email.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          Пароль
          <input
            type="password"
            autoComplete="new-password"
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
            {...register("password")}
          />
          {errors.password ? <span className="text-sm text-red-500">{errors.password.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          Подтверждение пароля
          <input
            type="password"
            autoComplete="new-password"
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
            {...register("confirm")}
          />
          {errors.confirm ? <span className="text-sm text-red-500">{errors.confirm.message}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          Командный commandId <span className="text-neutral-500">(строкой из readme)</span>
          <textarea
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm"
            placeholder="Одинаковый для всей группы..."
            {...register("commandId")}
          />
          {errors.commandId ? <span className="text-sm text-red-500">{errors.commandId.message}</span> : null}
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="pill border-transparent bg-[var(--accent)] py-3 text-base font-semibold text-white dark:text-[#1b0b07]"
        >
          Создать аккаунт
        </button>
      </form>
    </div>
  );
}
