import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { offlineDb, resetOfflineDbForTests } from "./db";
import type { CartDraft, QueuedSale } from "./types";

const sale = (id: string): QueuedSale => ({
  client_sale_id: id,
  local_reference: "LOCAL-TEST",
  customer: 1,
  customer_name: "Walk-in Customer",
  sold_at: "2026-07-11T09:00:00.000Z",
  queued_at: "2026-07-11T09:00:00.000Z",
  device_id: "test-device",
  offline_created: true,
  vat_rate: 7.5,
  discount: "0",
  items: [{ product: 1, product_name: "Rice", quantity: 2, unit_price: "1000.00" }],
  total: 2150,
  state: "pending",
  retry_count: 0,
});

beforeEach(async () => {
  localStorage.clear();
  await resetOfflineDbForTests();
});

describe("offline database", () => {
  it("persists and restores an active cart", async () => {
    const draft: CartDraft = {
      key: "active",
      customerId: 1,
      customerName: "Walk-in Customer",
      lines: [{
        product: { id: 1, name: "Rice", image: null, price: "1000.00", stock: 5 },
        quantity: 2,
      }],
      paymentMethod: "cash",
      updatedAt: "2026-07-11T09:00:00.000Z",
    };
    await offlineDb.cart.put(draft);
    expect(await offlineDb.cart.get()).toEqual(draft);
  });

  it("commits a queued sale before reporting success", async () => {
    await offlineDb.sales.put(sale("a04ba763-1ec0-4a8a-bcee-5d05ae237107"));
    const stored = await offlineDb.sales.all();
    expect(stored).toHaveLength(1);
    expect(stored[0].state).toBe("pending");
    expect(stored[0].items[0].product_name).toBe("Rice");
  });

  it("recovers a cart clear without deleting queued sales", async () => {
    const queued = sale("bd0ab293-b924-456d-82fc-d3b08e915a37");
    await offlineDb.sales.put(queued);
    await offlineDb.cart.put({
      key: "active", customerId: 1, customerName: "Walk-in Customer",
      lines: [], paymentMethod: "cash", updatedAt: queued.queued_at,
    });
    await offlineDb.cart.clear();
    expect(await offlineDb.cart.get()).toBeUndefined();
    expect(await offlineDb.sales.get(queued.client_sale_id)).toEqual(queued);
  });
});
