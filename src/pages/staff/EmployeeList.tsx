import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { type Employee, formatNaira } from "./staffTypes";

const EmployeeList = () => {
  const navigate = useNavigate();
  const { canManage } = useUserRole();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/employees/")
      .then((res) => setEmployees(res.data.results || res.data))
      .catch((err) => console.error("Error fetching employees:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Staff"
        title="Employees"
        description="Your team, their roles and salaries."
        action={canManage ? <Link className="button button--primary" to="/staff/employees/add"><Plus size={16} /> Add employee</Link> : undefined}
      />

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><strong>No employees yet</strong><p>Add your first staff member to get started.</p></div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Phone</th><th>Started</th>
                <th style={{ textAlign: "right" }}>Monthly salary</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} style={{ cursor: canManage ? "pointer" : undefined }}
                    onClick={() => canManage && navigate(`/staff/employees/${e.id}/edit`)}>
                  <td style={{ fontWeight: 700, color: "var(--ink-900)" }}>{e.name}</td>
                  <td>{e.role_title || "—"}</td>
                  <td>{e.phone_number || "—"}</td>
                  <td>{e.start_date}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{formatNaira(e.monthly_salary)}</td>
                  <td>
                    <span className="customer-chip" style={!e.is_active ? { color: "var(--danger)" } : undefined}>
                      {e.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default EmployeeList;
