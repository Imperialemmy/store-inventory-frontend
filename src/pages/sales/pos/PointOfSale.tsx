import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, ShoppingCart, Plus, Minus, UserPlus,
  ChevronDown, X, CheckCircle2, Printer, PauseCircle, Play, Trash2,
} from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { formatNaira } from "../salesTypes";
import { createUuid, getDeviceId, offlineDb } from "../../../offline/db";
import { syncPendingSales } from "../../../offline/sync";
import type {
  CachedCustomer,
  CachedProduct,
  CartLine,
  HeldSale,
  QueuedSale,
} from "../../../offline/types";
import { announceDataChange, DATA_CHANGE_EVENT, type DataChange } from "../../../query/dataChanges";
import { queryClient } from "../../../query/queryClient";
import { queryKeys } from "../../../query/queryKeys";

// Prices are final at this store — the total is exactly the item prices,
// no VAT or extra fees on top.
const WALK_IN_NAME = "Walk-in Customer";
const SUCCESS_MESSAGE_DURATION_MS = 5_000;

// Traffic-light colour for a stock count against its reorder level.
const stockColor = (stock: number, reorder = 5) =>
  stock <= 0 ? "var(--danger)" : stock <= reorder ? "var(--amber)" : "var(--ok)";

interface Receipt {
  reference: string;
  customerName: string;
  date: string;
  paymentMethod: string;
  items: { name: string; quantity: number; price: string }[];
  total: number;
}

const paymentLabel: Record<string, string> = {
  cash: "Cash", transfer: "Transfer", pos: "POS", pay_later: "Pay later",
};

const PointOfSale = () => {
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walkIn, setWalkIn] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postSaleOpen, setPostSaleOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Receipt | null>(null);
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [heldOpen, setHeldOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const refreshCatalogue = useCallback(async () => {
    const [productResponse, customerResponse] = await Promise.all([
      api.get("/products/"),
      api.get("/customers/?page_size=1000"),
    ]);
    const freshProducts: CachedProduct[] = productResponse.data.results || productResponse.data;
    let freshCustomers: CachedCustomer[] = customerResponse.data.results || customerResponse.data;
    let walkInCustomer = freshCustomers.find((customer) => customer.name === WALK_IN_NAME);
    if (!walkInCustomer) {
      const response = await api.get<CachedCustomer>("/customers/walk-in/");
      walkInCustomer = response.data;
      freshCustomers = [...freshCustomers, walkInCustomer];
    }
    await Promise.all([
      offlineDb.products.replace(freshProducts),
      offlineDb.customers.replace(freshCustomers),
    ]);
    setProducts(freshProducts);
    setCustomers(freshCustomers);
  }, []);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const [cachedProducts, cachedCustomers, draft, usage, heldSales] = await Promise.all([
        offlineDb.products.all(),
        offlineDb.customers.all(),
        offlineDb.cart.get(),
        offlineDb.meta.get<Record<number, number>>("productUsage"),
        offlineDb.held.all(),
      ]);
      if (!active) return;
      setProducts(cachedProducts);
      setCustomers(cachedCustomers);
      setHeld(heldSales.sort((a, b) => b.held_at.localeCompare(a.held_at)));
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
        if (!active) return;
        await refreshCatalogue();
      } catch {
        // Cached catalogue remains fully usable. Connectivity is represented
        // by the global sync strip rather than a blocking POS error.
      }
    };
    void hydrate();
    return () => { active = false; };
  }, [refreshCatalogue]);

  useEffect(() => {
    const onDataChange = (event: Event) => {
      const resources = (event as CustomEvent<DataChange>).detail?.resources ?? [];
      if (!resources.some((resource) => resource === "products" || resource === "customers")) return;
      void refreshCatalogue().catch(() => undefined);
    };
    window.addEventListener(DATA_CHANGE_EVENT, onDataChange);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, onDataChange);
  }, [refreshCatalogue]);

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

  const productCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    const list = products.filter((product) => {
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (query && !product.name.toLowerCase().includes(query)) return false;
      return true;
    });
    return [...list]
      .sort((a, b) => (productUsage[b.id] ?? 0) - (productUsage[a.id] ?? 0) || a.name.localeCompare(b.name))
      .slice(0, 40);
  }, [products, productQuery, categoryFilter, productUsage]);

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

  // Type an exact quantity (for bulk orders) — clamped to available stock.
  const setQtyExact = (line: CartLine, value: string) => {
    const parsed = value.trim() === "" ? 1 : Math.floor(Number(value));
    const clamped = Math.max(1, Math.min(line.product.stock, Number.isFinite(parsed) ? parsed : 1));
    setCart((previous) => previous.map((row) =>
      row.product.id === line.product.id ? { ...row, quantity: clamped } : row));
  };

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
      announceDataChange(["customers"]);
      selectCustomer(response.data);
      setAddingCustomer(false);
      setNewCustomerName("");
    } catch {
      setError("A named customer needs internet right now. Use Walk-in Customer and the sale will still be safe.");
    }
  };

  const resetActiveCart = async () => {
    setCart([]);
    setCustomerId("");
    setCustomerSearch("");
    setWalkIn(false);
    setPaymentMethod("cash");
    setProductQuery("");
    setCartOpen(false);
    await offlineDb.cart.clear();
  };

  // Park the current cart so a new sale can be started, then resumed later.
  const holdSale = async () => {
    if (cart.length === 0) return;
    const who = walkIn ? "Walk-in" : (customerSearch.trim() || "No customer");
    const time = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }).format(new Date());
    const entry: HeldSale = {
      id: createUuid(),
      label: `${who} · ${time}`,
      customerId,
      customerName: walkIn ? WALK_IN_NAME : customerSearch,
      lines: cart,
      paymentMethod,
      held_at: new Date().toISOString(),
    };
    await offlineDb.held.put(entry);
    setHeld((previous) => [entry, ...previous]);
    setError(null);
    setSuccess(null);
    await resetActiveCart();
  };

  const resumeSale = async (entry: HeldSale) => {
    // Auto-park whatever is on the counter now so nothing is lost.
    if (cart.length > 0) await holdSale();
    const isWalk = entry.customerName === WALK_IN_NAME;
    setCart(entry.lines);
    setCustomerId(entry.customerId);
    setWalkIn(isWalk);
    setCustomerSearch(isWalk ? "" : entry.customerName);
    setPaymentMethod(entry.paymentMethod);
    await offlineDb.held.remove(entry.id);
    setHeld((previous) => previous.filter((h) => h.id !== entry.id));
    setHeldOpen(false);
  };

  const discardHeld = async (id: string) => {
    await offlineDb.held.remove(id);
    setHeld((previous) => previous.filter((h) => h.id !== id));
  };

  const heldTotal = (entry: HeldSale) =>
    entry.lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  // Validate, then ask for confirmation before recording.
  const requestComplete = () => {
    setError(null);
    setSuccess(null);
    if (!customerId || !customer) return setError("Pick a customer, or tick Walk-in customer.");
    if (cart.length === 0) return setError("Add at least one product.");
    setConfirmOpen(true);
  };

  const completeSale = async () => {
    if (!customerId || !customer) return;
    setConfirmOpen(false);
    setError(null);
    setSuccess(null);
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

      // Reserve the sold stock immediately in the offline catalogue. The
      // server event reconciles these counts after synchronization succeeds.
      const optimisticProducts = products.map((product) => {
        const sold = cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
        return sold ? { ...product, stock: product.stock - sold } : product;
      });
      setProducts(optimisticProducts);
      await offlineDb.products.replace(optimisticProducts);
      queryClient.setQueryData<Array<{ id: number; stock: number }>>(queryKeys.products, (current) =>
        current?.map((product) => {
          const sold = cart.find((line) => line.product.id === product.id)?.quantity ?? 0;
          return sold ? { ...product, stock: product.stock - sold } : product;
        }));

      // Snapshot for the printable receipt before the cart is cleared.
      setLastSale({
        reference: localReference,
        customerName: customer.name,
        date: new Intl.DateTimeFormat("en-NG", {
          timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short",
        }).format(new Date()),
        paymentMethod,
        items: cart.map((line) => ({ name: line.product.name, quantity: line.quantity, price: line.product.price })),
        total,
      });

      setProductUsage(nextUsage);
      setCart([]);
      setProductQuery("");
      setCartOpen(false);
      setSuccess(`${localReference} is saved safely on this device.`);
      setPostSaleOpen(true);
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

      <div className="pos-cart-body">
        {cart.length === 0 ? (
          <p className="muted">Tap a product to add it.</p>
        ) : (
          cart.map((line) => (
            <div className="pos-cart-row" key={line.product.id}>
              <div className="pos-cart-row__info">
                <div className="pos-cart-row__name">{line.product.name}</div>
                <div className="pos-cart-row__meta">{formatNaira(line.product.price)} each</div>
              </div>
              <div className="pos-qty">
                <button type="button" onClick={() => setQty(line.product.id, -1)} aria-label={`Decrease ${line.product.name}`}><Minus size={16} /></button>
                <input
                  type="number"
                  min={1}
                  max={line.product.stock}
                  value={line.quantity}
                  onChange={(event) => setQtyExact(line, event.target.value)}
                  aria-label={`Quantity of ${line.product.name}`}
                />
                <button type="button" onClick={() => setQty(line.product.id, 1)} aria-label={`Increase ${line.product.name}`} disabled={line.quantity >= line.product.stock}><Plus size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pos-cart-foot">
        {cart.length > 0 && (
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
        )}
        <dl className="sale-totals" style={{ maxWidth: "none" }}>
          <div className="sale-totals__grand">
            <dt>{itemCount} item{itemCount === 1 ? "" : "s"}{customer ? ` · ${customer.name}` : ""}</dt>
            <dd>{formatNaira(total)}</dd>
          </div>
        </dl>
        <button className="button button--primary pos-record" onClick={requestComplete} disabled={saving || cart.length === 0}>
          <ShoppingCart size={18} />
          {saving ? "Saving on this device…" : `Record sale · ${formatNaira(total)}`}
        </button>
        {cart.length > 0 && (
          <button type="button" className="button button--ghost pos-hold" onClick={() => void holdSale()} disabled={saving}>
            <PauseCircle size={17} /> Hold sale
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container pos-page">
      <PageHeader
        eyebrow="Point of sale"
        title="New sale"
        description="Every sale is saved on this device first."
        action={held.length > 0 ? (
          <button type="button" className="button button--ghost" onClick={() => setHeldOpen(true)}>
            <PauseCircle size={17} /> Held ({held.length})
          </button>
        ) : undefined}
      />

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
            <div className="pos-customer-bar">
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
              <label className="pos-walkin-check">
                <input
                  type="checkbox"
                  checked={walkIn}
                  onChange={(event) => void toggleWalkIn(event.target.checked)}
                />
                <span>Walk-in</span>
              </label>
              <button className="button button--ghost pos-add-customer" type="button" onClick={() => setAddingCustomer((open) => !open)} disabled={walkIn}>
                <UserPlus size={17} /> Add
              </button>
            </div>
            {addingCustomer && (
              <div className="inline-customer">
                <input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} placeholder="Customer name" autoFocus />
                <button type="button" className="button button--primary button--small" onClick={() => void addCustomer()}>Save</button>
                <button type="button" className="button button--ghost button--small" onClick={() => { setAddingCustomer(false); setNewCustomerName(""); }}>Cancel</button>
              </div>
            )}

            <div className="pos-search">
              <Search size={18} />
              <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search products…" />
            </div>

            {productCategories.length > 0 && (
              <div className="pos-chips" role="tablist" aria-label="Product categories">
                <button type="button" className={`pos-chip${categoryFilter === "" ? " pos-chip--active" : ""}`} onClick={() => setCategoryFilter("")}>All</button>
                {productCategories.map((cat) => (
                  <button key={cat} type="button" className={`pos-chip${categoryFilter === cat ? " pos-chip--active" : ""}`} onClick={() => setCategoryFilter(cat)}>{cat}</button>
                ))}
              </div>
            )}
          </div>

          {!hydrated ? (
            <p className="muted">Opening saved products…</p>
          ) : filtered.length === 0 ? (
            <p className="muted">No saved products match this search.</p>
          ) : (
            <ul className="pos-list">
              {filtered.map((product) => {
                const selected = cartQty(product.id) > 0;
                const out = product.stock <= 0;
                return (
                  <li key={product.id}>
                    <button
                      className={`pos-list-row${selected ? " pos-list-row--selected" : ""}`}
                      onClick={() => toggleProduct(product)}
                      type="button"
                      disabled={out}
                      aria-pressed={selected}
                    >
                      <span className="pos-list-row__main">
                        <span className="pos-list-row__name">{product.name}</span>
                        {product.category && <span className="pos-list-row__cat">{product.category}</span>}
                      </span>
                      <span className="pos-list-row__stock" style={{ color: stockColor(product.stock, product.reorder_level) }}>
                        {out ? "Out of stock" : `Stock ${product.stock}`}
                      </span>
                      <span className="pos-list-row__price">{formatNaira(product.price)}</span>
                      <span className={`pos-list-row__pick${selected ? " pos-list-row__pick--on" : ""}`}>
                        {selected ? <CheckCircle2 size={20} /> : <Plus size={18} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
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

      <ConfirmDialog
        open={confirmOpen}
        title="Complete this sale?"
        message={
          <>
            <strong>{itemCount} item{itemCount === 1 ? "" : "s"}</strong> for{" "}
            <strong>{customer?.name}</strong> — total <strong>{formatNaira(total)}</strong>
            {" "}({paymentMethod === "pay_later" ? "pay later" : paymentMethod}).
          </>
        }
        confirmLabel="Yes, record sale"
        busy={saving}
        onConfirm={() => void completeSale()}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* After a sale is recorded: print a receipt or return to a fresh sale. */}
      {postSaleOpen && (
        <div className="modal-overlay confirm-overlay" role="dialog" aria-modal="true" aria-label="Sale recorded">
          <div className="confirm-card surface">
            <h3 className="confirm-card__title">Sale recorded ✓</h3>
            <div className="confirm-card__body">
              {lastSale?.reference} — {formatNaira(lastSale?.total ?? 0)}. Print a receipt or start a new sale.
            </div>
            <div className="confirm-card__actions">
              <button type="button" className="button button--ghost" onClick={() => setPostSaleOpen(false)}>Back to home</button>
              <button type="button" className="button button--primary" onClick={() => window.print()}>
                <Printer size={17} /> Print receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held (suspended) sales drawer */}
      {heldOpen && (
        <div className="modal-overlay confirm-overlay" role="dialog" aria-modal="true" aria-label="Held sales" onClick={() => setHeldOpen(false)}>
          <div className="held-panel surface" onClick={(e) => e.stopPropagation()}>
            <div className="held-panel__head">
              <h3>Held sales ({held.length})</h3>
              <button type="button" className="product-pop__close" onClick={() => setHeldOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            {held.length === 0 ? (
              <p className="muted">No sales are on hold.</p>
            ) : (
              <ul className="held-list">
                {held.map((entry) => (
                  <li key={entry.id} className="held-row">
                    <div className="held-row__info">
                      <strong>{entry.label}</strong>
                      <small>{entry.lines.reduce((n, l) => n + l.quantity, 0)} item(s) · {formatNaira(heldTotal(entry))}</small>
                    </div>
                    <div className="held-row__actions">
                      <button type="button" className="button button--primary button--small" onClick={() => void resumeSale(entry)}>
                        <Play size={15} /> Resume
                      </button>
                      <button type="button" className="button button--ghost button--small" onClick={() => void discardHeld(entry.id)} aria-label="Discard held sale" style={{ color: "var(--danger)" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {lastSale && (
        <div className="pos-receipt" aria-hidden="true">
          <h2>AkinFolu Foods</h2>
          <p className="pos-receipt__meta">{lastSale.date}</p>
          <p className="pos-receipt__meta">Ref: {lastSale.reference}</p>
          <p className="pos-receipt__meta">Customer: {lastSale.customerName}</p>
          <table className="pos-receipt__table">
            <tbody>
              {lastSale.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.quantity} × {item.name}</td>
                  <td className="pos-receipt__amt">{formatNaira(Number(item.price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pos-receipt__total"><span>Total</span><span>{formatNaira(lastSale.total)}</span></p>
          <p className="pos-receipt__meta">Payment: {paymentLabel[lastSale.paymentMethod] ?? lastSale.paymentMethod}</p>
          <p className="pos-receipt__foot">Thank you for your patronage.</p>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;
