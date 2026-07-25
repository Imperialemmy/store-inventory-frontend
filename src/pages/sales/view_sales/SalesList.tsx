import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import PaginationControls from "../../../components/ui/PaginationControls";
import { type Sale, formatNaira, invoiceStatusLabel } from "../salesTypes";
import { offlineDb } from "../../../offline/db";
import { SYNC_EVENT } from "../../../offline/sync";
import type { QueuedSale } from "../../../offline/types";
import { queryKeys } from "../../../query/queryKeys";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import type { PaginatedResponse } from "../../../types/pagination";

interface OperationsSummary {
  sales_total: string;
  sale_count: number;
  payments: { cash: string; transfer: string; pos: string };
  low_stock_count: number;
  inventory_attention_count: number;
  outstanding_total: string;
  refunds_due_total: string;
}

const statusColor: Record<string, string> = {
  paid: "var(--brand)",
  partial: "var(--amber)",
  pending: "var(--danger)",
};

const invoiceStatusColor = (sale: Sale) => {
  if (sale.return_status === "full") return "var(--brand)";
  if (sale.return_status === "partial") return "var(--amber)";
  return statusColor[sale.payment_status];
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SalesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(searchParam);
  const debouncedQuery = useDebouncedValue(query);
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const requestedPageSize = Number(searchParams.get("page_size")) || 25;
  const pageSize = [25, 50, 100].includes(requestedPageSize) ? requestedPageSize : 25;
  const listRef = useRef<HTMLUListElement>(null);
  const requestParams = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (searchParam) requestParams.set("search", searchParam);
  if (dateFrom) requestParams.set("date_from", dateFrom);
  if (dateTo) requestParams.set("date_to", dateTo);
  const requestKey = requestParams.toString();

  const [localSales, setLocalSales] = useState<QueuedSale[]>([]);
  const { data, isLoading: loading } = useQuery<PaginatedResponse<Sale>>({
    queryKey: queryKeys.salesList(requestKey),
    queryFn: async () => (await api.get<PaginatedResponse<Sale>>(`/sales/?${requestKey}`)).data,
    placeholderData: (previous) => previous,
  });
  const sales = data?.results ?? [];
  const { data: summary = null } = useQuery<OperationsSummary>({
    queryKey: queryKeys.operations,
    queryFn: async () => (await api.get("/operations-summary/")).data,
  });

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
  }, [page, searchParam, dateFrom, dateTo]);

  useEffect(() => {
    const loadLocal = () => {
      void offlineDb.sales.all().then((queuedSales) => setLocalSales(
        queuedSales
          .filter((sale) => sale.state !== "synced")
          .sort((a, b) => b.queued_at.localeCompare(a.queued_at))
      ));
    };
    loadLocal();
    window.addEventListener(SYNC_EVENT, loadLocal);
    return () => window.removeEventListener(SYNC_EVENT, loadLocal);
  }, []);

  const datePresets = useMemo(() => {
    const today = new Date();
    const last7 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const last30 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = formatDateInput(today);
    return [
      { label: "All dates", from: "", to: "" },
      { label: "Today", from: end, to: end },
      { label: "Last 7 days", from: formatDateInput(last7), to: end },
      { label: "Last 30 days", from: formatDateInput(last30), to: end },
      { label: "This month", from: formatDateInput(monthStart), to: end },
    ];
  }, []);

  return (
    <div className="page-container">
      <PageHeader eyebrow="Invoices" title="Invoices" description="Every sale, its total and outstanding balance." />

      {summary && (
        <section className="ops-summary" aria-label="Today's business summary">
          <div><span>Today</span><strong>{formatNaira(summary.sales_total)}</strong><small>{summary.sale_count} sale{summary.sale_count === 1 ? "" : "s"}</small></div>
          <div><span>Cash</span><strong>{formatNaira(summary.payments.cash)}</strong><small>Transfer {formatNaira(summary.payments.transfer)} · POS {formatNaira(summary.payments.pos)}</small></div>
          <div><span>Stock attention</span><strong>{summary.low_stock_count + summary.inventory_attention_count}</strong><small>{summary.low_stock_count} low · {summary.inventory_attention_count} conflicts</small></div>
          <div><span>Customers owe</span><strong>{formatNaira(summary.outstanding_total)}</strong><small>Across unpaid invoices</small></div>
          <div><span>Refunds due</span><strong>{formatNaira(summary.refunds_due_total)}</strong><small>Owed back after returns</small></div>
        </section>
      )}

      {localSales.length > 0 && (
        <section className="surface local-sales">
          <header><strong>Safely saved on this device</strong><span>{localSales.length}</span></header>
          {localSales.map((sale) => (
            <div key={sale.client_sale_id}>
              <span>
                <strong>{sale.local_reference}</strong>
                <small>{sale.customer_name} · {new Date(sale.sold_at).toLocaleString()}</small>
              </span>
              <span className={`local-sale-state local-sale-state--${sale.state}`}>
                {sale.state === "needs_attention" ? "Needs attention" : sale.state === "syncing" ? "Syncing" : "Waiting to sync"}
              </span>
              <strong>{formatNaira(sale.total)}</strong>
            </div>
          ))}
        </section>
      )}

      <section className="surface list-surface">
        <div className="search-box">
          <Search size={18} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices or customers…" />
          <small>{data?.count ?? 0}</small>
        </div>

        <div className="invoice-filters" aria-label="Invoice date filters">
          <div className="filter-chips">
            {datePresets.map((preset) => {
              const active = dateFrom === preset.from && dateTo === preset.to;
              return (
                <button key={preset.label} type="button" className={`filter-chip${active ? " filter-chip--active" : ""}`} onClick={() => updateDirectoryParams({ date_from: preset.from, date_to: preset.to })}>
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="date-range-fields">
            <label><span>From</span><input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => updateDirectoryParams({ date_from: event.target.value })} /></label>
            <label><span>To</span><input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => updateDirectoryParams({ date_to: event.target.value })} /></label>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : sales.length === 0 ? (
          <div className="empty-state"><strong>{searchParam || dateFrom || dateTo ? "No invoices match these filters" : "No sales yet"}</strong></div>
        ) : (
          <ul ref={listRef} className="inventory-list app-scroll-region app-scroll-region--invoices" tabIndex={0} aria-label="Invoices">
            {sales.map((sale) => (
              <li key={sale.id} className="inventory-list__row" onClick={() => navigate(`/sales/${sale.id}`)}
                  onKeyDown={(event) => { if (event.key === "Enter") navigate(`/sales/${sale.id}`); }} tabIndex={0} role="link">
                <div className="inventory-list__content">
                  <div className="inventory-list__name invoice-list__identity">
                    <span>{sale.invoice_number}</span>
                    <span className="customer-chip">{sale.customer_name}</span>
                    <span className="invoice-list__date">{new Date(`${sale.date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span style={{ color: invoiceStatusColor(sale), fontWeight: 750, fontSize: ".78rem" }}>
                      {invoiceStatusLabel(sale)}
                    </span>
                    {Number(sale.refund_due) > 0 && <span style={{ color: "var(--danger)", fontWeight: 750, fontSize: ".78rem" }}>Refund due</span>}
                  </div>
                  <span className="inventory-list__open">
                    {formatNaira(sale.return_status === "none" ? sale.total : sale.net_total)}
                    {sale.return_status !== "none" ? " net" : ""}
                    {Number(sale.receivable) > 0 ? ` · ${formatNaira(sale.receivable)} due` : ""}
                    {Number(sale.refund_due) > 0 ? ` · ${formatNaira(sale.refund_due)} refund` : ""}
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

export default SalesList;
