import { describe, expect, it } from "vitest";
import {
  clampQuarterQuantity,
  formatQuantity,
  isQuarterQuantity,
  maxSellableQuantity,
} from "./quantity";

describe("quarter-unit quantities", () => {
  it.each([0.25, 0.5, 0.75, 1, 12.25])("accepts %s", (quantity) => {
    expect(isQuarterQuantity(quantity)).toBe(true);
  });

  it.each([0, -0.25, 0.1, 1.1, Number.NaN])("rejects %s", (quantity) => {
    expect(isQuarterQuantity(quantity)).toBe(false);
  });

  it("uses only the complete quarters available in stock", () => {
    expect(maxSellableQuantity(43.0351)).toBe(43);
    expect(maxSellableQuantity(0.24)).toBe(0);
  });

  it("snaps and clamps typed quantities", () => {
    expect(clampQuarterQuantity(0.6, 10)).toBe(0.5);
    expect(clampQuarterQuantity(20, 7.75)).toBe(7.75);
  });

  it("shows decimal stock without trailing zeroes", () => {
    expect(formatQuantity(1)).toBe("1");
    expect(formatQuantity(0.5)).toBe("0.5");
    expect(formatQuantity("43.0351")).toBe("43.0351");
  });
});
