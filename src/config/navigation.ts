export interface SubNavItem {
  to: string;
  label: string;
}

export interface NavGroup {
  key: string;
  label: string;
  to: string;
  icon: "sales" | "inventory" | "customers" | "reports" | "settings";
  /** Path prefixes that mark this group active (longest match wins). */
  match: string[];
  sub?: SubNavItem[];
}

export const sidebarNavigation: NavGroup[] = [
  {
    key: "sales",
    label: "Sales",
    to: "/sales",
    icon: "sales",
    match: ["/sales"],
    sub: [
      { to: "/sales", label: "Point of sale" },
      { to: "/sales/invoices", label: "Invoices" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    to: "/wares",
    icon: "inventory",
    match: ["/wares", "/add-ware", "/brands", "/categories", "/sizes", "/suppliers", "/warehouses", "/low-stock"],
    sub: [
      { to: "/wares", label: "Products" },
      { to: "/brands", label: "Brands" },
      { to: "/categories", label: "Categories" },
      { to: "/sizes", label: "Sizes" },
      { to: "/suppliers", label: "Suppliers" },
      { to: "/warehouses", label: "Warehouses" },
      { to: "/low-stock", label: "Low stock" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    to: "/customers",
    icon: "customers",
    match: ["/customers"],
  },
  {
    key: "reports",
    label: "Reports",
    to: "/sales/reports",
    icon: "reports",
    match: ["/sales/reports", "/expenses"],
    sub: [
      { to: "/sales/reports", label: "Sales" },
      { to: "/expenses/report", label: "Profit & Loss" },
      { to: "/expenses", label: "Expenses" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    to: "/settings",
    icon: "settings",
    match: ["/settings"],
  },
];

/** All (group, prefix) pairs, so we can pick the most specific active group. */
const allMatches = sidebarNavigation.flatMap((group) =>
  group.match.map((prefix) => ({ key: group.key, prefix }))
);

const isPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const activeGroupKey = (pathname: string): string | undefined =>
  allMatches
    .filter((m) => isPrefix(pathname, m.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.key;

export const activeSubTo = (pathname: string, sub: SubNavItem[]): string | undefined =>
  [...sub]
    .filter((s) => isPrefix(pathname, s.to))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
