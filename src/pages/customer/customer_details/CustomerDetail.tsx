import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";
import { useUserRole } from "../../../hooks/useUserRole";
import { type Customer, formatNaira } from "../customerTypes";

const CustomerDetail = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const userRole = useUserRole();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<Customer>(`/customers/${customerId}/`);
      setCustomer(res.data);
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

  const overLimit = Number(customer.available_credit) < 0;

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Customer directory"
        title={customer.name}
        description={`${customer.customer_type_display} customer${customer.city ? ` · ${customer.city}` : ""}`}
        action={
          userRole.role === "admin" ? (
            <div className="page-actions">
              <Link className="button button--ghost" to={`/customers/${customer.id}/edit`}>Edit</Link>
              <button className="button button--danger" onClick={handleDelete}>Delete</button>
            </div>
          ) : undefined
        }
      />

      {/* Credit summary */}
      <section className="customer-stats">
        <div className="surface customer-stat">
          <span className="customer-stat__label">Outstanding balance</span>
          <strong className="customer-stat__value" style={{ color: Number(customer.outstanding_balance) > 0 ? "var(--tomato-500)" : "var(--leaf-650)" }}>
            {formatNaira(customer.outstanding_balance)}
          </strong>
        </div>
        <div className="surface customer-stat">
          <span className="customer-stat__label">Credit limit</span>
          <strong className="customer-stat__value">{formatNaira(customer.credit_limit)}</strong>
        </div>
        <div className="surface customer-stat">
          <span className="customer-stat__label">Available credit</span>
          <strong className="customer-stat__value" style={{ color: overLimit ? "var(--tomato-500)" : "var(--leaf-650)" }}>
            {formatNaira(customer.available_credit)}
          </strong>
        </div>
      </section>

      <div className="customer-detail-grid">
        {/* Profile */}
        <section className="surface form-card">
          <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Profile</h3>
          <dl className="customer-dl">
            <div><dt>Type</dt><dd>{customer.customer_type_display}</dd></div>
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

        {/* Purchase history — filled in by the Sales & Invoicing module */}
        <section className="surface form-card">
          <h3 style={{ marginTop: 0, color: "var(--leaf-950)" }}>Purchase history</h3>
          <div className="empty-state" style={{ padding: "40px 12px" }}>
            <strong>Coming with Sales &amp; Invoicing</strong>
            <p>Once invoices exist, this customer's orders, payments and statement will appear here.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerDetail;
