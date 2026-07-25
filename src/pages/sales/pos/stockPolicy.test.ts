import { describe, expect, it } from "vitest";
import type { CartLine } from "../../../offline/types";
import { scarceOfflineProducts } from "./stockPolicy";

const line = (id: number, stock: number): CartLine => ({
  product: { id, name: `Product ${id}`, image: null, price: "100.00", stock },
  quantity: 1,
});

describe("offline stock safety policy", () => {
  it("requires live approval at the configured threshold", () => {
    expect(scarceOfflineProducts([line(1, 2)], 2).map((entry) => entry.product.id)).toEqual([1]);
  });

  it("allows ordinary cached stock to remain sellable offline", () => {
    expect(scarceOfflineProducts([line(1, 3)], 2)).toEqual([]);
  });

  it("identifies only the scarce lines in a mixed cart", () => {
    expect(scarceOfflineProducts([line(1, 8), line(2, 1)], 2).map((entry) => entry.product.id)).toEqual([2]);
  });
});
