export interface ExpenseCategory {
  id: number;
  name: string;
  monthly_budget: string;
}

export interface Expense {
  id: number;
  category: number;
  category_name: string;
  supplier: number | null;
  supplier_name: string | null;
  description: string;
  amount: string;
  payment_method: string;
  method_display: string;
  reference: string | null;
  receipt: string | null;
  date: string;
  created_at: string;
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank Transfer" },
  { value: "pos", label: "POS" },
  { value: "petty_cash", label: "Petty Cash" },
];

export const formatNaira = (value: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value));
