import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { type Customer, formatNaira } from "../customerTypes";
import { type Sale } from "../../sales/salesTypes";

const CustomerStatement = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, s] = await Promise.all([
        api.get<Customer>(`/customers/${customerId}/`),
        api.get(`/sales/?customer=${customerId}&page_size=1000`),
      ]);
      setCustomer(c.data);
      setSales(s.data.results || s.data);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="page-container"><p style={{ color: "var(--ink-600)" }}>Loading…</p></div>;
  if (!customer) return <div className="page-container"><div className="surface empty-state"><strong>Customer not found.</strong></div></div>;

  const ordered = [...sales].sort((a, b) => a.date.localeCompare(b.date));
  const totalBilled = ordered.reduce((sum, s) => sum + Number(s.total), 0);
  const totalPaid = ordered.reduce((sum, s) => sum + Number(s.amount_paid), 0);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Customer directory"
        title="Statement"
        description={customer.name}
        action={
          <div className="page-actions no-print">
            <Link className="button button--ghost" to={`/customers/${customer.id}`}>Back</Link>
            <button className="button button--ghost" onClick={() => window.print()}><Printer size={16} /> Print / PDF</button>
          </div>
        }
      />

      <section className="surface invoice-sheet">
        <header className="invoice-head">
          <div>
            <h2 className="invoice-brand">Akinfolu Foods</h2>
            <p className="invoice-brand__sub">Customer statement</p>
          </div>
          <div className="invoice-meta">
            <div><span>Customer</span><strong>{customer.name}</strong></div>
            <div><span>Type</span><strong style={{ textTransform: "capitalize" }}>{customer.customer_type}</strong></div>
            <div><span>As of</span><strong>{new Date().toISOString().slice(0, 10)}</strong></div>
          </div>
        </header>

        {ordered.length === 0 ? (
          <p style={{ marginTop: "20px", color: "var(--ink-600)" }}>No transactions yet.</p>
        ) : (
          <table className="glass-table invoice-table" style={{ marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Date</th><th>Invoice</th>
                <th style={{ textAlign: "right" }}>Billed</th>
                <th style={{ textAlign: "right" }}>Paid</th>
                <th style={{ textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((s) => (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{s.invoice_number}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(s.total)}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(s.amount_paid)}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <dl className="sale-totals invoice-totals">
          <div><dt>Total billed</dt><dd>{formatNaira(totalBilled)}</dd></div>
          <div><dt>Total paid</dt><dd>{formatNaira(totalPaid)}</dd></div>
          <div className="sale-totals__grand"><dt>Outstanding</dt><dd>{formatNaira(customer.outstanding_balance)}</dd></div>
        </dl>
        <p className="invoice-foot">Thank you for your business.</p>
      </section>
    </div>
  );
};

export default CustomerStatement;
