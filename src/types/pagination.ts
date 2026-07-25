export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page?: number;
  page_size?: number;
  total_pages?: number;
}

export const pageCount = (count: number, pageSize: number) =>
  Math.max(1, Math.ceil(count / pageSize));
