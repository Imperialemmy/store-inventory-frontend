import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, Package } from "lucide-react";
import api from "../../../services/api";
import { useUserRole } from "../../../hooks/useUserRole";

interface WareImage { id: number; url: string; alt_text: string | null; }
interface Ware {
  id: number;
  name: string;
  images?: WareImage[];
}

const WareList = () => {
  const navigate = useNavigate();
  const { canManage } = useUserRole();
  const [wares, setWares] = useState<Ware[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/wares/")
      .then((res) => setWares(res.data.results || res.data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? wares.filter((w) => w.name.toLowerCase().includes(q)) : wares;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [wares, query]);

  return (
    <div className="page-container page-container--narrow">
      <div className="surface list-surface">
        <div className="search-box" style={{ gridTemplateColumns: canManage ? "auto 1fr auto" : "auto 1fr" }}>
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            autoFocus
          />
          {canManage && (
            <Link className="button button--ghost button--small" to="/add-ware" aria-label="Add product">
              <Plus size={16} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <strong>{query ? "No products match your search" : "No products yet"}</strong>
          </div>
        ) : (
          <ul className="inventory-list">
            {visible.map((w) => (
              <li
                key={w.id}
                className="inventory-list__row"
                onClick={() => navigate(`/wares/${w.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(`/wares/${w.id}`); }}
                tabIndex={0}
                role="link"
              >
                <div className="inventory-list__content">
                  <div className="inventory-list__name inventory-list__name--plain" style={{ gap: "12px" }}>
                    {w.images && w.images.length > 0 ? (
                      <img
                        src={w.images[0].url}
                        alt=""
                        style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", background: "var(--brand-soft)" }}
                      />
                    ) : (
                      <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
                        <Package size={15} />
                      </span>
                    )}
                    <span>{w.name}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WareList;
