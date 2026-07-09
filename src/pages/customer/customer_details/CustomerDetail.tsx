import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Customer, formatNaira } from "../customerTypes";
import { type Sale, statusLabel } from "../../sales/salesTypes";

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const userRole = useUserRole();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const [c, s] = await Promise.all([
        api.get<Customer>(`/customers/${customerId}/`),
        api.get(`/sales/?customer=${customerId}&page_size=100`),
      ]);
      setCustomer(c.data);
      setSales(s.data.results || s.data);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${customerId}/`);
      navigate("/customers");
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  if (loading) return <div className="page-container"><p style={{ color: "var(--ink-600)" }}>Loading…</p></div>;
  if (!customer) return <div className="page-container"><div className="surface empty-state"><strong>Customer not found.</strong></div></div>;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Customer directory"
        title={customer.name}
        description={customer.city ? `Customer · ${customer.city}` : "Customer"}
        action={
          userRole.canSell ? (
            <div className="page-actions">
              <Link className="button button--ghost" to={`/customers/${customer.id}/edit`}>Edit</Link>
              <button className="button button--danger" onClick={handleDelete}>Delete</button>
            </div>
          ) : undefined
        }
      />

      <div className="customer-detail-grid">
        {/* Profile */}
        <section className="surface form-card">
          <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Profile</h3>
          <dl className="customer-dl">
            <div><dt>Phone</dt><dd>{customer.phone_number || "—"}</dd></div>
            <div><dt>Email</dt><dd>{customer.email || "—"}</dd></div>
            <div><dt>City</dt><dd>{customer.city || "—"}</dd></div>
            <div><dt>Address</dt><dd>{customer.address || "—"}</dd></div>
            <div><dt>Status</dt><dd>{customer.is_active ? "Active" : "Inactive"}</dd></div>
          </dl>

          {customer.tags.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              {customer.tags.map((tag) => (
                <span key={tag.id} className="customer-chip" style={{ marginRight: "8px" }}>{tag.name}</span>
              ))}
            </div>
          )}

          {customer.notes && (
            <p style={{ marginTop: "16px", color: "var(--ink-600)" }}>
              <strong style={{ color: "var(--leaf-800)" }}>Notes:</strong> {customer.notes}
            </p>
          )}
        </section>

        {/* Purchase history */}
        <section className="surface form-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <h3 style={{ margin: 0, color: "var(--leaf-950)" }}>Purchase history</h3>
            {sales.length > 0 && (
              <Link className="button button--ghost button--small" to={`/customers/${customer.id}/statement`}>Statement</Link>
            )}
          </div>

          {sales.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 12px" }}>
              <strong>No sales yet</strong>
              <p>Invoices raised for this customer will appear here.</p>
            </div>
          ) : (
            <table className="glass-table" style={{ marginTop: "12px" }}>
              <thead>
                <tr><th>Invoice</th><th>Date</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Balance</th></tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/sales/${s.id}`)}>
                    <td>{s.invoice_number}</td>
                    <td>{s.date}</td>
                    <td style={{ textAlign: "right" }}>{formatNaira(s.total)}</td>
                    <td style={{ textAlign: "right", color: Number(s.balance) > 0 ? "var(--tomato-500)" : "var(--leaf-650)" }}>
                      {Number(s.balance) > 0 ? formatNaira(s.balance) : statusLabel(s.payment_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerDetail;
