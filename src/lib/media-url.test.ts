import { describe, expect, it } from "vitest";
import { resolveMediaUrlWithBase } from "@/lib/media-url";

describe("resolveMediaUrlWithBase", () => {
  it("не изменяет абсолютные ссылки", () => {
    expect(resolveMediaUrlWithBase("https://cdn/a.png")).toBe("https://cdn/a.png");
  });

  it("добавляет origin из api base без /api", () => {
    expect(resolveMediaUrlWithBase("/img/x.png", "http://srv/api")).toBe(
      "http://srv/img/x.png",
    );
  });

  it("чинит относительный путь без ведущего слэша", () => {
    expect(resolveMediaUrlWithBase("img/x.png", "http://srv/api")).toBe(
      "http://srv/img/x.png",
    );
  });
});
