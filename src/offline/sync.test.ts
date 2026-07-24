import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "../services/api";
import { offlineDb, resetOfflineDbForTests } from "./db";
import { cancelScheduledRetry, recoverInterruptedSync, syncPendingSales } from "./sync";
import type { QueuedSale } from "./types";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const queuedSale = (id: string, state: QueuedSale["state"] = "pending"): QueuedSale => ({
  client_sale_id: id,
  local_reference: `LOCAL-${id.slice(0, 4)}`,
  customer: 1,
  customer_name: "Walk-in Customer",
  sold_at: "2026-07-11T09:00:00.000Z",
  queued_at: "2026-07-11T09:00:00.000Z",
  device_id: "test-device",
  offline_created: true,
  vat_rate: 7.5,
  discount: "0",
  items: [{ product: 1, product_name: "Rice", quantity: 1, unit_price: "1000.00" }],
  initial_payment: { amount: "1075.00", method: "cash" },
  total: 1075,
  state,
  retry_count: 0,
});

beforeEach(async () => {
  localStorage.clear();
  localStorage.setItem("access_token", "test-token");
  await resetOfflineDbForTests();
  vi.mocked(api.get).mockResolvedValue({ data: { status: "ok" } });
});

afterEach(() => {
  cancelScheduledRetry();
});

describe("sale synchronization", () => {
  it("marks a sale synced with the server identity", async () => {
    const sale = queuedSale("5a5526c6-075d-45a1-a76a-61345272d020");
    await offlineDb.sales.put(sale);
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 42, invoice_number: "INV-00042" },
    });
    await syncPendingSales();
    const stored = await offlineDb.sales.get(sale.client_sale_id);
    expect(stored?.state).toBe("synced");
    expect(stored?.server_sale_id).toBe(42);
    expect(stored?.server_invoice_number).toBe("INV-00042");
  });

  it("keeps a sale pending after a lost response and resolves it on retry", async () => {
    const sale = queuedSale("6b395823-b917-4e14-a5df-66d4c64f4fd4");
    await offlineDb.sales.put(sale);
    vi.mocked(api.post)
      .mockRejectedValueOnce(new Error("connection lost"))
      .mockResolvedValueOnce({ data: { id: 7, invoice_number: "INV-00007" } });

    await syncPendingSales();
    expect((await offlineDb.sales.get(sale.client_sale_id))?.state).toBe("pending");
    await syncPendingSales();
    const stored = await offlineDb.sales.get(sale.client_sale_id);
    expect(stored?.state).toBe("synced");
    expect(api.post).toHaveBeenCalledTimes(2);
  });

  it("does not let one invalid sale block a later sale", async () => {
    const bad = queuedSale("2f0ee7df-b483-4917-b35a-7dd34cf198e6");
    const good = {
      ...queuedSale("97a7d7cd-a993-4996-800b-a6bb280af494"),
      queued_at: "2026-07-11T09:01:00.000Z",
    };
    await offlineDb.sales.put(bad);
    await offlineDb.sales.put(good);
    vi.mocked(api.post)
      .mockRejectedValueOnce({ response: { status: 400, data: { detail: "Invalid sale" } } })
      .mockResolvedValueOnce({ data: { id: 8, invoice_number: "INV-00008" } });
    await syncPendingSales();
    expect((await offlineDb.sales.get(bad.client_sale_id))?.state).toBe("needs_attention");
    expect((await offlineDb.sales.get(good.client_sale_id))?.state).toBe("synced");
  });

  it("recovers an interrupted syncing state after restart", async () => {
    const sale = queuedSale("49ae99d5-2b29-4d19-85e9-9045591a1499", "syncing");
    await offlineDb.sales.put(sale);
    await recoverInterruptedSync();
    expect((await offlineDb.sales.get(sale.client_sale_id))?.state).toBe("pending");
  });

  it("runs another pass when a sale is queued during an active sync", async () => {
    const first = queuedSale("86eadc58-d3ec-41ab-b155-943ca2367ced");
    const second = {
      ...queuedSale("7f7702be-4348-4b0c-ade8-f0929856614e"),
      queued_at: "2026-07-11T09:01:00.000Z",
    };
    await offlineDb.sales.put(first);

    let finishFirstRequest: ((response: { data: { id: number; invoice_number: string } }) => void) | undefined;
    vi.mocked(api.post)
      .mockImplementationOnce(() => new Promise((resolve) => {
        finishFirstRequest = resolve;
      }))
      .mockResolvedValueOnce({ data: { id: 12, invoice_number: "INV-00012" } });

    const activePass = syncPendingSales();
    await vi.waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));

    // This mirrors a sale completing while a login/focus sync is still busy.
    await offlineDb.sales.put(second);
    const requestedPass = syncPendingSales();
    expect(requestedPass).toBe(activePass);

    finishFirstRequest?.({ data: { id: 11, invoice_number: "INV-00011" } });
    await activePass;

    expect(api.post).toHaveBeenCalledTimes(2);
    expect((await offlineDb.sales.get(first.client_sale_id))?.state).toBe("synced");
    expect((await offlineDb.sales.get(second.client_sale_id))?.state).toBe("synced");
  });
});
