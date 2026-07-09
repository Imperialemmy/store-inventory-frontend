import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";

interface FormState {
  name: string;
  phone_number: string;
  email: string;
  city: string;
  address: string;
  tags: string;
  notes: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  name: "",
  phone_number: "",
  email: "",
  city: "",
  address: "",
  tags: "",
  notes: "",
  is_active: true,
};

const CustomerForm = () => {
  const { customerId } = useParams<{ customerId?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(customerId);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!customerId) return;
    api.get(`/customers/${customerId}/`).then((res) => {
      const c = res.data;
      setForm({
        name: c.name ?? "",
        phone_number: c.phone_number ?? "",
        email: c.email ?? "",
        city: c.city ?? "",
        address: c.address ?? "",
        tags: (c.tags ?? []).map((t: { name: string }) => t.name).join(", "),
        notes: c.notes ?? "",
        is_active: c.is_active,
      });
    });
  }, [customerId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const payload = {
      name: form.name,
      phone_number: form.phone_number || null,
      email: form.email || null,
      city: form.city || null,
      address: form.address || null,
      notes: form.notes || null,
      is_active: form.is_active,
      tag_names: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit) {
        await api.put(`/customers/${customerId}/`, payload);
      } else {
        await api.post("/customers/", payload);
      }
      navigate("/customers");
    } catch {
      setStatus({ tone: "error", text: "Could not save the customer. Check the details and try again." });
      setSaving(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <PageHeader
        eyebrow="Customer directory"
        title={isEdit ? "Edit customer" : "New customer"}
        description="Capture who they are and how to reach them."
      />

      <form className="surface form-card" onSubmit={handleSubmit}>
        {status && <div className={`notice notice--${status.tone}`} role="alert">{status.text}</div>}

        <div className="form-grid">
          <label className="field">
            <span>Customer name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Mama Tobi Stores" />
          </label>

          <label className="field">
            <span>Phone</span>
            <input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="e.g. 0803 000 0000" />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="e.g. buyer@example.com" />
          </label>

          <label className="field">
            <span>City / Location</span>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Lagos" />
          </label>

          <label className="field">
            <span>Address</span>
            <textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
          </label>

          <label className="field">
            <span>Tags (comma separated)</span>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="e.g. VIP, Special Pricing" />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth remembering about this customer" />
          </label>

          <label className="field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} style={{ width: "18px", height: "18px" }} />
            <span>Active customer</span>
          </label>
        </div>

        <div className="form-actions">
          <Link className="button button--ghost" to="/customers">Cancel</Link>
          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update customer" : "Save customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
