import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search, Plus, Package, X, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useUserRole } from "../../hooks/useUserRole";

interface Product {
  id: number;
  name: string;
  image: string | null;
  price: string;
  stock: number;
}

const naira = (n: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n));

const emptyDraft = { id: 0, name: "", price: "", stock: "" };

const ProductsPage = () => {
  const { canManage } = useUserRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api.get("/products/")
      .then((res) => setProducts(res.data.results || res.data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  const openAdd = () => {
    setDraft(emptyDraft);
    setImage(null);
    setError(null);
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    if (!canManage) return;
    setDraft({ id: p.id, name: p.name, price: String(p.price), stock: String(p.stock) });
    setImage(null);
    setError(null);
    setOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) return setError("Name is required.");
    const data = new FormData();
    data.append("name", draft.name);
    data.append("price", draft.price || "0");
    data.append("stock", draft.stock || "0");
    if (image) data.append("image", image);

    setSaving(true);
    try {
      if (draft.id) await api.patch(`/products/${draft.id}/`, data);
      else await api.post("/products/", data);
      setOpen(false);
      load();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { name?: string[] } } })?.response?.data;
      setError(detail?.name?.[0] ?? "Could not save the product.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft.id || !window.confirm(`Delete "${draft.name}"?`)) return;
    try {
      await api.delete(`/products/${draft.id}/`);
      setOpen(false);
      load();
    } catch {
      setError("Could not delete — it may be used on a sale.");
    }
  };

  return (
    <div className="page-container page-container--narrow">
      {/* Search bar (its own card so the dialog can float free of the list's clip) */}
      <div className="surface" style={{ position: "relative", marginBottom: "14px" }}>
        <div className="search-box" style={{ borderBottom: "none", gridTemplateColumns: canManage ? "auto 1fr auto" : "auto 1fr" }}>
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
            <button className="button button--primary button--small" onClick={openAdd} aria-label="Add product" type="button">
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Inline add / edit dialog */}
        {open && (
          <div ref={popRef} className="product-pop glass-panel">
            <div className="product-pop__head">
              <strong>{draft.id ? "Edit product" : "New product"}</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="product-pop__close"><X size={16} /></button>
            </div>
            <form onSubmit={save} className="form-grid" style={{ gap: 12 }}>
              {error && <div className="notice notice--error" role="alert" style={{ margin: 0 }}>{error}</div>}
              <label className="field">
                <span>Name</span>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus placeholder="e.g. Gino Paste - Carton" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="field">
                  <span>Price (₦)</span>
                  <input type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
                </label>
                <label className="field">
                  <span>Stock</span>
                  <input type="number" min="0" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
                </label>
              </div>
              <label className="field">
                <span>Image (optional)</span>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                {draft.id ? (
                  <button type="button" className="button button--ghost button--small" onClick={remove} style={{ color: "var(--danger)" }}>
                    <Trash2 size={15} /> Delete
                  </button>
                ) : <span />}
                <button className="button button--primary button--small" type="submit" disabled={saving}>
                  {saving ? "Saving…" : draft.id ? "Save" : "Add product"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Product list (its own card) */}
      <div className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : visible.length === 0 ? (
          <div className="empty-state"><strong>{query ? "No products match your search" : "No products yet"}</strong></div>
        ) : (
          <ul className="inventory-list">
            {visible.map((p) => (
              <li key={p.id} className="inventory-list__row" onClick={() => openEdit(p)}
                  onKeyDown={(e) => { if (e.key === "Enter") openEdit(p); }} tabIndex={canManage ? 0 : undefined} role={canManage ? "button" : undefined}>
                <div className="inventory-list__content">
                  <div className="inventory-list__name inventory-list__name--plain" style={{ gap: "12px" }}>
                    {p.image ? (
                      <img src={p.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", background: "var(--brand-soft)" }} />
                    ) : (
                      <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
                        <Package size={15} />
                      </span>
                    )}
                    <span>{p.name}</span>
                  </div>
                  <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ color: "var(--ink-600)", fontSize: ".82rem" }}>Stock {p.stock}</span>
                    <strong style={{ color: "var(--ink-900)" }}>{naira(p.price)}</strong>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
