import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";

const emptyForm = {
  name: "",
  role_title: "",
  phone_number: "",
  email: "",
  start_date: new Date().toISOString().slice(0, 10),
  monthly_salary: "0",
  performance_notes: "",
  is_active: true,
};

const EmployeeForm = () => {
  const { employeeId } = useParams<{ employeeId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(employeeId);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    api.get(`/employees/${employeeId}/`).then((res) => {
      const e = res.data;
      setForm({
        name: e.name ?? "",
        role_title: e.role_title ?? "",
        phone_number: e.phone_number ?? "",
        email: e.email ?? "",
        start_date: e.start_date,
        monthly_salary: String(e.monthly_salary ?? "0"),
        performance_notes: e.performance_notes ?? "",
        is_active: e.is_active,
      });
    });
  }, [employeeId]);

  const set = (key: keyof typeof emptyForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      role_title: form.role_title || null,
      phone_number: form.phone_number || null,
      email: form.email || null,
      performance_notes: form.performance_notes || null,
    };
    try {
      if (isEdit) await api.put(`/employees/${employeeId}/`, payload);
      else await api.post("/employees/", payload);
      navigate("/staff/employees");
    } catch {
      setError("Could not save the employee. Check the details and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <PageHeader
        eyebrow="Staff"
        title={isEdit ? "Edit employee" : "New employee"}
        description="Who they are, what they do, and what they earn."
      />

      <form className="surface form-card" onSubmit={handleSubmit}>
        {error && <div className="notice notice--error" role="alert">{error}</div>}
        <div className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Chika Obi" />
          </label>
          <label className="field">
            <span>Role / title</span>
            <input value={form.role_title} onChange={(e) => set("role_title", e.target.value)} placeholder="e.g. Warehouse lead" />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="e.g. 0803 000 0000" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Optional" />
          </label>
          <label className="field">
            <span>Start date</span>
            <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required />
          </label>
          <label className="field">
            <span>Monthly salary (₦)</span>
            <input type="number" min="0" step="0.01" value={form.monthly_salary} onChange={(e) => set("monthly_salary", e.target.value)} required />
          </label>
          <label className="field">
            <span>Performance notes</span>
            <textarea rows={3} value={form.performance_notes} onChange={(e) => set("performance_notes", e.target.value)} placeholder="Anything worth remembering" />
          </label>
          <label className="field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} style={{ width: "18px", height: "18px" }} />
            <span>Active employee (included in payroll)</span>
          </label>
        </div>

        <div className="form-actions">
          <Link className="button button--ghost" to="/staff/employees">Cancel</Link>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update employee" : "Save employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
