import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Package } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";

interface Variant { stock?: number; retail_price?: string; price?: string; }
interface WareImage { id: number; url: string; alt_text: string | null; }
interface Ware {
  id: number;
  name: string;
  category_detail?: { name: string };
  variants?: Variant[];
  images?: WareImage[];
}

const PER_PAGE = 8;

const wareStock = (w: Ware) => (w.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0);
const warePrice = (w: Ware) => {
  const prices = (w.variants ?? []).map((v) => Number(v.retail_price ?? v.price ?? 0)).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : 0;
};
const naira = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const WareList = () => {
  const navigate = useNavigate();
  const { canManage } = useUserRole();
  const [wares, setWares] = useState<Ware[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wares/")
      .then((res) => setWares(res.data.results || res.data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wares;
    return wares.filter((w) => w.name.toLowerCase().includes(q) || (w.category_detail?.name ?? "").toLowerCase().includes(q));
  }, [wares, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const start = filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const endItem = Math.min(page * PER_PAGE, filtered.length);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Inventory"
        title="All Products"
        description="Manage your inventory."
        action={canManage ? <Link className="button button--primary" to="/add-ware"><Plus size={16} /> Add Product</Link> : undefined}
      />

      <section className="surface list-surface">
        <div className="search-box" style={{ gridTemplateColumns: "auto 1fr auto" }}>
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search products…"
            type="search"
          />
          <small>{filtered.length} product{filtered.length === 1 ? "" : "s"}</small>
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><strong>No products found</strong><p>Add your first product to get started.</p></div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Product</th><th>Category</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((w) => (
                <tr key={w.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/wares/${w.id}`)}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {w.images && w.images.length > 0 ? (
                        <img
                          src={w.images[0].url}
                          alt={w.images[0].alt_text ?? w.name}
                          style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", flex: "0 0 auto", background: "var(--brand-soft)" }}
                        />
                      ) : (
                        <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                          <Package size={18} />
                        </span>
                      )}
                      <span style={{ fontWeight: 700, color: "var(--ink-900)" }}>{w.name}</span>
                    </div>
                  </td>
                  <td>{w.category_detail?.name ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{wareStock(w)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{warePrice(w) ? naira(warePrice(w)) : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="inventory-list__open" to={`/wares/${w.id}`} onClick={(e) => e.stopPropagation()}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <div className="pagination" style={{ justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-600)", fontSize: ".82rem", alignSelf: "center" }}>
              Showing {start} to {endItem} of {filtered.length} products
            </span>
            <span style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} aria-current={p === page ? "page" : undefined} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </span>
          </div>
        )}
      </section>
    </div>
  );
};

export default WareList;
