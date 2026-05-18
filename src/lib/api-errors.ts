export type ApiErrorShape = {
  errors: Array<{
    extensions: { code: string };
    name: string;
    message: string;
    fieldName?: string;
    stack?: string;
  }>;
};

const AUTH_CODES = new Set([
  "ERR_AUTH",
  "ERR_INCORRECT_EMAIL_OR_PASSWORD",
  "ERR_ACCOUNT_ALREADY_EXIST",
  "ERR_INCORRECT_PASSWORD",
  "ERR_INVALID_PASSWORD",
]);

export type ParsedApiError = {
  message: string;
  code?: string;
  fieldErrors: Record<string, string>;
};

function pickPrimaryMessage(parsed: ParsedApiError): string {
  if (parsed.message) return parsed.message;
  const firstField = Object.values(parsed.fieldErrors)[0];
  return firstField ?? "Запрос не выполнен";
}

export function isApiErrorsPayload(value: unknown): value is ApiErrorShape {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ApiErrorShape;
  return Array.isArray(candidate.errors) && candidate.errors.length > 0;
}

export function parseApiErrors(data: unknown): ParsedApiError {
  if (!isApiErrorsPayload(data)) {
    return {
      message: "Не удалось обработать ответ сервера",
      fieldErrors: {},
    };
  }

  const fieldErrors: Record<string, string> = {};

  data.errors.forEach((err, index) => {
    const fallbackName = `_error_${index}`;
    const label = resolveErrorFieldName(err, fallbackName);
    fieldErrors[label] = err.message ?? err.name ?? label;
  });

  const first = data.errors[0];
  return {
    message: first.message ?? parseApiErrorsText(data.errors),
    code: first.extensions?.code,
    fieldErrors,
  };
}

function resolveErrorFieldName(
  err: ApiErrorShape["errors"][number],
  fallbackName: string,
): string {
  if (err.fieldName) return err.fieldName;

  const code = err.extensions?.code;
  if (code === "ERR_ACCOUNT_ALREADY_EXIST") return "email";

  const text = `${err.message ?? ""} ${err.name ?? ""}`.toLowerCase();
  if (text.includes("email") || text.includes("e-mail")) return "email";

  return fallbackName;
}

export function isDuplicateEmailError(parsed: ParsedApiError): boolean {
  if (parsed.code === "ERR_ACCOUNT_ALREADY_EXIST") return true;
  const text = `${parsed.message} ${Object.values(parsed.fieldErrors).join(" ")}`.toLowerCase();
  return (
    text.includes("already exist") ||
    text.includes("already exists") ||
    text.includes("уже существует") ||
    text.includes("уже зарегистрир")
  );
}

export function getDisplayErrorMessage(parsed: ParsedApiError): string {
  return pickPrimaryMessage(parsed);
}

function parseApiErrorsText(errors: ApiErrorShape["errors"]): string {
  const lines = errors
    .map((e) => e.message ?? e.name)
    .filter(Boolean) as string[];
  return lines.length ? lines.join("\n") : "Ошибка запроса";
}

export function isAuthRelatedError(parsed: ParsedApiError): boolean {
  if (parsed.code && AUTH_CODES.has(parsed.code)) return true;
  const msg = parsed.message?.toLowerCase() ?? "";
  return msg.includes("token") || msg.includes("authorization");
}

export function summarizeForToast(parsed: ParsedApiError): string {
  const primary = pickPrimaryMessage(parsed);
  const extraCount = Math.max(Object.keys(parsed.fieldErrors).length - 1, 0);
  return extraCount > 0 ? `${primary}\nещё ошибок полей: ${extraCount}` : primary;
}
