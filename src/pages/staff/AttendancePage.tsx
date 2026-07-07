import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { type Employee, type AttendanceRecord, ATTENDANCE_STATUSES } from "./staffTypes";

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const { canManage } = useUserRole();
  const [date, setDate] = useState(today());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Record<number, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, atts] = await Promise.all([
        api.get("/employees/?is_active=true"),
        api.get(`/attendance/?date=${date}&page_size=100`),
      ]);
      setEmployees(emps.data.results || emps.data);
      const list: AttendanceRecord[] = atts.data.results || atts.data;
      setRecords(Object.fromEntries(list.map((r) => [r.employee, r])));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (employee: number, status: string) => {
    const res = await api.post("/attendance/mark/", { employee, date, status });
    setRecords((prev) => ({ ...prev, [employee]: res.data }));
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Staff"
        title="Attendance"
        description="Mark who is in today. Unmarked days count as present for payroll."
      />

      <div className="surface form-card" style={{ marginBottom: "18px", maxWidth: 320 }}>
        <label className="field">
          <span>Day</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><strong>No active employees</strong><p>Add staff under Employees first.</p></div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr><th>Employee</th><th>Status</th>{canManage && <th>Mark</th>}</tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const record = records[employee.id];
                return (
                  <tr key={employee.id}>
                    <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{employee.name}</td>
                    <td>
                      <span
                        className="customer-chip"
                        style={record?.status === "absent" ? { color: "var(--danger)" } : undefined}
                      >
                        {ATTENDANCE_STATUSES.find((s) => s.value === record?.status)?.label ?? "Not marked"}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {ATTENDANCE_STATUSES.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              className={`button button--small ${record?.status === s.value ? "button--primary" : "button--ghost"}`}
                              onClick={() => mark(employee.id, s.value)}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AttendancePage;
