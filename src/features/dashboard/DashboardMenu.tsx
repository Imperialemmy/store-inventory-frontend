import { ArrowUpRight, Boxes, Ruler, Shapes, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { useUserRole } from "../../hooks/useUserRole";
import { dropdownData } from "./dashboardMenuData";
import LogoScroller from "./LogoScroller";

const icons = {
  wares: Boxes,
  brands: Tags,
  categories: Shapes,
  sizes: Ruler,
};

const DashboardMenu = () => {
  const { role } = useUserRole();

  return (
    <div className="page-container dashboard">
      <PageHeader
        eyebrow="Store control desk"
        title="Keep every shelf accounted for."
        description="Move from products to stock details without losing the thread of your day."
        action={<span className="role-badge">{role === "admin" ? "Administrator" : "Store viewer"}</span>}
      />

      <section className="dashboard-grid" aria-label="Inventory areas">
        {dropdownData.map(({ name, label, logos, description, links }, index) => {
          const Icon = icons[name as keyof typeof icons] ?? Boxes;
          const visibleLinks = links.filter((link) => !link.roles || link.roles.includes(role));

          return (
            <article className={`dashboard-card dashboard-card--${index + 1}`} key={name}>
              <div className="dashboard-card__topline">
                <span className="dashboard-card__icon"><Icon size={22} /></span>
                <span className="dashboard-card__index">0{index + 1}</span>
              </div>
              <LogoScroller logos={logos} label={label} />
              <div className="dashboard-card__copy">
                <h2>{label}</h2>
                <p>{description}</p>
              </div>
              <div className="dashboard-card__actions">
                {visibleLinks.map((link, linkIndex) => (
                  <Link
                    className={linkIndex === 0 ? "card-link card-link--primary" : "card-link"}
                    key={link.to}
                    to={link.to}
                  >
                    {link.label}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="dashboard-note">
        <span className="dashboard-note__dot" aria-hidden="true" />
        <div>
          <strong>One source of truth</strong>
          <p>Update a size, brand, or category once and reuse it everywhere in the inventory.</p>
        </div>
      </aside>
    </div>
  );
};

export default DashboardMenu;
