export const queryKeys = {
  products: ["products"] as const,
  customers: ["customers"] as const,
  customer: (id: string | number) => ["customers", String(id)] as const,
  customerSales: (id: string | number) => ["sales", "customer", String(id)] as const,
  sales: ["sales"] as const,
  sale: (id: string | number) => ["sales", String(id)] as const,
  operations: ["operations-summary"] as const,
  notifications: ["notifications"] as const,
  team: ["team"] as const,
};
