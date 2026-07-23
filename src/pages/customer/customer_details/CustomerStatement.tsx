import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { type Customer, formatNaira } from "../customerTypes";
import { type Sale, invoiceStatusLabel } from "../../sales/salesTypes";
import { queryKeys } from "../../../query/queryKeys";

const CustomerStatement = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: queryKeys.customer(customerId!),
    queryFn: async () => (await api.get<Customer>(`/customers/${customerId}/`)).data,
    enabled: Boolean(customerId),
  });
  const { data: sales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: queryKeys.customerSales(customerId!),
    queryFn: async () => {
      const response = await api.get(`/sales/?customer=${customerId}&page_size=1000`);
      return response.data.results || response.data;
    },
    enabled: Boolean(customerId),
  });
  const loading = customerLoading || salesLoading;

  if (loading) return <div className="page-container"><p style={{ color: "var(--ink-600)" }}>Loading…</p></div>;
  if (!customer) return <div className="page-container"><div className="surface empty-state"><strong>Customer not found.</strong></div></div>;

  const ordered = [...sales].sort((a, b) => a.date.localeCompare(b.date));
  const totalBilled = ordered.reduce((sum, s) => sum + Number(s.total), 0);
  const totalReturned = ordered.reduce((sum, s) => sum + Number(s.amount_credited), 0);
  const netBilled = ordered.reduce((sum, s) => sum + Number(s.net_total), 0);
  const totalPaid = ordered.reduce((sum, s) => sum + Number(s.amount_paid), 0);
  const totalRefunded = ordered.reduce((sum, s) => sum + Number(s.amount_refunded), 0);
  const outstanding = ordered.reduce((sum, s) => sum + Number(s.receivable), 0);
  const refundsDue = ordered.reduce((sum, s) => sum + Number(s.refund_due), 0);

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
            <div><span>As of</span><strong>{new Date().toISOString().slice(0, 10)}</strong></div>
          </div>
        </header>

        {ordered.length === 0 ? (
          <p style={{ marginTop: "20px", color: "var(--ink-600)" }}>No transactions yet.</p>
        ) : (
          <div style={{ marginTop: "20px", overflowX: "auto" }}>
            <table className="glass-table invoice-table">
              <thead>
                <tr>
                  <th>Date</th><th>Invoice</th>
                  <th style={{ textAlign: "right" }}>Original</th>
                  <th style={{ textAlign: "right" }}>Returned</th>
                  <th style={{ textAlign: "right" }}>Net</th>
                  <th style={{ textAlign: "right" }}>Paid</th>
                  <th style={{ textAlign: "right" }}>Refunded</th>
                  <th style={{ textAlign: "right" }}>Customer owes</th>
                  <th style={{ textAlign: "right" }}>Refund due</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((s) => (
                  <tr key={s.id}>
                    <td>{s.date}</td>
                    <td>{s.invoice_number}<br /><small>{invoiceStatusLabel(s)}</small></td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.total)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.amount_credited)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.net_total)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.amount_paid)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.amount_refunded)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.receivable)}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.refund_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <dl className="sale-totals invoice-totals">
          <div><dt>Total billed</dt><dd>{formatNaira(totalBilled)}</dd></div>
          <div><dt>Total returned</dt><dd>− {formatNaira(totalReturned)}</dd></div>
          <div><dt>Net billed</dt><dd>{formatNaira(netBilled)}</dd></div>
          <div><dt>Total paid</dt><dd>{formatNaira(totalPaid)}</dd></div>
          <div><dt>Total refunded</dt><dd>− {formatNaira(totalRefunded)}</dd></div>
          <div className="sale-totals__grand"><dt>Customer owes</dt><dd>{formatNaira(outstanding)}</dd></div>
          <div className="sale-totals__grand"><dt>Refunds due</dt><dd>{formatNaira(refundsDue)}</dd></div>
        </dl>
        <p className="invoice-foot">Thank you for your business.</p>
      </section>
    </div>
  );
};

export default CustomerStatement;
