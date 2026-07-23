import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { announceDataChange, DATA_CHANGE_EVENT, invalidateResources } from "./dataChanges";
import { queryKeys } from "./queryKeys";

describe("live data invalidation", () => {
  it("invalidates every dependent query beneath a resource key", async () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.sales, [{ id: 1 }]);
    client.setQueryData(queryKeys.sale(1), { id: 1 });
    client.setQueryData(queryKeys.customerSales(4), [{ id: 1 }]);
    client.setQueryData(queryKeys.operations, { sale_count: 1 });

    await invalidateResources(client, ["sales", "operations"]);

    expect(client.getQueryState(queryKeys.sales)?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.sale(1))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.customerSales(4))?.isInvalidated).toBe(true);
    expect(client.getQueryState(queryKeys.operations)?.isInvalidated).toBe(true);
  });

  it("announces a deduplicated change in the current browser", () => {
    const listener = vi.fn();
    window.addEventListener(DATA_CHANGE_EVENT, listener);
    announceDataChange(["sales", "sales", "products"]);
    window.removeEventListener(DATA_CHANGE_EVENT, listener);

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.resources).toEqual(["sales", "products"]);
  });
});
