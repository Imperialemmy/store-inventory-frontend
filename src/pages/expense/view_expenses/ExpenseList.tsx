import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Expense, formatNaira } from "../expenseTypes";

const ExpenseList = () => {
  const userRole = useUserRole();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/expenses/?page_size=200")
      .then((res) => setExpenses(res.data.results || res.data))
      .catch((err) => console.error("Error fetching expenses:", err))
      .finally(() => setLoading(false));
  }, []);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Spend tracking"
        title="Expenses"
        description="Every cost the business records, by category and payment method."
        action={
          <div className="page-actions">
            {userRole.canManage && <Link className="button button--primary" to="/expenses/add"><Plus size={16} /> Add expense</Link>}
          </div>
        }
      />

      <section className="surface list-surface">
        {loading ? (
          <div className="empty-state"><strong>Loading…</strong></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state"><strong>No expenses yet</strong><p>Record your first business expense.</p></div>
        ) : (
          <>
            <div className="search-box" style={{ gridTemplateColumns: "1fr auto" }}>
              <span style={{ fontWeight: 700, color: "var(--leaf-950)" }}>{expenses.length} expense{expenses.length === 1 ? "" : "s"}</span>
              <small>Total {formatNaira(total)}</small>
            </div>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Date</th><th>Description</th><th>Category</th><th>Method</th>
                  <th style={{ textAlign: "right" }}>Amount</th><th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td style={{ fontWeight: 650 }}>{e.description}</td>
                    <td><span className="customer-chip">{e.category_name}</span></td>
                    <td>{e.method_display}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatNaira(e.amount)}</td>
                    <td>{e.receipt ? <a className="inventory-list__open" href={e.receipt} target="_blank" rel="noreferrer">View</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
};

export default ExpenseList;
