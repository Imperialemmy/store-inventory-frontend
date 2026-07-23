import { describe, expect, it } from "vitest";
import { invoiceStatusLabel } from "./salesTypes";

describe("invoiceStatusLabel", () => {
  it("shows a full return instead of the payment status", () => {
    expect(invoiceStatusLabel({
      payment_status: "paid",
      return_status: "full",
    })).toBe("Returned");
  });

  it("shows a partial return instead of the payment status", () => {
    expect(invoiceStatusLabel({
      payment_status: "paid",
      return_status: "partial",
    })).toBe("Partially returned");
  });

  it("uses the payment status when there is no return", () => {
    expect(invoiceStatusLabel({
      payment_status: "pending",
      return_status: "none",
    })).toBe("Unpaid");
  });
});
