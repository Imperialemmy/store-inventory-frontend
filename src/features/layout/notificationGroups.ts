export interface NotificationItem {
  type: "low_stock" | "stock_conflict" | "overdue_invoice" | "expiring_batch" | "unsynced_sale" | "sync_attention";
  message: string;
  link: string;
}

export type NotificationGroupKey = "out_of_stock" | "low_stock" | "stock_conflict" | "overdue_invoice" | "expiring_batch";

export interface NotificationGroup {
  key: NotificationGroupKey;
  label: string;
  description: string;
  count: number;
  link: string;
  previews: NotificationItem[];
}

const groupDetails: Record<NotificationGroupKey, Omit<NotificationGroup, "key" | "count" | "previews">> = {
  out_of_stock: {
    label: "Out of stock",
    description: "Products cannot be sold until they are restocked.",
    link: "/products?stock_status=out_of_stock",
  },
  low_stock: {
    label: "Low stock",
    description: "Products have reached their restock warning level.",
    link: "/products?stock_status=low_stock",
  },
  stock_conflict: {
    label: "Stock conflicts",
    description: "Offline sales need a stock decision.",
    link: "/sales/invoices",
  },
  overdue_invoice: {
    label: "Overdue invoices",
    description: "Customer balances need follow-up.",
    link: "/sales/invoices",
  },
  expiring_batch: {
    label: "Expiring stock",
    description: "Stock batches are approaching their expiry date.",
    link: "/products",
  },
};

const groupKeyFor = (alert: NotificationItem): NotificationGroupKey => {
  if (alert.type === "low_stock") {
    return alert.link.includes("out_of_stock") || alert.message.toLowerCase().includes("out of stock")
      ? "out_of_stock"
      : "low_stock";
  }
  if (alert.type === "stock_conflict" || alert.type === "overdue_invoice" || alert.type === "expiring_batch") {
    return alert.type;
  }
  throw new Error(`Local notification type ${alert.type} cannot be grouped`);
};

export const buildNotificationGroups = (alerts: NotificationItem[]): NotificationGroup[] => {
  const grouped = new Map<NotificationGroupKey, NotificationItem[]>();
  alerts.forEach((alert) => {
    if (alert.type === "unsynced_sale" || alert.type === "sync_attention") return;
    const key = groupKeyFor(alert);
    grouped.set(key, [...(grouped.get(key) ?? []), alert]);
  });

  return (Object.keys(groupDetails) as NotificationGroupKey[]).flatMap((key) => {
    const items = grouped.get(key) ?? [];
    if (items.length === 0) return [];
    return [{
      key,
      ...groupDetails[key],
      count: items.length,
      previews: items.slice(0, 2),
    }];
  });
};
