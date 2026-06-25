import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../salesTypes";

interface Report {
  totals: { sales: string; collected: string; outstanding: string; invoices: number };
  by_period: { bucket: string; total: string; invoices: number }[];
  top_products: { name: string; quantity: number; revenue: string }[];
  by_customer_type: { customer_type: string; total: string; invoices: number }[];
  by_salesperson: { salesperson: string; total: string; invoices: number }[];
}

const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

const SalesReport = () => {
  const [start, setStart] = useState(firstOfMonth());
  const [end, setEnd] = useState(today());
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/sales/report/?start=${start}&end=${end}&period=${period}`)
      .then((res) => setReport(res.data))
      .catch((err) => console.error("Report failed:", err))
      .finally(() => setLoading(false));
  }, [start, end, period]);

  useEffect(() => {
    load();
  }, [load]);

  const maxPeriod = report ? Math.max(...report.by_period.map((p) => Number(p.total)), 1) : 1;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Invoices"
        title="Sales reports"
        description="Revenue, collections and top sellers over a date range."
      />

      <div className="surface form-card" style={{ marginBottom: "18px" }}>
        <div className="form-grid sale-summary__inputs">
          <label className="field"><span>From</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="field"><span>To</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <label className="field">
            <span>Group by</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
        </div>
      </div>

      {loading || !report ? (
        <p style={{ color: "var(--ink-600)" }}>Loading…</p>
      ) : (
        <>
          <section className="customer-stats" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="surface customer-stat"><span className="customer-stat__label">Total sales</span><strong className="customer-stat__value">{formatNaira(report.totals.sales)}</strong></div>
            <div className="surface customer-stat"><span className="customer-stat__label">Collected</span><strong className="customer-stat__value" style={{ color: "var(--leaf-650)" }}>{formatNaira(report.totals.collected)}</strong></div>
            <div className="surface customer-stat"><span className="customer-stat__label">Outstanding</span><strong className="customer-stat__value" style={{ color: Number(report.totals.outstanding) > 0 ? "var(--tomato-500)" : "var(--leaf-650)" }}>{formatNaira(report.totals.outstanding)}</strong></div>
            <div className="surface customer-stat"><span className="customer-stat__label">Invoices</span><strong className="customer-stat__value">{report.totals.invoices}</strong></div>
          </section>

          <div className="customer-detail-grid">
            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Sales over time</h3>
              {report.by_period.length === 0 ? <p style={{ color: "var(--ink-600)" }}>No sales in range.</p> : (
                <div className="report-bars">
                  {report.by_period.map((row) => (
                    <div className="report-bar" key={row.bucket}>
                      <span className="report-bar__label">{row.bucket}</span>
                      <span className="report-bar__track"><span className="report-bar__fill" style={{ width: `${(Number(row.total) / maxPeriod) * 100}%` }} /></span>
                      <span className="report-bar__value">{formatNaira(row.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Top products</h3>
              {report.top_products.length === 0 ? <p style={{ color: "var(--ink-600)" }}>No sales in range.</p> : (
                <table className="glass-table">
                  <thead><tr><th>Product</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Revenue</th></tr></thead>
                  <tbody>
                    {report.top_products.map((p) => (
                      <tr key={p.name}><td>{p.name}</td><td style={{ textAlign: "right" }}>{p.quantity}</td><td style={{ textAlign: "right" }}>{formatNaira(p.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>By customer type</h3>
              <table className="glass-table">
                <thead><tr><th>Type</th><th style={{ textAlign: "right" }}>Invoices</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {report.by_customer_type.map((r) => (
                    <tr key={r.customer_type}><td style={{ textTransform: "capitalize" }}>{r.customer_type}</td><td style={{ textAlign: "right" }}>{r.invoices}</td><td style={{ textAlign: "right" }}>{formatNaira(r.total)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>By salesperson</h3>
              <table className="glass-table">
                <thead><tr><th>Salesperson</th><th style={{ textAlign: "right" }}>Invoices</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {report.by_salesperson.map((r) => (
                    <tr key={r.salesperson}><td>{r.salesperson}</td><td style={{ textAlign: "right" }}>{r.invoices}</td><td style={{ textAlign: "right" }}>{formatNaira(r.total)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReport;
