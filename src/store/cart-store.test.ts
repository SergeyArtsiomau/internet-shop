import { describe, expect, it } from "vitest";
import { calculateCartTotals, type CartLine } from "@/store/cart-store";

const sampleLine = (qty: number, price: number): CartLine => ({
  productId: "p1",
  quantity: qty,
  title: "t",
  price,
});

describe("calculateCartTotals", () => {
  it("суммирует количество и стоимость", () => {
    expect(
      calculateCartTotals([
        sampleLine(2, 100),
        { ...sampleLine(1, 50), productId: "p2", title: "x" },
      ]),
    ).toEqual({ quantity: 3, sum: 250 });
  });
});
