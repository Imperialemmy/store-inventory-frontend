import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import useAutoRefresh from "../../../hooks/useAutoRefresh";
import { type Customer } from "../customerTypes";

const CustomerList = () => {
  const navigate = useNavigate();
  const { canSell } = useUserRole();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get("/customers/?page_size=1000")
      .then((res) => setCustomers(res.data.results || res.data))
      .catch((err) => console.error("Error fetching customers:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone_number ?? "").includes(q))
      : customers;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, query]);

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
          <small>{visible.length}</small>
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : visible.length === 0 ? (
          <div className="empty-state"><strong>{query ? "No customers match your search" : "No customers yet"}</strong></div>
        ) : (
          <ul className="inventory-list">
            {visible.map((c) => (
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
      </section>
    </div>
  );
};

export default CustomerList;
