import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Leaf, ShoppingCart, Boxes, Users, ShieldCheck } from "lucide-react";
import { sidebarNavigation, activeGroupKey, type NavGroup } from "../../config/navigation";
import { clearSession } from "../../utils/auth";
import { useUserRole } from "../../hooks/useUserRole";

const icons = {
  sales: ShoppingCart,
  inventory: Boxes,
  customers: Users,
  team: ShieldCheck,
};

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

const Sidebar = ({ open, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const activeKey = activeGroupKey(location.pathname);
  const items = sidebarNavigation.filter((group) => !group.adminOnly || isAdmin);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const renderItem = (group: NavGroup) => {
    const Icon = icons[group.icon];
    return (
      <NavLink
        key={group.key}
        to={group.to}
        onClick={onNavigate}
        className={`sidebar__item${group.key === activeKey ? " sidebar__item--active" : ""}`}
      >
        <Icon size={19} />
        {group.label}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
      <NavLink to="/sales" className="sidebar__brand" onClick={onNavigate}>
        <span className="sidebar__brand-icon"><Leaf size={19} /></span>
        <span className="sidebar__brand-text">AkinFolu&nbsp;Foods</span>
      </NavLink>

      <nav className="sidebar__nav" aria-label="Main navigation">
        {items.map(renderItem)}
      </nav>

      <div className="sidebar__spacer" />
      <div className="sidebar__foot">
        <button className="sidebar__item" onClick={handleLogout} type="button">
          <LogOut size={19} /> Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
