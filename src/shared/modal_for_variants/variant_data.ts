export interface Size {
  id: number;
  size: string;
  size_unit: string;
}

export interface Batch {
  id: number;
  quantity: number;
  lot_number: string;
  manufacturing_date: string;
  expiry_date: string;
  is_expired: boolean;
}

export interface Variant {
  id: number;
  price: string;
  is_available: boolean;
  size_detail: Size;
  batches?: Batch[];
}

export interface Ware {
  id: number;
  name: string;
  brand_detail: { name: string };
  category_detail: { name: string };
  description: string;
  size_detail: Size[];
  variants: Variant[];
}
