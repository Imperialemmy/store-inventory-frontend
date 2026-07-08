export interface SaleItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: string;
  line_total?: string;
  returned_quantity?: number;
}

export interface CreditNote {
  id: number;
  sale: number;
  reason: string | null;
  amount: string;
  created_at: string;
  items: { id: number; sale_item: number; product_name: string; quantity: number; unit_price: string }[];
}

export interface Payment {
  id: number;
  sale: number;
  amount: string;
  method: string;
  method_display: string;
  reference: string | null;
  date: string;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name: string;
  customer_type: string;
  salesperson: string | null;
  date: string;
  discount: string;
  vat_rate: string;
  subtotal: string;
  vat_amount: string;
  total: string;
  amount_paid: string;
  amount_credited: string;
  balance: string;
  payment_status: "pending" | "partial" | "paid";
  notes: string | null;
  items: SaleItem[];
  payments: Payment[];
  credit_notes: CreditNote[];
  created_at: string;
}

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank Transfer" },
  { value: "pos", label: "POS" },
];

export const formatNaira = (value: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value));

export const statusLabel = (status: Sale["payment_status"]) =>
  ({ pending: "Unpaid", partial: "Part-paid", paid: "Paid" }[status] ?? status);
