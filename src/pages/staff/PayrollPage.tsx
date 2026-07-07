import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { type PayrollRun, formatNaira, monthLabel } from "./staffTypes";

const currentMonth = () => `${new Date().toISOString().slice(0, 7)}-01`;

const PayrollPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [month, setMonth] = useState(currentMonth().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/payroll-runs/")
      .then((res) => setRuns(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runPayroll = async () => {
    setError(null);
    setRunning(true);
    try {
      const res = await api.post("/payroll-runs/", { month: `${month}-01` });
      navigate(`/staff/payroll/${res.data.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      setError(
        typeof detail === "object" && detail !== null && "detail" in detail
          ? String((detail as { detail?: unknown }).detail)
          : Array.isArray(detail) ? String(detail[0]) : "Could not run payroll."
      );
      setRunning(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Staff"
        title="Payroll"
        description="Compute monthly salaries from attendance, then pay and print payslips."
      />

      {isAdmin && (
        <div className="surface form-card" style={{ marginBottom: "18px" }}>
          {error && <div className="notice notice--error" role="alert">{error}</div>}
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="field" style={{ minWidth: 200 }}>
              <span>Payroll month</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <button className="button button--primary" onClick={runPayroll} disabled={running}>
              {running ? "Computing…" : "Run payroll"}
            </button>
          </div>
        </div>
      )}

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : runs.length === 0 ? (
          <div className="empty-state"><strong>No payroll runs yet</strong><p>Run your first month to generate payslips.</p></div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr><th>Month</th><th>Payslips</th><th>Run by</th><th style={{ textAlign: "right" }}>Total net pay</th><th /></tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/staff/payroll/${run.id}`)}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{monthLabel(run.month)}</td>
                  <td>{run.payslips.length}</td>
                  <td>{run.created_by_name || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{formatNaira(run.total_net)}</td>
                  <td style={{ textAlign: "right" }}><span className="inventory-list__open">Open →</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default PayrollPage;
