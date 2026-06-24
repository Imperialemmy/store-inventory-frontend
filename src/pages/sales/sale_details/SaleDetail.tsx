import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Sale, PAYMENT_METHODS, formatNaira, statusLabel } from "../salesTypes";

const SaleDetail = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const userRole = useUserRole();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [savingPay, setSavingPay] = useState(false);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<Sale>(`/sales/${saleId}/`);
      setSale(res.data);
    } catch (error) {
      console.error("Failed to fetch sale:", error);
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const handleAddPayment = async (event: FormEvent) => {
    event.preventDefault();
    setPayError(null);
    if (!amount || Number(amount) <= 0) return setPayError("Enter a valid amount.");
    setSavingPay(true);
    try {
      await api.post("/payments/", { sale: Number(saleId), amount, method, reference: reference || null });
      setAmount("");
      setReference("");
      await fetchSale();
    } catch {
      setPayError("Could not record the payment.");
    } finally {
      setSavingPay(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this sale? Stock will be returned and the customer balance updated.")) return;
    try {
      await api.delete(`/sales/${saleId}/`);
      navigate("/sales");
    } catch {
      window.alert("Could not delete the sale.");
    }
  };

  if (loading) return <div className="page-container"><p style={{ color: "var(--ink-600)" }}>Loading…</p></div>;
  if (!sale) return <div className="page-container"><div className="surface empty-state"><strong>Sale not found.</strong></div></div>;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Invoice"
        title={sale.invoice_number}
        description={`${sale.customer_name} · ${statusLabel(sale.payment_status)}`}
        action={
          <div className="page-actions no-print">
            <button className="button button--ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print / PDF
            </button>
            {userRole.role === "admin" && (
              <button className="button button--danger" onClick={handleDelete}>Delete</button>
            )}
          </div>
        }
      />

      {/* Printable branded invoice */}
      <section className="surface invoice-sheet">
        <header className="invoice-head">
          <div>
            <h2 className="invoice-brand">Akinfolu Foods</h2>
            <p className="invoice-brand__sub">Food wholesale &amp; distribution · Lagos</p>
          </div>
          <div className="invoice-meta">
            <div><span>Invoice</span><strong>{sale.invoice_number}</strong></div>
            <div><span>Date</span><strong>{sale.date}</strong></div>
            {sale.salesperson && <div><span>Salesperson</span><strong>{sale.salesperson}</strong></div>}
          </div>
        </header>

        <div className="invoice-billto">
          <span className="customer-stat__label">Bill to</span>
          <strong>{sale.customer_name}</strong>
          <span style={{ color: "var(--ink-600)", textTransform: "capitalize" }}>{sale.customer_type} customer</span>
        </div>

        <table className="glass-table invoice-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: "right" }}>Qty</th>
              <th style={{ textAlign: "right" }}>Unit price</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td>{item.variant_label}</td>
                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>{formatNaira(item.unit_price)}</td>
                <td style={{ textAlign: "right" }}>{formatNaira(item.line_total ?? Number(item.unit_price) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="sale-totals invoice-totals">
          <div><dt>Subtotal</dt><dd>{formatNaira(sale.subtotal)}</dd></div>
          <div><dt>Discount</dt><dd>− {formatNaira(sale.discount)}</dd></div>
          <div><dt>VAT ({sale.vat_rate}%)</dt><dd>{formatNaira(sale.vat_amount)}</dd></div>
          <div className="sale-totals__grand"><dt>Total</dt><dd>{formatNaira(sale.total)}</dd></div>
          <div><dt>Paid</dt><dd>{formatNaira(sale.amount_paid)}</dd></div>
          <div className="sale-totals__grand"><dt>Balance due</dt><dd>{formatNaira(sale.balance)}</dd></div>
        </dl>

        {sale.notes && <p className="invoice-notes">{sale.notes}</p>}
        <p className="invoice-foot">Thank you for your business.</p>
      </section>

      {/* Payments (not printed) */}
      <section className="surface form-card no-print" style={{ marginTop: "18px" }}>
        <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Payments</h3>

        {sale.payments.length > 0 ? (
          <table className="glass-table" style={{ marginBottom: "18px" }}>
            <thead>
              <tr><th>Date</th><th>Method</th><th>Reference</th><th style={{ textAlign: "right" }}>Amount</th></tr>
            </thead>
            <tbody>
              {sale.payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.date}</td>
                  <td>{p.method_display}</td>
                  <td>{p.reference || "—"}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "var(--ink-600)" }}>No payments recorded yet.</p>
        )}

        {Number(sale.balance) > 0 && (
          <form onSubmit={handleAddPayment}>
            {payError && <div className="notice notice--error" role="alert">{payError}</div>}
            <div className="form-grid sale-summary__inputs">
              <label className="field">
                <span>Amount (₦)</span>
                <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(sale.balance)} />
              </label>
              <label className="field">
                <span>Method</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Reference</span>
                <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
              </label>
            </div>
            <div className="form-actions">
              <button className="button button--primary" type="submit" disabled={savingPay}>
                {savingPay ? "Saving…" : "Record payment"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default SaleDetail;
