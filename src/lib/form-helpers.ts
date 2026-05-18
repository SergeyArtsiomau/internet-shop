import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import type { ParsedApiError } from "@/lib/api-errors";

type ApplyServerFieldErrorsOptions<T extends FieldValues> = {
  fallbackField?: FieldPath<T>;
};

export function applyServerFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  parsed: ParsedApiError,
  options?: ApplyServerFieldErrorsOptions<T>,
) {
  const entries = Object.entries(parsed.fieldErrors);
  if (!entries.length) return;

  entries.forEach(([field, message]) => {
    const target =
      field.startsWith("_error_") && options?.fallbackField ? options.fallbackField : (field as FieldPath<T>);
    setError(target, { type: "server", message });
  });
}
