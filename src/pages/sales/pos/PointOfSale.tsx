import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Clock, BarChart3, Plus, Minus, UserPlus } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";

interface CustomerOption { id: number; name: string; customer_type: "wholesale" | "retail"; }
interface VariantOption {
  id: number; ware_name: string; ware_image: string | null;
  size_detail: { size: string; size_unit: string | null };
  retail_price: string; wholesale_price: string; stock: number;
}
interface CartLine { variant: VariantOption; quantity: number; }

const VAT_RATE = 7.5;

const PointOfSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [todaySales, setTodaySales] = useState("0");
  const [pending, setPending] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/customers/?page_size=1000").then((r) => setCustomers(r.data.results || r.data));
    api.get("/variants/?page_size=1000").then((r) => setVariants(r.data.results || r.data));
    const today = new Date().toISOString().slice(0, 10);
    api.get(`/sales/report/?start=${today}&end=${today}`).then((r) => setTodaySales(r.data.totals.sales)).catch(() => {});
    api.get("/sales/?page_size=100").then((r) => {
      const list = r.data.results || r.data;
      setPending(list.filter((s: { payment_status: string }) => s.payment_status !== "paid").length);
    }).catch(() => {});
  }, []);

  const customer = customers.find((c) => c.id === customerId);
  const priceFor = (v: VariantOption) =>
    customer?.customer_type === "wholesale" && Number(v.wholesale_price) > 0 ? v.wholesale_price : v.retail_price;

  const filtered = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    const list = q ? variants.filter((v) => v.ware_name.toLowerCase().includes(q)) : variants;
    return list.slice(0, 12);
  }, [variants, productQuery]);

  const addToCart = (v: VariantOption) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.variant.id === v.id);
      if (existing) return prev.map((l) => (l.variant.id === v.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { variant: v, quantity: 1 }];
    });
  };
  const setQty = (id: number, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.variant.id === id ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );

  const subtotal = cart.reduce((s, l) => s + Number(priceFor(l.variant)) * l.quantity, 0);
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
        items: cart.map((l) => ({ variant: l.variant.id, quantity: l.quantity, unit_price: priceFor(l.variant) })),
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

      <section className="stat-cards">
        <div className="surface stat-card">
          <div>
            <div className="stat-card__value">{pending}</div>
            <div className="stat-card__label">Pending · orders to fulfil</div>
          </div>
          <span className="stat-card__icon stat-card__icon--amber"><Clock size={22} /></span>
        </div>
        <div className="surface stat-card">
          <div>
            <div className="stat-card__value">{formatNaira(todaySales)}</div>
            <div className="stat-card__label">Today’s sales</div>
          </div>
          <span className="stat-card__icon stat-card__icon--green"><BarChart3 size={22} /></span>
        </div>
      </section>

      {error && <div className="notice notice--error" role="alert">{error}</div>}

      <div className="pos">
        <div>
          <div className="surface form-card" style={{ marginBottom: "16px" }}>
            <div className="field" style={{ marginBottom: "14px" }}>
              <span>Customer</span>
              <div style={{ display: "flex", gap: "10px" }}>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")} style={{ flex: 1 }}>
                  <option value="">Search customer…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.customer_type})</option>)}
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

          <h3 style={{ margin: "0 0 12px", color: "var(--ink-900)" }}>Popular products</h3>
          <div className="pos-products">
            {filtered.map((v) => (
              <button key={v.id} className="pos-product" onClick={() => addToCart(v)} type="button" disabled={v.stock <= 0}>
                {v.ware_image && (
                  <img
                    src={v.ware_image}
                    alt={v.ware_name}
                    style={{ width: "100%", height: 90, objectFit: "contain", marginBottom: 8 }}
                  />
                )}
                <span className="pos-product__name">{v.ware_name}</span>
                <span className="pos-product__meta">{v.size_detail.size}{v.size_detail.size_unit ?? ""} · stock {v.stock}</span>
                <span className="pos-product__price">{formatNaira(priceFor(v))}</span>
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
                <div className="pos-cart-row" key={l.variant.id}>
                  <div>
                    <div className="pos-cart-row__name">{l.variant.ware_name}</div>
                    <div className="pos-cart-row__meta">{formatNaira(priceFor(l.variant))} each</div>
                  </div>
                  <div className="pos-qty">
                    <button type="button" onClick={() => setQty(l.variant.id, -1)} aria-label="Decrease"><Minus size={13} /></button>
                    <span>{l.quantity}</span>
                    <button type="button" onClick={() => setQty(l.variant.id, 1)} aria-label="Increase"><Plus size={13} /></button>
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
