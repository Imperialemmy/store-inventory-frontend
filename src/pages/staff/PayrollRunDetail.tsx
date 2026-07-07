import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { type PayrollRun, type Payslip, formatNaira, monthLabel } from "./staffTypes";

const PayrollRunDetail = () => {
  const { runId } = useParams<{ runId: string }>();
  const { isAdmin } = useUserRole();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Record<number, { bonus: string; other_deduction: string }>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<PayrollRun>(`/payroll-runs/${runId}/`);
      setRun(res.data);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveAdjustment = async (slip: Payslip) => {
    const values = edit[slip.id];
    if (!values) return;
    await api.patch(`/payslips/${slip.id}/`, {
      bonus: values.bonus || "0",
      other_deduction: values.other_deduction || "0",
    });
    setEdit((prev) => {
      const next = { ...prev };
      delete next[slip.id];
      return next;
    });
    await load();
  };

  const markPaid = async (slip: Payslip) => {
    await api.patch(`/payslips/${slip.id}/`, {
      is_paid: !slip.is_paid,
      paid_on: !slip.is_paid ? new Date().toISOString().slice(0, 10) : null,
    });
    await load();
  };

  if (loading) return <div className="page-container"><p style={{ color: "var(--ink-600)" }}>Loading…</p></div>;
  if (!run) return <div className="page-container"><div className="surface empty-state"><strong>Payroll run not found.</strong></div></div>;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Staff · Payroll"
        title={monthLabel(run.month)}
        description={`${run.payslips.length} payslips · total net ${formatNaira(run.total_net)}`}
        action={
          <div className="page-actions no-print">
            <Link className="button button--ghost" to="/staff/payroll">Back</Link>
            <button className="button button--ghost" onClick={() => window.print()}>
              <Printer size={16} /> Print payslips
            </button>
          </div>
        }
      />

      {/* Working table (not printed) */}
      <section className="surface list-surface no-print" style={{ marginBottom: "18px" }}>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th style={{ textAlign: "right" }}>Base</th>
              <th style={{ textAlign: "right" }}>Absent</th>
              <th style={{ textAlign: "right" }}>Absence ded.</th>
              <th style={{ textAlign: "right" }}>Other ded.</th>
              <th style={{ textAlign: "right" }}>Bonus</th>
              <th style={{ textAlign: "right" }}>Net pay</th>
              <th>Status</th>
              {isAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {run.payslips.map((slip) => {
              const editing = edit[slip.id];
              return (
                <tr key={slip.id}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{slip.employee_name}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(slip.base_salary)}</td>
                  <td style={{ textAlign: "right" }}>{slip.days_absent}</td>
                  <td style={{ textAlign: "right" }}>{formatNaira(slip.absence_deduction)}</td>
                  <td style={{ textAlign: "right" }}>
                    {editing ? (
                      <input type="number" min={0} value={editing.other_deduction}
                        onChange={(e) => setEdit((prev) => ({ ...prev, [slip.id]: { ...editing, other_deduction: e.target.value } }))}
                        style={{ width: 90, padding: "6px 8px", border: "1px solid var(--line-strong)", borderRadius: 8 }} />
                    ) : formatNaira(slip.other_deduction)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {editing ? (
                      <input type="number" min={0} value={editing.bonus}
                        onChange={(e) => setEdit((prev) => ({ ...prev, [slip.id]: { ...editing, bonus: e.target.value } }))}
                        style={{ width: 90, padding: "6px 8px", border: "1px solid var(--line-strong)", borderRadius: 8 }} />
                    ) : formatNaira(slip.bonus)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "var(--ink-900)" }}>{formatNaira(slip.net_pay)}</td>
                  <td>
                    <span className="customer-chip" style={slip.is_paid ? undefined : { color: "var(--danger)" }}>
                      {slip.is_paid ? `Paid ${slip.paid_on ?? ""}` : "Unpaid"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ textAlign: "right" }}>
                      <span style={{ display: "inline-flex", gap: "6px" }}>
                        {editing ? (
                          <button className="button button--primary button--small" onClick={() => saveAdjustment(slip)}>Save</button>
                        ) : (
                          <button className="button button--ghost button--small"
                            onClick={() => setEdit((prev) => ({ ...prev, [slip.id]: { bonus: slip.bonus, other_deduction: slip.other_deduction } }))}>
                            Adjust
                          </button>
                        )}
                        <button className={`button button--small ${slip.is_paid ? "button--ghost" : "button--accent"}`} onClick={() => markPaid(slip)}>
                          {slip.is_paid ? "Unmark" : "Mark paid"}
                        </button>
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Printable payslips */}
      <div className="print-only">
        {run.payslips.map((slip) => (
          <section key={slip.id} className="surface invoice-sheet payslip-sheet">
            <header className="invoice-head">
              <div>
                <h2 className="invoice-brand">Akinfolu Foods</h2>
                <p className="invoice-brand__sub">Payslip — {monthLabel(run.month)}</p>
              </div>
              <div className="invoice-meta">
                <div><span>Employee</span><strong>{slip.employee_name}</strong></div>
                <div><span>Working days</span><strong>{slip.working_days}</strong></div>
              </div>
            </header>
            <dl className="sale-totals invoice-totals" style={{ maxWidth: 420 }}>
              <div><dt>Base salary</dt><dd>{formatNaira(slip.base_salary)}</dd></div>
              <div><dt>Days absent</dt><dd>{slip.days_absent}</dd></div>
              <div><dt>Absence deduction</dt><dd>− {formatNaira(slip.absence_deduction)}</dd></div>
              <div><dt>Other deduction</dt><dd>− {formatNaira(slip.other_deduction)}</dd></div>
              <div><dt>Bonus</dt><dd>{formatNaira(slip.bonus)}</dd></div>
              <div className="sale-totals__grand"><dt>Net pay</dt><dd>{formatNaira(slip.net_pay)}</dd></div>
            </dl>
            <p className="invoice-foot">{slip.is_paid ? `Paid on ${slip.paid_on}` : "Pending payment"}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PayrollRunDetail;
