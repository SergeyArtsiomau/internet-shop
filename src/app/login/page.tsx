"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiRequestError } from "@/lib/http-client";
import { applyServerFieldErrors } from "@/lib/form-helpers";
import { signIn } from "@/services/shop-api";
import { useAuthStore } from "@/store/auth-store";
import { useClientGate } from "@/hooks/use-client-gate";

const schema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль минимум 8 символов"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-24 max-w-lg rounded-3xl border border-dashed px-8 py-10 text-center">
          Открываем форму авторизации…
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);
  const clientReady = useClientGate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await signIn(values);
      setToken(result.token);
      const next = params.get("next");
      router.replace(next ? decodeURIComponent(next) : "/profile");
    } catch (error) {
      if (error instanceof ApiRequestError) {
        applyServerFieldErrors(setError, error.parsed);
        if (!Object.keys(error.parsed.fieldErrors).length) {
          setError("email", { type: "server", message: error.parsed.message });
        }
      } else {
        setError("email", { type: "server", message: "Вход не удался" });
      }
    }
  };

  if (!clientReady) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] px-8 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-neutral-500">Вход</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">С возвращением</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          Нет аккаунта?{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/register">
            Создайте командный профиль
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
            autoComplete="current-password"
            className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3"
            {...register("password")}
          />
          {errors.password ? <span className="text-sm text-red-500">{errors.password.message}</span> : null}
        </label>
        <button
          disabled={isSubmitting}
          type="submit"
          className="pill border-transparent bg-[var(--accent)] py-3 text-base font-semibold text-white dark:text-[#1b0b07]"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
