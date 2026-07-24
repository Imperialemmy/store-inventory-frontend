import api from "../services/api";
import { offlineDb } from "./db";
import type { QueuedSale, SyncSnapshot } from "./types";
import { announceDataChange } from "../query/dataChanges";
import { queryClient } from "../query/queryClient";
import { queryKeys } from "../query/queryKeys";

export const SYNC_EVENT = "akinfolu-sync-change";
let activeSync: Promise<void> | null = null;
let syncRequested = false;
let retryTimer: number | undefined;

const emit = () => window.dispatchEvent(new CustomEvent(SYNC_EVENT));

const errorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: unknown } })?.response;
  if (!response?.data) return "The server could not be reached. The sale is safe here.";
  const data = response.data;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data && "detail" in data) return String(data.detail);
  return "This sale needs attention before it can sync.";
};

const retryable = (error: unknown) => {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === undefined || status === 401 || status >= 500 || status === 408 || status === 429;
};

const scheduleRetry = (attempt: number) => {
  window.clearTimeout(retryTimer);
  const base = Math.min(60_000, 1_000 * 2 ** Math.min(attempt, 6));
  const jitter = Math.floor(Math.random() * 500);
  retryTimer = window.setTimeout(() => void syncPendingSales(), base + jitter);
};

export const cancelScheduledRetry = () => {
  window.clearTimeout(retryTimer);
  retryTimer = undefined;
};

const payloadFor = (sale: QueuedSale) => ({
  client_sale_id: sale.client_sale_id,
  customer: sale.customer,
  sold_at: sale.sold_at,
  device_id: sale.device_id,
  offline_created: true,
  vat_rate: sale.vat_rate,
  discount: sale.discount,
  items: sale.items.map(({ product, quantity, unit_price }) => ({
    product,
    quantity,
    unit_price,
  })),
  ...(sale.initial_payment ? { initial_payment: sale.initial_payment } : {}),
});

const syncOne = async (sale: QueuedSale) => {
  const syncing = { ...sale, state: "syncing" as const, last_error: undefined };
  await offlineDb.sales.put(syncing);
  emit();
  try {
    const response = await api.post("/sales/", payloadFor(sale));
    await offlineDb.sales.put({
      ...syncing,
      state: "synced",
      server_sale_id: response.data.id,
      server_invoice_number: response.data.invoice_number,
      synced_at: new Date().toISOString(),
    });
    await offlineDb.meta.put("lastSyncedAt", new Date().toISOString());
    queryClient.setQueryData<unknown[]>(queryKeys.sales, (current = []) => {
      const without = current.filter((entry) =>
        typeof entry !== "object" || entry === null || !("id" in entry) || entry.id !== response.data.id);
      return [response.data, ...without];
    });
    announceDataChange(["sales", "products", "customers", "operations", "notifications"], "offline-sync");
  } catch (error) {
    const retryCount = sale.retry_count + 1;
    await offlineDb.sales.put({
      ...sale,
      state: retryable(error) ? "pending" : "needs_attention",
      retry_count: retryCount,
      last_error: errorMessage(error),
    });
    if (retryable(error)) scheduleRetry(retryCount);
  } finally {
    emit();
  }
};

export const recoverInterruptedSync = async () => {
  const sales = await offlineDb.sales.all();
  await Promise.all(
    sales
      .filter((sale) => sale.state === "syncing")
      .map((sale) => offlineDb.sales.put({ ...sale, state: "pending" }))
  );
  emit();
};

const runSyncPass = async () => {
  try {
    if (!localStorage.getItem("access_token")) return;
    await api.get("/health/");
    await offlineDb.meta.put("apiReachable", true);
    const sales = (await offlineDb.sales.all())
      .filter((sale) => sale.state === "pending")
      .sort((a, b) => a.queued_at.localeCompare(b.queued_at));
    for (const sale of sales) await syncOne(sale);
  } catch {
    await offlineDb.meta.put("apiReachable", false);
    emit();
  }
};

export const syncPendingSales = () => {
  syncRequested = true;
  if (activeSync) return activeSync;
  activeSync = (async () => {
    try {
      while (syncRequested) {
        syncRequested = false;
        await runSyncPass();
      }
    } finally {
      activeSync = null;
    }
  })();
  return activeSync;
};

export const retrySale = async (id: string) => {
  const sale = await offlineDb.sales.get(id);
  if (!sale) return;
  await offlineDb.sales.put({
    ...sale,
    state: "pending",
    last_error: undefined,
  });
  emit();
  await syncPendingSales();
};

export const getSyncSnapshot = async (): Promise<SyncSnapshot> => {
  const sales = await offlineDb.sales.all();
  const last = await offlineDb.meta.get<string>("lastSyncedAt");
  const reachable = await offlineDb.meta.get<boolean>("apiReachable");
  return {
    online: navigator.onLine && reachable?.value !== false,
    pending: sales.filter((sale) => sale.state === "pending").length,
    syncing: sales.filter((sale) => sale.state === "syncing").length,
    needsAttention: sales.filter((sale) => sale.state === "needs_attention").length,
    lastSyncedAt: last?.value,
  };
};

export const startSyncEngine = async () => {
  await recoverInterruptedSync();
  const run = () => void syncPendingSales();
  window.addEventListener("online", run);
  window.addEventListener("focus", run);
  window.addEventListener("akinfolu-auth-change", run);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
  run();
};
