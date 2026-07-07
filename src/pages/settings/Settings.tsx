import { Link } from "react-router-dom";
import { Tags, Ruler, Boxes, Wallet } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";

const configLinks = [
  { to: "/brands", label: "Brands", icon: Tags, desc: "Manufacturer names used across products." },
  { to: "/categories", label: "Categories", icon: Boxes, desc: "How products are grouped." },
  { to: "/sizes", label: "Sizes", icon: Ruler, desc: "Reusable pack sizes and units." },
  { to: "/expenses/categories", label: "Expense categories", icon: Wallet, desc: "Spend groups and monthly budgets." },
];

const Settings = () => {
  const { username, role, canManage } = useUserRole();

  return (
    <div className="page-container">
      <PageHeader eyebrow="Settings" title="Settings" description="Your account and store configuration." />

      <section className="surface form-card" style={{ marginBottom: "18px" }}>
        <h3 style={{ marginTop: 0, color: "var(--ink-900)" }}>Account</h3>
        <dl className="customer-dl">
          <div><dt>Username</dt><dd>{username || "—"}</dd></div>
          <div><dt>Role</dt><dd style={{ textTransform: "capitalize" }}>{role}</dd></div>
        </dl>
      </section>

      <h3 style={{ margin: "0 0 12px", color: "var(--ink-900)" }}>Configuration</h3>
      <div className="stat-cards">
        {configLinks.map(({ to, label, icon: Icon, desc }) => (
          <Link key={to} to={to} className="surface stat-card" style={{ textDecoration: "none" }}>
            <div>
              <div className="stat-card__value" style={{ fontSize: "1.05rem" }}>{label}</div>
              <div className="stat-card__label">{desc}</div>
            </div>
            <span className="stat-card__icon stat-card__icon--green"><Icon size={20} /></span>
          </Link>
        ))}
      </div>

      {!canManage && (
        <p style={{ marginTop: "18px", color: "var(--ink-600)" }}>
          Some configuration is only available to administrators and managers.
        </p>
      )}
    </div>
  );
};

export default Settings;
