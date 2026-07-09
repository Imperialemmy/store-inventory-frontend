import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Plus, Minus, UserPlus, Package } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";

interface CustomerOption { id: number; name: string; }
interface Product {
  id: number;
  name: string;
  image: string | null;
  price: string;
  stock: number;
}
interface CartLine { product: Product; quantity: number; }

const VAT_RATE = 7.5;

const PointOfSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/customers/?page_size=1000").then((r) => setCustomers(r.data.results || r.data));
    api.get("/products/").then((r) => setProducts(r.data.results || r.data));
  }, []);

  const filtered = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return [...list].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12);
  }, [products, productQuery]);

  const customer = customers.find((c) => c.id === customerId);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) return prev.map((l) => (l.product.id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { product: p, quantity: 1 }];
    });
  };
  const setQty = (id: number, delta: number) =>
    setCart((prev) => prev.map((l) => (l.product.id === id ? { ...l, quantity: l.quantity + delta } : l)).filter((l) => l.quantity > 0));

  const subtotal = cart.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0);
  const vat = (subtotal * VAT_RATE) / 100;
  const total = subtotal + vat;
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0);

  const completeSale = async () => {
    setError(null);
    if (!customerId) return setError("Select a customer first.");
    if (cart.length === 0) return setError("Add at least one product.");
    setSaving(true);
    try {
      const res = await api.post("/sales/", {
        customer: customerId,
        vat_rate: VAT_RATE,
        discount: "0",
        items: cart.map((l) => ({ product: l.product.id, quantity: l.quantity, unit_price: l.product.price })),
      });
      navigate(`/sales/${res.data.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: unknown } })?.response?.data;
      setError(Array.isArray(detail) ? String(detail[0]) : "Could not complete the sale. Check stock and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader eyebrow="Point of sale" title="New sale" description="Add products to the cart and complete the sale." />

      {error && <div className="notice notice--error" role="alert">{error}</div>}

      <div className="pos">
        <div>
          <div className="surface form-card" style={{ marginBottom: "16px" }}>
            <div className="field" style={{ marginBottom: "14px" }}>
              <span>Customer</span>
              <div style={{ display: "flex", gap: "10px" }}>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")} style={{ flex: 1 }}>
                  <option value="">Search customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Link className="button button--ghost" to="/customers/add"><UserPlus size={16} /> Add new</Link>
              </div>
            </div>
            <label className="field">
              <span>Products</span>
              <div className="topbar__search" style={{ maxWidth: "none" }}>
                <Search size={18} />
                <input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search products…" />
              </div>
            </label>
          </div>

          <div className="pos-products">
            {filtered.map((p) => (
              <button key={p.id} className="pos-product" onClick={() => addToCart(p)} type="button" disabled={p.stock <= 0}>
                {p.image ? (
                  <img src={p.image} alt="" style={{ width: "100%", height: 80, objectFit: "contain", marginBottom: 8 }} />
                ) : (
                  <span style={{ display: "grid", placeItems: "center", height: 80, marginBottom: 8, color: "var(--brand)" }}><Package size={28} /></span>
                )}
                <span className="pos-product__name">{p.name}</span>
                <span className="pos-product__meta">stock {p.stock}</span>
                <span className="pos-product__price">{formatNaira(p.price)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p style={{ color: "var(--ink-600)" }}>No products found.</p>}
          </div>
        </div>

        {/* Cart */}
        <div className="surface form-card pos__cart">
          <h3 style={{ marginTop: 0, color: "var(--ink-900)" }}>Cart</h3>
          {cart.length === 0 ? (
            <p style={{ color: "var(--ink-600)" }}>Tap a product to add it.</p>
          ) : (
            <>
              {cart.map((l) => (
                <div className="pos-cart-row" key={l.product.id}>
                  <div>
                    <div className="pos-cart-row__name">{l.product.name}</div>
                    <div className="pos-cart-row__meta">{formatNaira(l.product.price)} each</div>
                  </div>
                  <div className="pos-qty">
                    <button type="button" onClick={() => setQty(l.product.id, -1)} aria-label="Decrease"><Minus size={13} /></button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => setQty(l.product.id, 1)} aria-label="Increase" disabled={l.quantity >= l.product.stock}><Plus size={13} /></button>
                  </div>
                </div>
              ))}
              <dl className="sale-totals" style={{ maxWidth: "none" }}>
                <div><dt>Subtotal</dt><dd>{formatNaira(subtotal)}</dd></div>
                <div><dt>VAT ({VAT_RATE}%)</dt><dd>{formatNaira(vat)}</dd></div>
                <div className="sale-totals__grand"><dt>{itemCount} item{itemCount === 1 ? "" : "s"}{customer ? ` · ${customer.name}` : ""}</dt><dd>{formatNaira(total)}</dd></div>
              </dl>
            </>
          )}
          <button className="button button--primary" style={{ width: "100%", marginTop: "16px" }} onClick={completeSale} disabled={saving}>
            <ShoppingCart size={17} /> {saving ? "Completing…" : "Complete sale"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
