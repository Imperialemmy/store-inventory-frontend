export interface NavigationItem {
  to: string;
  label: string;
  shortLabel: string;
}

export const primaryNavigation: NavigationItem[] = [
  { to: "/home", label: "Control desk", shortLabel: "Home" },
  { to: "/sales", label: "Sales", shortLabel: "Sales" },
  { to: "/sales/reports", label: "Reports", shortLabel: "Reports" },
  { to: "/expenses", label: "Expenses", shortLabel: "Expenses" },
  { to: "/wares", label: "Products", shortLabel: "Products" },
  { to: "/brands", label: "Brands", shortLabel: "Brands" },
  { to: "/categories", label: "Categories", shortLabel: "Categories" },
  { to: "/sizes", label: "Sizes", shortLabel: "Sizes" },
  { to: "/customers", label: "Customers", shortLabel: "Customers" },
  { to: "/suppliers", label: "Suppliers", shortLabel: "Suppliers" },
  { to: "/warehouses", label: "Warehouses", shortLabel: "Stores" },
  { to: "/low-stock", label: "Low stock", shortLabel: "Low stock" },
];
