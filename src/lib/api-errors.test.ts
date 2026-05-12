import { describe, expect, it } from "vitest";
import {
  isApiErrorsPayload,
  parseApiErrors,
  isAuthRelatedError,
} from "@/lib/api-errors";

describe("parseApiErrors", () => {
  it("раскладывает fieldName в map", () => {
    const payload = {
      errors: [
        {
          extensions: { code: "ERR_FIELD_REQUIRED" },
          name: "FieldRequiredError",
          message: "name is required",
          fieldName: "name",
          stack: "",
        },
      ],
    };
    expect(isApiErrorsPayload(payload)).toBe(true);
    const parsed = parseApiErrors(payload);
    expect(parsed.fieldErrors.name).toBe("name is required");
    expect(parsed.code).toBe("ERR_FIELD_REQUIRED");
    expect(parsed.message).toBe("name is required");
  });

  it("распознаёт auth-related код", () => {
    const parsed = parseApiErrors({
      errors: [
        {
          extensions: { code: "ERR_INCORRECT_EMAIL_OR_PASSWORD" },
          name: "IncorrectEmailOrPasswordError",
          message: "User not found",
        },
      ],
    });
    expect(isAuthRelatedError(parsed)).toBe(true);
  });

  it("возвращает fallback для неизвестного тела", () => {
    expect(parseApiErrors({})).toMatchObject({
      fieldErrors: {},
    });
  });
});
