export interface CustomerTag {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  name: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  tags: CustomerTag[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const formatNaira = (value: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value));
