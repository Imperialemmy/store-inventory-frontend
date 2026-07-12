export interface CachedProduct {
  id: number;
  name: string;
  image: string | null;
  price: string;
  stock: number;
  reorder_level?: number;
  updated_at?: string;
}

export interface CachedCustomer {
  id: number;
  name: string;
}

export interface CartLine {
  product: CachedProduct;
  quantity: number;
}

export interface CartDraft {
  key: "active";
  customerId: number | "";
  customerName: string;
  lines: CartLine[];
  paymentMethod: "cash" | "transfer" | "pos" | "pay_later";
  updatedAt: string;
}

export type QueueState = "pending" | "syncing" | "synced" | "needs_attention";

export interface QueuedSale {
  client_sale_id: string;
  local_reference: string;
  customer: number;
  customer_name: string;
  sold_at: string;
  queued_at: string;
  device_id: string;
  offline_created: true;
  vat_rate: number;
  discount: string;
  items: Array<{
    product: number;
    product_name: string;
    quantity: number;
    unit_price: string;
  }>;
  initial_payment?: {
    amount: string;
    method: "cash" | "transfer" | "pos";
    reference?: string;
  };
  total: number;
  state: QueueState;
  retry_count: number;
  last_error?: string;
  server_sale_id?: number;
  server_invoice_number?: string;
  synced_at?: string;
}

export interface SyncSnapshot {
  online: boolean;
  pending: number;
  syncing: number;
  needsAttention: number;
  lastSyncedAt?: string;
}
