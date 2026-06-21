export interface NavigationItem {
  to: string;
  label: string;
  shortLabel: string;
}

export const primaryNavigation: NavigationItem[] = [
  { to: "/home", label: "Control desk", shortLabel: "Home" },
  { to: "/wares", label: "Products", shortLabel: "Products" },
  { to: "/brands", label: "Brands", shortLabel: "Brands" },
  { to: "/categories", label: "Categories", shortLabel: "Categories" },
  { to: "/sizes", label: "Sizes", shortLabel: "Sizes" },
];
