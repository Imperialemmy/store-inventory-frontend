import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { formatNaira } from "../expenseTypes";

interface Report {
  totals: { expenses: string; revenue: string; profit: string };
  by_category: { category: string; budget: string; spent: string }[];
  by_month: { bucket: string; total: string; count: number }[];
}

const firstOfYear = () => `${new Date().getFullYear()}-01-01`;
const today = () => new Date().toISOString().slice(0, 10);

const ExpenseReport = () => {
  const [start, setStart] = useState(firstOfYear());
  const [end, setEnd] = useState(today());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/expenses/report/?start=${start}&end=${end}`)
      .then((res) => setReport(res.data))
      .catch((err) => console.error("Expense report failed:", err))
      .finally(() => setLoading(false));
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const profit = report ? Number(report.totals.profit) : 0;
  const maxMonth = report ? Math.max(...report.by_month.map((m) => Number(m.total)), 1) : 1;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Spend tracking"
        title="Profit & loss"
        description="Revenue against expenses, budget vs actual, and monthly spend."
      />

      <div className="surface form-card" style={{ marginBottom: "18px" }}>
        <div className="form-grid sale-summary__inputs" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label className="field"><span>From</span><input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="field"><span>To</span><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
      </div>

      {loading || !report ? (
        <p style={{ color: "var(--ink-600)" }}>Loading…</p>
      ) : (
        <>
          <section className="customer-stats">
            <div className="surface customer-stat"><span className="customer-stat__label">Revenue</span><strong className="customer-stat__value" style={{ color: "var(--leaf-650)" }}>{formatNaira(report.totals.revenue)}</strong></div>
            <div className="surface customer-stat"><span className="customer-stat__label">Expenses</span><strong className="customer-stat__value" style={{ color: "var(--tomato-500)" }}>{formatNaira(report.totals.expenses)}</strong></div>
            <div className="surface customer-stat"><span className="customer-stat__label">{profit >= 0 ? "Profit" : "Loss"}</span><strong className="customer-stat__value" style={{ color: profit >= 0 ? "var(--leaf-650)" : "var(--tomato-500)" }}>{formatNaira(report.totals.profit)}</strong></div>
          </section>

          <div className="customer-detail-grid">
            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Budget vs actual</h3>
              {report.by_category.length === 0 ? <p style={{ color: "var(--ink-600)" }}>No categories yet.</p> : (
                <div className="report-bars">
                  {report.by_category.map((c) => {
                    const budget = Number(c.budget);
                    const spent = Number(c.spent);
                    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : spent > 0 ? 100 : 0;
                    const over = budget > 0 && spent > budget;
                    return (
                      <div className="report-bar" key={c.category}>
                        <span className="report-bar__label">{c.category}</span>
                        <span className="report-bar__track">
                          <span className="report-bar__fill" style={{ width: `${pct}%`, background: over ? "var(--tomato-500)" : undefined }} />
                        </span>
                        <span className="report-bar__value">
                          {formatNaira(spent)}{budget > 0 ? ` / ${formatNaira(budget)}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="surface form-card">
              <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Monthly spend</h3>
              {report.by_month.length === 0 ? <p style={{ color: "var(--ink-600)" }}>No expenses in range.</p> : (
                <div className="report-bars">
                  {report.by_month.map((m) => (
                    <div className="report-bar" key={m.bucket}>
                      <span className="report-bar__label">{m.bucket?.slice(0, 7)}</span>
                      <span className="report-bar__track"><span className="report-bar__fill" style={{ width: `${(Number(m.total) / maxMonth) * 100}%` }} /></span>
                      <span className="report-bar__value">{formatNaira(m.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseReport;
