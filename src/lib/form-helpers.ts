import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import type { ParsedApiError } from "@/lib/api-errors";

export function applyServerFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  parsed: ParsedApiError,
) {
  const entries = Object.entries(parsed.fieldErrors);
  if (!entries.length) return;

  entries.forEach(([field, message]) => {
    setError(field as FieldPath<T>, { type: "server", message });
  });
}
