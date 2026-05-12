export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_96%,transparent)] px-4 py-10 text-sm text-neutral-600 dark:text-neutral-300 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[family-name:var(--font-display)] text-base text-[var(--foreground)]">
          Бакалея Побережья
        </p>
        <p className="max-w-xl leading-relaxed">
          Данные загружаются из Otus REST API. Для команды задайте одинаковый{" "}
          <code className="rounded bg-[var(--accent-muted)] px-1 text-xs">NEXT_PUBLIC_COMMAND_ID</code>
          , чтобы не пересекаться с чужими товарами.
        </p>
      </div>
    </footer>
  );
}
