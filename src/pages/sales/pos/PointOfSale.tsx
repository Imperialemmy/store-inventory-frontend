import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Plus, Minus, UserPlus, Package, ChevronDown } from "lucide-react";
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/customers/?page_size=1000").then((r) => setCustomers(r.data.results || r.data));
    api.get("/products/").then((r) => setProducts(r.data.results || r.data));
  }, []);

  useEffect(() => {
    if (!customerOpen) return;
    const close = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) setCustomerOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [customerOpen]);

  const customerMatches = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers;
    return [...list].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
  }, [customers, customerSearch]);

  const selectCustomer = (c: CustomerOption) => {
    setCustomerId(c.id);
    setCustomerSearch(c.name);
    setCustomerOpen(false);
  };

  const selectWalkIn = async () => {
    setError(null);
    try {
      const res = await api.get<CustomerOption>("/customers/walk-in/");
      selectCustomer(res.data);
    } catch {
      setError("Could not start a walk-in sale. Try again.");
    }
  };

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
                <div className="combo" ref={comboRef} style={{ flex: 1 }}>
                  <div className="topbar__search" style={{ maxWidth: "none" }}>
                    <Search size={18} />
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(""); setCustomerOpen(true); }}
                      onFocus={() => setCustomerOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setCustomerOpen(false);
                        if (e.key === "Enter" && customerMatches.length) { e.preventDefault(); selectCustomer(customerMatches[0]); }
                      }}
                      placeholder="Search customer…"
                      aria-label="Search customer"
                    />
                    <button type="button" className="combo__toggle" onClick={() => setCustomerOpen((o) => !o)} aria-label="Show customers">
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  {customerOpen && (
                    <ul className="combo__menu">
                      {customerMatches.length === 0 ? (
                        <li className="combo__empty">No customers found.</li>
                      ) : (
                        customerMatches.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className={`combo__item${c.id === customerId ? " combo__item--active" : ""}`}
                              onClick={() => selectCustomer(c)}
                            >
                              {c.name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <Link className="button button--ghost" to="/customers/add"><UserPlus size={16} /> Add new</Link>
              </div>
              <button type="button" className="pos-walkin" onClick={selectWalkIn}>
                No details — ring up a walk-in sale
              </button>
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
