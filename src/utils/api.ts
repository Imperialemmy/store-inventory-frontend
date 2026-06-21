export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getResults = <T>(payload: T[] | PaginatedResponse<T>): T[] =>
  Array.isArray(payload) ? payload : payload.results;
