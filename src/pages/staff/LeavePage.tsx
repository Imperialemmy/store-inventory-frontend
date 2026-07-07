import { useCallback, useEffect, useState, type FormEvent } from "react";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { type Employee, type LeaveRequest, LEAVE_TYPES } from "./staffTypes";

const statusColor: Record<string, string | undefined> = {
  approved: "var(--brand)",
  rejected: "var(--danger)",
};

const LeavePage = () => {
  const { canManage } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ employee: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, lvs] = await Promise.all([
        api.get("/employees/?is_active=true"),
        api.get("/leaves/"),
      ]);
      setEmployees(emps.data.results || emps.data);
      setLeaves(lvs.data.results || lvs.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.employee || !form.start_date || !form.end_date) return setError("Employee and dates are required.");
    setSaving(true);
    try {
      await api.post("/leaves/", { ...form, employee: Number(form.employee), reason: form.reason || null });
      setForm({ employee: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });
      await load();
    } catch {
      setError("Could not save the leave request.");
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id: number, action: "approve" | "reject") => {
    await api.post(`/leaves/${id}/${action}/`);
    await load();
  };

  return (
    <div className="page-container">
      <PageHeader eyebrow="Staff" title="Leave" description="Request, approve and track staff leave." />

      {canManage && (
        <form className="surface form-card" style={{ marginBottom: "18px" }} onSubmit={submit}>
          {error && <div className="notice notice--error" role="alert">{error}</div>}
          <div className="form-grid sale-summary__inputs" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <label className="field">
              <span>Employee</span>
              <select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>
                <option value="">Select…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Type</span>
              <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
                {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>From</span>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </label>
            <label className="field">
              <span>To</span>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </label>
          </div>
          <div className="form-grid" style={{ marginTop: "14px" }}>
            <label className="field">
              <span>Reason</span>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional" />
            </label>
          </div>
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Request leave"}
            </button>
          </div>
        </form>
      )}

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state"><strong>No leave requests</strong><p>Requests will appear here for approval.</p></div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>{canManage && <th />}</tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave.id}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{leave.employee_name}</td>
                  <td style={{ textTransform: "capitalize" }}>{leave.leave_type}</td>
                  <td>{leave.start_date}</td>
                  <td>{leave.end_date}</td>
                  <td>{leave.reason || "—"}</td>
                  <td>
                    <span className="customer-chip" style={{ color: statusColor[leave.status] }}>
                      {leave.status}
                    </span>
                  </td>
                  {canManage && (
                    <td style={{ textAlign: "right" }}>
                      {leave.status === "pending" && (
                        <span style={{ display: "inline-flex", gap: "8px" }}>
                          <button className="button button--primary button--small" onClick={() => decide(leave.id, "approve")}>Approve</button>
                          <button className="button button--danger button--small" onClick={() => decide(leave.id, "reject")}>Reject</button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default LeavePage;
