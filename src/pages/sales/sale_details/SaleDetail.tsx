import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Sale, PAYMENT_METHODS, formatNaira, statusLabel } from "../salesTypes";

const SaleDetail = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const userRole = useUserRole();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [savingPay, setSavingPay] = useState(false);

  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
  const [savingReturn, setSavingReturn] = useState(false);

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

  const handleReturn = async (event: FormEvent) => {
    event.preventDefault();
    setReturnError(null);
    setReturnSuccess(null);
    if (!sale) return;

    const items = Object.entries(returnQty)
      .map(([saleItem, qty]) => ({ sale_item: Number(saleItem), quantity: Number(qty) }))
      .filter((row) => row.quantity > 0);
    if (items.length === 0) return setReturnError("Enter how many units to return.");

    // Validate up front against what's still returnable so the user gets an
    // immediate, specific message instead of a generic server error.
    for (const row of items) {
      const line = sale.items.find((i) => i.id === row.sale_item);
      const returnable = line ? line.quantity - (line.returned_quantity ?? 0) : 0;
      if (!Number.isInteger(row.quantity) || row.quantity < 0) {
        return setReturnError("Return quantities must be whole numbers.");
      }
      if (row.quantity > returnable) {
        return setReturnError(`You can return at most ${returnable} × ${line?.product_name}.`);
      }
    }

    const totalUnits = items.reduce((sum, row) => sum + row.quantity, 0);
    setSavingReturn(true);
    try {
      await api.post("/credit-notes/", {
        sale: Number(saleId),
        reason: returnReason || null,
        items,
      });
      setReturnQty({});
      setReturnReason("");
      await fetchSale();
      setReturnSuccess(`Return recorded — ${totalUnits} unit${totalUnits === 1 ? "" : "s"} credited and restocked.`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: unknown } })?.response?.data;
      setReturnError(Array.isArray(detail) ? String(detail[0]) : "Could not record the return.");
    } finally {
      setSavingReturn(false);
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
                <td>{item.product_name}</td>
                <td style={{ textAlign: "right" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>{formatNaira(item.unit_price)}</td>
                <td style={{ textAlign: "right" }}>{formatNaira(item.line_total ?? Number(item.unit_price) * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="sale-totals invoice-totals">
          <div><dt>Subtotal</dt><dd>{formatNaira(sale.subtotal)}</dd></div>
          {Number(sale.discount) > 0 && <div><dt>Discount</dt><dd>− {formatNaira(sale.discount)}</dd></div>}
          {Number(sale.vat_amount) > 0 && <div><dt>VAT ({sale.vat_rate}%)</dt><dd>{formatNaira(sale.vat_amount)}</dd></div>}
          <div className="sale-totals__grand"><dt>Total</dt><dd>{formatNaira(sale.total)}</dd></div>
          <div><dt>Paid</dt><dd>{formatNaira(sale.amount_paid)}</dd></div>
          {Number(sale.amount_credited) > 0 && (
            <div><dt>Credited (returns)</dt><dd>− {formatNaira(sale.amount_credited)}</dd></div>
          )}
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

      {/* Returns / credit notes (not printed) */}
      <section className="surface form-card no-print" style={{ marginTop: "18px" }}>
        <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Returns</h3>

        {returnSuccess && <div className="notice notice--success" role="status">{returnSuccess}</div>}

        {sale.credit_notes.length > 0 && (
          <table className="glass-table" style={{ marginBottom: "18px" }}>
            <thead>
              <tr><th>Date</th><th>Items</th><th>Reason</th><th style={{ textAlign: "right" }}>Credited</th></tr>
            </thead>
            <tbody>
              {sale.credit_notes.map((note) => (
                <tr key={note.id}>
                  <td>{note.created_at.slice(0, 10)}</td>
                  <td>{note.items.map((i) => `${i.quantity} × ${i.product_name}`).join(", ")}</td>
                  <td>{note.reason || "—"}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(note.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {userRole.canSell && sale.items.some((i) => i.quantity - (i.returned_quantity ?? 0) > 0) ? (
          <form onSubmit={handleReturn}>
            {returnError && <div className="notice notice--error" role="alert">{returnError}</div>}
            <table className="glass-table" style={{ marginBottom: "14px" }}>
              <thead>
                <tr><th>Item</th><th style={{ textAlign: "right" }}>Sold</th><th style={{ textAlign: "right" }}>Returned</th><th style={{ width: 120 }}>Return now</th></tr>
              </thead>
              <tbody>
                {sale.items.map((item) => {
                  const returnable = item.quantity - (item.returned_quantity ?? 0);
                  return (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>{item.returned_quantity ?? 0}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={returnable}
                          disabled={returnable <= 0}
                          value={returnQty[item.id!] ?? ""}
                          onChange={(e) => {
                            // Clamp to what's still returnable so an over-return
                            // can't even be typed.
                            const raw = e.target.value;
                            if (raw === "") return setReturnQty((prev) => ({ ...prev, [item.id!]: "" }));
                            const clamped = Math.max(0, Math.min(returnable, Math.floor(Number(raw) || 0)));
                            setReturnQty((prev) => ({ ...prev, [item.id!]: String(clamped) }));
                          }}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--line-strong)", borderRadius: "9px", background: "var(--input-bg)" }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="form-grid sale-summary__inputs" style={{ gridTemplateColumns: "1fr" }}>
              <label className="field">
                <span>Reason</span>
                <input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="e.g. Damaged in transit" />
              </label>
            </div>
            <div className="form-actions">
              <button className="button button--accent" type="submit" disabled={savingReturn}>
                {savingReturn ? "Saving…" : "Record return"}
              </button>
            </div>
          </form>
        ) : (
          sale.credit_notes.length === 0 && <p style={{ color: "var(--ink-600)" }}>No returns recorded.</p>
        )}
      </section>
    </div>
  );
};

export default SaleDetail;
