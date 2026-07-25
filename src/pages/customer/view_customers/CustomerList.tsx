import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { queryKeys } from "../../../query/queryKeys";
import { type Customer } from "../customerTypes";
import PaginationControls from "../../../components/ui/PaginationControls";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import type { PaginatedResponse } from "../../../types/pagination";

const CustomerList = () => {
  const navigate = useNavigate();
  const { canSell } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(searchParam);
  const debouncedQuery = useDebouncedValue(query);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const requestedPageSize = Number(searchParams.get("page_size")) || 25;
  const pageSize = [25, 50, 100].includes(requestedPageSize) ? requestedPageSize : 25;
  const requestParams = new URLSearchParams({ page: String(page), page_size: String(pageSize), ordering: "name" });
  if (searchParam) requestParams.set("search", searchParam);
  const requestKey = requestParams.toString();
  const listRef = useRef<HTMLUListElement>(null);
  const { data, isLoading: loading } = useQuery<PaginatedResponse<Customer>>({
    queryKey: queryKeys.customerList(requestKey),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Customer>>(`/customers/?${requestKey}`);
      return response.data;
    },
    placeholderData: (previous) => previous,
  });
  const customers = data?.results ?? [];

  const updateDirectoryParams = (updates: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    if (resetPage) next.delete("page");
    setSearchParams(next);
  };

  useEffect(() => setQuery(searchParam), [searchParam]);

  useEffect(() => {
    if (debouncedQuery.trim() === searchParam) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) next.set("search", debouncedQuery.trim());
    else next.delete("search");
    next.delete("page");
    setSearchParams(next, { replace: true });
  }, [debouncedQuery, searchParam, searchParams, setSearchParams]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [page, searchParam]);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Customer directory"
        title="Customers"
        description="Wholesale and retail customers, their credit and balances."
        action={canSell ? <Link className="button button--primary" to="/customers/add"><Plus size={16} /> Add customer</Link> : undefined}
      />

      <section className="surface list-surface">
        <div className="search-box" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <Search size={18} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers…" autoFocus />
          <small>{data?.count ?? 0}</small>
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : customers.length === 0 ? (
          <div className="empty-state"><strong>{searchParam ? "No customers match your search" : "No customers yet"}</strong></div>
        ) : (
          <ul ref={listRef} className="inventory-list app-scroll-region app-scroll-region--customers" tabIndex={0} aria-label="Customer directory">
            {customers.map((c) => (
              <li key={c.id} className="inventory-list__row" onClick={() => navigate(`/customers/${c.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") navigate(`/customers/${c.id}`); }} tabIndex={0} role="link">
                <div className="inventory-list__content">
                  <div className="inventory-list__name">
                    <span>{c.name}</span>
                    {c.city && <span className="customer-chip">{c.city}</span>}
                  </div>
                  <span className="inventory-list__open" style={{ color: "var(--ink-600)" }}>
                    {c.phone_number || "View"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <PaginationControls
          page={page}
          pageSize={pageSize}
          count={data?.count ?? 0}
          onPageChange={(nextPage) => updateDirectoryParams({ page: String(nextPage) }, false)}
          onPageSizeChange={(nextSize) => updateDirectoryParams({ page_size: String(nextSize) })}
        />
      </section>
    </div>
  );
};

export default CustomerList;
