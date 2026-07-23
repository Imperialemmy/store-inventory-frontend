import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingCart, Plus, Minus, UserPlus, Package,
  ChevronDown, X, CheckCircle2,
} from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";
import { createUuid, getDeviceId, offlineDb } from "../../../offline/db";
import { syncPendingSales } from "../../../offline/sync";
import type {
  CachedCustomer,
  CachedProduct,
  CartLine,
  QueuedSale,
} from "../../../offline/types";

// Prices are final at this store — the total is exactly the item prices,
// no VAT or extra fees on top.
const WALK_IN_NAME = "Walk-in Customer";

const PointOfSale = () => {
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "pos" | "pay_later">("cash");
  const [productUsage, setProductUsage] = useState<Record<number, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const [cachedProducts, cachedCustomers, draft, usage] = await Promise.all([
        offlineDb.products.all(),
        offlineDb.customers.all(),
        offlineDb.cart.get(),
        offlineDb.meta.get<Record<number, number>>("productUsage"),
      ]);
      if (!active) return;
      setProducts(cachedProducts);
      setCustomers(cachedCustomers);
      setProductUsage(usage?.value ?? {});
      if (draft) {
        setCart(draft.lines);
        setCustomerId(draft.customerId);
        setCustomerSearch(draft.customerName === WALK_IN_NAME ? "" : draft.customerName);
        setWalkIn(draft.customerName === WALK_IN_NAME);
        setPaymentMethod(draft.paymentMethod);
      }
      setHydrated(true);

      try {
        const [productResponse, customerResponse] = await Promise.all([
          api.get("/products/"),
          api.get("/customers/?page_size=1000"),
        ]);
        const freshProducts = productResponse.data.results || productResponse.data;
        let freshCustomers: CachedCustomer[] = customerResponse.data.results || customerResponse.data;
        let walkIn = freshCustomers.find((c) => c.name === WALK_IN_NAME);
        if (!walkIn) {
          const response = await api.get<CachedCustomer>("/customers/walk-in/");
          walkIn = response.data;
          freshCustomers = [...freshCustomers, walkIn];
        }
        await Promise.all([
          offlineDb.products.replace(freshProducts),
          offlineDb.customers.replace(freshCustomers),
        ]);
        if (!active) return;
        setProducts(freshProducts);
        setCustomers(freshCustomers);
      } catch {
        // Cached catalogue remains fully usable. Connectivity is represented
        // by the global sync strip rather than a blocking POS error.
      }
    };
    void hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void offlineDb.cart.put({
      key: "active",
      customerId,
      customerName: walkIn ? WALK_IN_NAME : customerSearch,
      lines: cart,
      paymentMethod,
      updatedAt: new Date().toISOString(),
    });
  }, [cart, customerId, customerSearch, walkIn, paymentMethod, hydrated]);

  useEffect(() => {
    if (!customerOpen) return;
    const close = (event: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(event.target as Node)) {
        setCustomerOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [customerOpen]);

  // The walk-in record is represented by its own checkbox, so it never
  // appears among the named customers.
  const namedCustomers = useMemo(
    () => customers.filter((customer) => customer.name !== WALK_IN_NAME),
    [customers],
  );

  const customerMatches = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    const list = query
      ? namedCustomers.filter((customer) => customer.name.toLowerCase().includes(query))
      : namedCustomers;
    return [...list].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
  }, [namedCustomers, customerSearch]);

  const selectCustomer = (customer: CachedCustomer) => {
    setCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setCustomerOpen(false);
  };

  const toggleWalkIn = async (checked: boolean) => {
    setWalkIn(checked);
    setCustomerOpen(false);
    if (!checked) {
      setCustomerId("");
      setCustomerSearch("");
      return;
    }
    setCustomerSearch("");
    if (paymentMethod === "pay_later") setPaymentMethod("cash");
    let record = customers.find((customer) => customer.name === WALK_IN_NAME);
    if (!record) {
      try {
        const response = await api.get<CachedCustomer>("/customers/walk-in/");
        record = response.data;
        await offlineDb.customers.put(record);
        setCustomers((previous) => [...previous, record as CachedCustomer]);
      } catch {
        setWalkIn(false);
        setError("Walk-in needs one first online visit to set up. Check your connection and try again.");
        return;
      }
    }
    setCustomerId(record.id);
  };

  const filtered = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    const list = query
      ? products.filter((product) => product.name.toLowerCase().includes(query))
      : products;
    return [...list]
      .sort((a, b) => (productUsage[b.id] ?? 0) - (productUsage[a.id] ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 18);
  }, [products, productQuery, productUsage]);

  // Clicking a product toggles whether it's in the sale. The amount is then
  // adjusted in the cart. Clicking a selected product again removes it and
  // resets its quantity.
  const toggleProduct = (product: CachedProduct) => {
    setSuccess(null);
    setCart((previous) => {
      const existing = previous.find((line) => line.product.id === product.id);
      if (existing) {
        return previous.filter((line) => line.product.id !== product.id);
      }
      return [...previous, { product, quantity: 1 }];
    });
  };

  const setQty = (id: number, delta: number) =>
    setCart((previous) => previous
      .map((line) => line.product.id === id
        ? { ...line, quantity: Math.min(line.product.stock, line.quantity + delta) }
        : line)
      .filter((line) => line.quantity > 0));

  const subtotalKobo = cart.reduce(
    (sum, line) => sum + Math.round(Number(line.product.price) * 100) * line.quantity,
    0,
  );
  const total = subtotalKobo / 100;
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const customer = customers.find((item) => item.id === customerId);
  const cartQty = (id: number) => cart.find((line) => line.product.id === id)?.quantity ?? 0;

  const addCustomer = async () => {
    const name = newCustomerName.trim();
    if (!name) return;
    setError(null);
    try {
      const response = await api.post<CachedCustomer>("/customers/", { name });
      await offlineDb.customers.put(response.data);
      setCustomers((previous) => [...previous, response.data]);
      selectCustomer(response.data);
      setAddingCustomer(false);
      setNewCustomerName("");
    } catch {
      setError("A named customer needs internet right now. Use Walk-in Customer and the sale will still be safe.");
    }
  };

  const completeSale = async () => {
    setError(null);
    setSuccess(null);
    if (!customerId || !customer) return setError("Pick a customer, or tick Walk-in customer.");
    if (cart.length === 0) return setError("Add at least one product.");
    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const id = createUuid();
      const localReference = `LOCAL-${timestamp.slice(0, 10).replace(/-/g, "")}-${id.slice(0, 6).toUpperCase()}`;
      const queuedSale: QueuedSale = {
        client_sale_id: id,
        local_reference: localReference,
        customer: customer.id,
        customer_name: customer.name,
        sold_at: timestamp,
        queued_at: timestamp,
        device_id: getDeviceId(),
        offline_created: true,
        vat_rate: 0,
        discount: "0",
        items: cart.map((line) => ({
          product: line.product.id,
          product_name: line.product.name,
          quantity: line.quantity,
          unit_price: line.product.price,
        })),
        ...(paymentMethod === "pay_later" ? {} : {
          initial_payment: {
            amount: total.toFixed(2),
            method: paymentMethod,
          },
        }),
        total,
        state: "pending",
        retry_count: 0,
      };
      await offlineDb.sales.put(queuedSale);
      const nextUsage = { ...productUsage };
      cart.forEach((line) => {
        nextUsage[line.product.id] = (nextUsage[line.product.id] ?? 0) + line.quantity;
      });
      await offlineDb.meta.put("productUsage", nextUsage);
      await offlineDb.cart.clear();
      setProductUsage(nextUsage);
      setCart([]);
      setProductQuery("");
      setCartOpen(false);
      setSuccess(`${localReference} is saved safely on this device.`);
      void syncPendingSales();
    } catch {
      setError("This device could not save the sale. Keep this screen open and try again.");
    } finally {
      setSaving(false);
    }
  };

  const cartPanel = (
    <div className="surface form-card pos__cart">
      <div className="pos-cart-head">
        <h3>Cart</h3>
        <button type="button" className="pos-cart-close" onClick={() => setCartOpen(false)} aria-label="Close cart">
          <X size={20} />
        </button>
      </div>
      {cart.length === 0 ? (
        <p className="muted">Tap a product to add it.</p>
      ) : (
        <>
          {cart.map((line) => (
            <div className="pos-cart-row" key={line.product.id}>
              <div>
                <div className="pos-cart-row__name">{line.product.name}</div>
                <div className="pos-cart-row__meta">{formatNaira(line.product.price)} each</div>
              </div>
              <div className="pos-qty">
                <button type="button" onClick={() => setQty(line.product.id, -1)} aria-label={`Decrease ${line.product.name}`}><Minus size={17} /></button>
                <span>{line.quantity}</span>
                <button type="button" onClick={() => setQty(line.product.id, 1)} aria-label={`Increase ${line.product.name}`} disabled={line.quantity >= line.product.stock}><Plus size={17} /></button>
              </div>
            </div>
          ))}
          <fieldset className="payment-choice">
            <legend>Payment</legend>
            {[
              ["cash", "Cash"],
              ["transfer", "Transfer"],
              ["pos", "POS"],
              ["pay_later", "Pay later"],
            ].map(([value, label]) => {
              const disabled = value === "pay_later" && walkIn;
              return (
                <label key={value} className={paymentMethod === value ? "payment-choice__active" : disabled ? "payment-choice__disabled" : ""}>
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={paymentMethod === value}
                    disabled={disabled}
                    onChange={() => setPaymentMethod(value as typeof paymentMethod)}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
            {walkIn && <p className="payment-choice__hint">Walk-in sales are paid in full — pick a named customer to sell on credit.</p>}
          </fieldset>
          <dl className="sale-totals" style={{ maxWidth: "none" }}>
            <div className="sale-totals__grand">
              <dt>{itemCount} item{itemCount === 1 ? "" : "s"} · {customer?.name}</dt>
              <dd>{formatNaira(total)}</dd>
            </div>
          </dl>
        </>
      )}
      <button className="button button--primary pos-record" onClick={completeSale} disabled={saving || cart.length === 0}>
        <ShoppingCart size={18} />
        {saving ? "Saving on this device…" : `Record sale · ${formatNaira(total)}`}
      </button>
    </div>
  );

  return (
    <div className="page-container pos-page">
      <PageHeader eyebrow="Point of sale" title="New sale" description="Every sale is saved on this device first." />

      {error && <div className="notice notice--error" role="alert">{error}</div>}
      {success && (
        <div className="notice notice--success pos-success" role="status">
          <CheckCircle2 size={18} />
          <span><strong>Sale recorded.</strong> {success}</span>
        </div>
      )}

      <div className="pos">
        <div>
          <div className="surface form-card pos-controls">
            <div className="field">
              <span>Customer</span>
              <div className="pos-customer-row">
                <div className={`combo${walkIn ? " combo--locked" : ""}`} ref={comboRef}>
                  <div className="pos-search">
                    <Search size={18} />
                    <input
                      value={customerSearch}
                      onChange={(event) => {
                        setCustomerSearch(event.target.value);
                        setCustomerId("");
                        setCustomerOpen(true);
                      }}
                      onFocus={() => setCustomerOpen(true)}
                      placeholder="Search customer…"
                      aria-label="Search customer"
                      role="combobox"
                      aria-expanded={customerOpen}
                      disabled={walkIn}
                    />
                    <button type="button" className="combo__toggle" onClick={() => setCustomerOpen((open) => !open)} aria-label="Show customers" disabled={walkIn}>
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  {customerOpen && !walkIn && (
                    <ul className="combo__menu" role="listbox">
                      {customerMatches.length === 0 ? (
                        <li className="combo__empty">
                          {namedCustomers.length === 0 ? "No customers added yet." : "No customers found."}
                        </li>
                      ) : (
                        customerMatches.map((item) => (
                          <li key={item.id}>
                            <button type="button" className="combo__item" onClick={() => selectCustomer(item)}>
                              {item.name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <button className="button button--ghost pos-add-customer" type="button" onClick={() => setAddingCustomer((open) => !open)} disabled={walkIn}>
                  <UserPlus size={17} /> Add customer
                </button>
              </div>
              <label className="pos-walkin-check">
                <input
                  type="checkbox"
                  checked={walkIn}
                  onChange={(event) => void toggleWalkIn(event.target.checked)}
                />
                <span>Walk-in customer <small>(no details needed)</small></span>
              </label>
              {addingCustomer && (
                <div className="inline-customer">
                  <input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} placeholder="Customer name" autoFocus />
                  <button type="button" className="button button--primary button--small" onClick={() => void addCustomer()}>Save customer</button>
                </div>
              )}
            </div>
            <label className="field">
              <span>Products</span>
              <div className="pos-search">
                <Search size={18} />
                <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search products…" />
              </div>
            </label>
          </div>

          {!hydrated ? (
            <p className="muted">Opening saved products…</p>
          ) : (
            <div className="pos-products">
              {filtered.map((product) => {
                const selected = cartQty(product.id) > 0;
                return (
                  <button key={product.id} className={`pos-product${selected ? " pos-product--selected" : ""}`} onClick={() => toggleProduct(product)} type="button" disabled={product.stock <= 0} aria-pressed={selected}>
                    {selected && <span className="pos-product__check" aria-label="Selected"><CheckCircle2 size={20} /></span>}
                    {product.image ? (
                      <img src={product.image} alt="" />
                    ) : (
                      <span className="pos-product__placeholder"><Package size={28} /></span>
                    )}
                    <span className="pos-product__name">{product.name}</span>
                    <span className="pos-product__meta">Stock {product.stock}</span>
                    <span className="pos-product__price">{formatNaira(product.price)}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="muted">No saved products match this search.</p>}
            </div>
          )}
        </div>

        <div className={`pos-cart-shell${cartOpen ? " pos-cart-shell--open" : ""}`}>
          <button type="button" className="pos-cart-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" />
          {cartPanel}
        </div>
      </div>

      {cart.length > 0 && (
        <button type="button" className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          <span><ShoppingCart size={18} /> {itemCount} item{itemCount === 1 ? "" : "s"}</span>
          <strong>{formatNaira(total)}</strong>
          <small>Review sale</small>
        </button>
      )}
    </div>
  );
};

export default PointOfSale;
