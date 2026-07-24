import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, Plus, Package, X, Trash2 } from "lucide-react";
import api from "../../services/api";
import { useUserRole } from "../../hooks/useUserRole";
import { queryKeys } from "../../query/queryKeys";
import { announceDataChange } from "../../query/dataChanges";

interface Product {
  id: number;
  name: string;
  category: string;
  image: string | null;
  price: string;
  cost_price: string | null;
  stock: number;
  reorder_level: number;
}

const naira = (n: string | number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n));

// Traffic-light colour for a stock count against its reorder level.
const stockColor = (stock: number, reorder: number) =>
  stock <= 0 ? "var(--danger)" : stock <= reorder ? "var(--amber)" : "var(--ok)";

const emptyDraft = {
  id: 0, name: "", category: "", price: "", stock: "", reorderLevel: "5",
};

const ProductsPage = () => {
  const { canManage } = useUserRole();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // Seed from ?q= so the topbar search lands here pre-filtered.
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { data: products = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: queryKeys.products,
    queryFn: async () => {
      const response = await api.get("/products/");
      return response.data.results || response.data;
    },
  });

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Existing categories power both the directory filter and form suggestions.
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = products.filter((product) => {
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (q && !product.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...matched].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, categoryFilter]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [query, categoryFilter]);

  useEffect(() => {
    if (categoryFilter && !categories.includes(categoryFilter)) setCategoryFilter("");
  }, [categories, categoryFilter]);

  const openAdd = () => {
    setDraft(emptyDraft);
    setImage(null);
    setError(null);
    setOpen(true);
  };
  const openEdit = (p: Product) => {
    if (!canManage) return;
    setDraft({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      price: String(p.price),
      stock: String(p.stock),
      reorderLevel: String(p.reorder_level ?? 5),
    });
    setImage(null);
    setError(null);
    setOpen(true);
  };

  // Case-insensitive duplicate check against the products already loaded,
  // so we warn before hitting the API (the backend enforces it too).
  const duplicate = useMemo(() => {
    const name = draft.name.trim().toLowerCase();
    if (!name) return false;
    return products.some((p) => p.id !== draft.id && p.name.trim().toLowerCase() === name);
  }, [products, draft.name, draft.id]);

  // Soft "did you mean an existing one?" check: catches near-duplicates like
  // "Gino Paste Carton" vs "Gino Paste - Carton". Warns but doesn't block.
  const similar = useMemo(() => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const nb = normalize(draft.name);
    if (nb.length < 3) return [];
    const bTokens = new Set(nb.split(" ").filter(Boolean));
    return products
      .filter((p) => p.id !== draft.id)
      .filter((p) => {
        const na = normalize(p.name);
        if (na === nb) return false; // exact match handled by `duplicate`
        if (na.includes(nb) || nb.includes(na)) return true;
        const aTokens = new Set(na.split(" ").filter(Boolean));
        const inter = [...aTokens].filter((t) => bTokens.has(t)).length;
        const union = new Set([...aTokens, ...bTokens]).size;
        return union > 0 && inter / union >= 0.6;
      })
      .map((p) => p.name)
      .slice(0, 4);
  }, [products, draft.name, draft.id]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) return setError("Name is required.");
    if (duplicate) return setError("A product with this name already exists.");
    const data = new FormData();
    data.append("name", draft.name.trim());
    data.append("category", draft.category.trim());
    data.append("price", draft.price || "0");
    data.append("stock", draft.stock || "0");
    data.append("reorder_level", draft.reorderLevel || "5");
    if (image) data.append("image", image);

    setSaving(true);
    try {
      const response = draft.id
        ? await api.patch<Product>(`/products/${draft.id}/`, data)
        : await api.post<Product>("/products/", data);
      queryClient.setQueryData<Product[]>(queryKeys.products, (current = []) => {
        const without = current.filter((product) => product.id !== response.data.id);
        return [...without, response.data];
      });
      setOpen(false);
      announceDataChange(["products", "operations"]);
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
      queryClient.setQueryData<Product[]>(queryKeys.products, (current = []) =>
        current.filter((product) => product.id !== draft.id));
      setOpen(false);
      announceDataChange(["products", "operations"]);
    } catch {
      setError("Could not delete — it may be used on a sale.");
    }
  };

  return (
    <div className="page-container page-container--narrow">
      {/* Search bar (its own card so the dialog can float free of the list's clip) */}
      <div className="surface" style={{ position: "relative", marginBottom: "14px" }}>
        <div className="search-box" style={{ borderBottom: categories.length > 0 ? undefined : "none" }}>
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            autoFocus
          />
          <div className="search-box__actions">
            <small>{visible.length}</small>
            {canManage && (
              <button className="button button--primary button--small" onClick={openAdd} aria-label="Add product" type="button">
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="filter-chips directory-filter-chips" role="tablist" aria-label="Product categories">
            <button type="button" className={`filter-chip${categoryFilter === "" ? " filter-chip--active" : ""}`} onClick={() => setCategoryFilter("")}>All</button>
            {categories.map((category) => (
              <button key={category} type="button" className={`filter-chip${categoryFilter === category ? " filter-chip--active" : ""}`} onClick={() => setCategoryFilter(category)}>{category}</button>
            ))}
          </div>
        )}

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
                {duplicate && <small style={{ color: "var(--danger)", fontWeight: 600 }}>A product with this name already exists.</small>}
                {!duplicate && similar.length > 0 && (
                  <small style={{ color: "var(--amber)", fontWeight: 600 }}>
                    Similar to: {similar.join(", ")} — check this isn’t a duplicate.
                  </small>
                )}
              </label>
              <label className="field">
                <span>Category (optional)</span>
                <input
                  list="product-categories"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="e.g. Pasta, Seasonings, Tomato Paste"
                />
                <datalist id="product-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
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
                <label className="field">
                  <span>Low-stock alert at</span>
                  <input type="number" min="0" value={draft.reorderLevel} onChange={(e) => setDraft({ ...draft, reorderLevel: e.target.value })} />
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
                <button className="button button--primary button--small" type="submit" disabled={saving || duplicate}>
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
          <ul ref={listRef} className="inventory-list app-scroll-region app-scroll-region--inventory" tabIndex={0} aria-label="Inventory products">
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
                    <span style={{ display: "grid" }}>
                      <span>{p.name}</span>
                      {p.category && <small style={{ color: "var(--ink-600)", fontSize: ".72rem" }}>{p.category}</small>}
                    </span>
                  </div>
                  <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ color: stockColor(p.stock, p.reorder_level), fontSize: ".82rem", fontWeight: p.stock <= p.reorder_level ? 750 : 400, minWidth: 96, textAlign: "right" }}>
                      Stock {p.stock}{p.stock <= 0 ? " · out" : p.stock <= p.reorder_level ? " · low" : ""}
                    </span>
                    <strong style={{ color: "var(--ink-900)", minWidth: 88, textAlign: "right" }}>{naira(p.price)}</strong>
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
