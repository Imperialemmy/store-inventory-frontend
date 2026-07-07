export interface SubNavItem {
  to: string;
  label: string;
}

export interface NavGroup {
  key: string;
  label: string;
  to: string;
  icon: "sales" | "inventory" | "customers";
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
    to: "/products",
    icon: "inventory",
    match: ["/products"],
  },
  {
    key: "customers",
    label: "Customers",
    to: "/customers",
    icon: "customers",
    match: ["/customers"],
  },
];

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
