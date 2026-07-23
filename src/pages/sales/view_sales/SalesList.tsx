import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { type Sale, formatNaira, invoiceStatusLabel } from "../salesTypes";
import { offlineDb } from "../../../offline/db";
import { SYNC_EVENT } from "../../../offline/sync";
import type { QueuedSale } from "../../../offline/types";
import { queryKeys } from "../../../query/queryKeys";

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

const SalesList = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [localSales, setLocalSales] = useState<QueuedSale[]>([]);
  const { data: sales = [], isLoading: loading } = useQuery<Sale[]>({
    queryKey: queryKeys.sales,
    queryFn: async () => {
      const response = await api.get("/sales/?page_size=200");
      return response.data.results || response.data;
    },
  });
  const { data: summary = null } = useQuery<OperationsSummary>({
    queryKey: queryKeys.operations,
    queryFn: async () => (await api.get("/operations-summary/")).data,
  });

  useEffect(() => {
    const loadLocal = () => {
      void offlineDb.sales.all().then((sales) => setLocalSales(
        sales
          .filter((sale) => sale.state !== "synced")
          .sort((a, b) => b.queued_at.localeCompare(a.queued_at))
      ));
    };
    loadLocal();
    window.addEventListener(SYNC_EVENT, loadLocal);
    return () => window.removeEventListener(SYNC_EVENT, loadLocal);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.invoice_number.toLowerCase().includes(q) || s.customer_name.toLowerCase().includes(q));
  }, [sales, query]);

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
        <div className="search-box" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <Search size={18} />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices or customers…" />
          <small>{visible.length}</small>
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : visible.length === 0 ? (
          <div className="empty-state"><strong>{query ? "No matching invoices" : "No sales yet"}</strong></div>
        ) : (
          <ul className="inventory-list">
            {visible.map((s) => (
              <li key={s.id} className="inventory-list__row" onClick={() => navigate(`/sales/${s.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter") navigate(`/sales/${s.id}`); }} tabIndex={0} role="link">
                <div className="inventory-list__content">
                  <div className="inventory-list__name">
                    <span>{s.invoice_number}</span>
                    <span className="customer-chip">{s.customer_name}</span>
                    <span style={{ color: invoiceStatusColor(s), fontWeight: 750, fontSize: ".78rem" }}>
                      {invoiceStatusLabel(s)}
                    </span>
                    {Number(s.refund_due) > 0 && (
                      <span style={{ color: "var(--danger)", fontWeight: 750, fontSize: ".78rem" }}>
                        Refund due
                      </span>
                    )}
                  </div>
                  <span className="inventory-list__open">
                    {formatNaira(s.return_status === "none" ? s.total : s.net_total)}
                    {s.return_status !== "none" ? " net" : ""}
                    {Number(s.receivable) > 0 ? ` · ${formatNaira(s.receivable)} due` : ""}
                    {Number(s.refund_due) > 0 ? ` · ${formatNaira(s.refund_due)} refund` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SalesList;
