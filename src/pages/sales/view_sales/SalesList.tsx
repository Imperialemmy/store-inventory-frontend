import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { type Sale, formatNaira, statusLabel } from "../salesTypes";

const statusColor: Record<string, string> = {
  paid: "var(--brand)",
  partial: "var(--amber)",
  pending: "var(--danger)",
};

const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sales/?page_size=200")
      .then((res) => setSales(res.data.results || res.data))
      .catch((err) => console.error("Error fetching sales:", err))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) => s.invoice_number.toLowerCase().includes(q) || s.customer_name.toLowerCase().includes(q));
  }, [sales, query]);

  return (
    <div className="page-container">
      <PageHeader eyebrow="Invoices" title="Invoices" description="Every sale, its total and outstanding balance." />

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
                    <span style={{ color: statusColor[s.payment_status], fontWeight: 750, fontSize: ".78rem" }}>
                      {statusLabel(s.payment_status)}
                    </span>
                  </div>
                  <span className="inventory-list__open">
                    {formatNaira(s.total)}{Number(s.balance) > 0 ? ` · ${formatNaira(s.balance)} due` : ""}
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
