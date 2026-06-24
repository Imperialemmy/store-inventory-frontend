import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";

interface CustomerOption {
  id: number;
  name: string;
  customer_type: "wholesale" | "retail";
}

interface VariantOption {
  id: number;
  ware_name: string;
  size_detail: { size: string; size_unit: string | null };
  retail_price: string;
  wholesale_price: string;
  stock: number;
}

interface LineItem {
  variant: number | "";
  quantity: number;
  unit_price: string;
}

const emptyLine: LineItem = { variant: "", quantity: 1, unit_price: "" };

const CreateSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [discount, setDiscount] = useState("0");
  const [vatRate, setVatRate] = useState("7.5");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/customers/?page_size=1000").then((res) => setCustomers(res.data.results || res.data));
    api.get("/variants/?page_size=1000").then((res) => setVariants(res.data.results || res.data));
  }, []);

  const variantMap = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);
  const customerType = customers.find((c) => c.id === customerId)?.customer_type;

  const priceFor = (variant: VariantOption) =>
    customerType === "wholesale" && Number(variant.wholesale_price) > 0
      ? variant.wholesale_price
      : variant.retail_price;

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const handleVariantChange = (index: number, variantId: number | "") => {
    const v = variantId ? variantMap.get(Number(variantId)) : undefined;
    updateLine(index, { variant: variantId, unit_price: v ? priceFor(v) : "" });
  };

  // Re-price lines when the customer (and therefore the price tier) changes.
  const handleCustomerChange = (id: number | "") => {
    setCustomerId(id);
    const type = customers.find((c) => c.id === id)?.customer_type;
    setLines((prev) =>
      prev.map((line) => {
        const v = line.variant ? variantMap.get(Number(line.variant)) : undefined;
        if (!v) return line;
        const price = type === "wholesale" && Number(v.wholesale_price) > 0 ? v.wholesale_price : v.retail_price;
        return { ...line, unit_price: price };
      })
    );
  };

  const subtotal = lines.reduce((sum, l) => sum + Number(l.unit_price || 0) * Number(l.quantity || 0), 0);
  const taxable = Math.max(subtotal - Number(discount || 0), 0);
  const vatAmount = (taxable * Number(vatRate || 0)) / 100;
  const total = taxable + vatAmount;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!customerId) return setError("Select a customer.");
    const validLines = lines.filter((l) => l.variant && Number(l.quantity) > 0);
    if (validLines.length === 0) return setError("Add at least one item.");

    setSaving(true);
    try {
      const res = await api.post("/sales/", {
        customer: customerId,
        discount: discount || "0",
        vat_rate: vatRate || "0",
        notes: notes || null,
        items: validLines.map((l) => ({
          variant: Number(l.variant),
          quantity: Number(l.quantity),
          unit_price: l.unit_price,
        })),
      });
      navigate(`/sales/${res.data.id}`);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: unknown } })?.response?.data;
      setError(
        Array.isArray(detail) ? String(detail[0]) : typeof detail === "string" ? detail : "Could not create the sale. Check stock and details."
      );
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Invoices"
        title="New sale"
        description="Pick a customer, add items, and the price tier fills in automatically."
      />

      <form onSubmit={handleSubmit}>
        {error && <div className="notice notice--error" role="alert">{error}</div>}

        <div className="surface form-card" style={{ marginBottom: "18px" }}>
          <div className="form-grid">
            <label className="field">
              <span>Customer</span>
              <select value={customerId} onChange={(e) => handleCustomerChange(e.target.value ? Number(e.target.value) : "")} required>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Line items */}
        <div className="surface form-card" style={{ marginBottom: "18px" }}>
          <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Items</h3>
          <div className="sale-lines">
            {lines.map((line, index) => {
              const v = line.variant ? variantMap.get(Number(line.variant)) : undefined;
              return (
                <div className="sale-line" key={index}>
                  <label className="field sale-line__product">
                    <span>Product</span>
                    <select value={line.variant} onChange={(e) => handleVariantChange(index, e.target.value ? Number(e.target.value) : "")}>
                      <option value="">Select product</option>
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.ware_name} ({variant.size_detail.size}{variant.size_detail.size_unit ?? ""}) · stock {variant.stock}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field sale-line__qty">
                    <span>Qty</span>
                    <input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })} />
                  </label>
                  <label className="field sale-line__price">
                    <span>Unit price</span>
                    <input type="number" min={0} step="0.01" value={line.unit_price} onChange={(e) => updateLine(index, { unit_price: e.target.value })} />
                  </label>
                  <div className="sale-line__total">
                    <span className="customer-stat__label">Line</span>
                    <strong>{formatNaira(Number(line.unit_price || 0) * Number(line.quantity || 0))}</strong>
                  </div>
                  <button
                    type="button"
                    className="button button--ghost button--small sale-line__remove"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    disabled={lines.length === 1}
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                  {v && line.quantity > v.stock && (
                    <p className="sale-line__warn">Only {v.stock} in stock</p>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" className="button button--ghost button--small" onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}>
            <Plus size={16} /> Add item
          </button>
        </div>

        {/* Totals */}
        <div className="surface form-card sale-summary">
          <div className="form-grid sale-summary__inputs">
            <label className="field">
              <span>Discount (₦)</span>
              <input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </label>
            <label className="field">
              <span>VAT rate (%)</span>
              <input type="number" min={0} step="0.1" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            </label>
            <label className="field">
              <span>Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </label>
          </div>
          <dl className="sale-totals">
            <div><dt>Subtotal</dt><dd>{formatNaira(subtotal)}</dd></div>
            <div><dt>Discount</dt><dd>− {formatNaira(discount || 0)}</dd></div>
            <div><dt>VAT ({vatRate || 0}%)</dt><dd>{formatNaira(vatAmount)}</dd></div>
            <div className="sale-totals__grand"><dt>Total</dt><dd>{formatNaira(total)}</dd></div>
          </dl>
        </div>

        <div className="form-actions">
          <Link className="button button--ghost" to="/sales">Cancel</Link>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create sale"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSale;
