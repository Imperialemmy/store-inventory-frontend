import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { type ExpenseCategory, PAYMENT_METHODS } from "../expenseTypes";

interface SupplierOption {
  id: number;
  name: string;
}

const AddExpense = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [form, setForm] = useState({
    category: "",
    supplier: "",
    description: "",
    amount: "",
    payment_method: "cash",
    reference: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/expense-categories/").then((res) => setCategories(res.data.results || res.data));
    api.get("/suppliers/?page_size=1000").then((res) => setSuppliers(res.data.results || res.data));
  }, []);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.category) return setError("Choose a category.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount.");

    const data = new FormData();
    data.append("category", form.category);
    if (form.supplier) data.append("supplier", form.supplier);
    data.append("description", form.description);
    data.append("amount", form.amount);
    data.append("payment_method", form.payment_method);
    if (form.reference) data.append("reference", form.reference);
    data.append("date", form.date);
    if (receipt) data.append("receipt", receipt);

    setSaving(true);
    try {
      await api.post("/expenses/", data);
      navigate("/expenses");
    } catch {
      setError("Could not save the expense. Check the details and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="page-container page-container--narrow">
      <PageHeader eyebrow="Spend tracking" title="Add expense" description="Record a cost, attach a receipt, and tag it to a category." />

      {categories.length === 0 ? (
        <div className="surface form-card">
          <div className="notice notice--error">You need an expense category first.</div>
          <Link className="button button--primary" to="/expenses/categories/add">Create a category</Link>
        </div>
      ) : (
        <form className="surface form-card" onSubmit={handleSubmit}>
          {error && <div className="notice notice--error" role="alert">{error}</div>}
          <div className="form-grid">
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} required>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Description</span>
              <input value={form.description} onChange={(e) => set("description", e.target.value)} required placeholder="e.g. Diesel for delivery van" />
            </label>

            <label className="field">
              <span>Amount (₦)</span>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
            </label>

            <label className="field">
              <span>Payment method</span>
              <select value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Supplier (optional)</span>
              <select value={form.supplier} onChange={(e) => set("supplier", e.target.value)}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Reference (optional)</span>
              <input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="Receipt no., txn id…" />
            </label>

            <label className="field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </label>

            <label className="field">
              <span>Receipt (optional)</span>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className="form-actions">
            <Link className="button button--ghost" to="/expenses">Cancel</Link>
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save expense"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddExpense;
