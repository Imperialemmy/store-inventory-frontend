import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Leaf, ShoppingCart, Boxes, Users, ShieldCheck } from "lucide-react";
import { sidebarNavigation, activeGroupKey, type NavGroup } from "../../config/navigation";
import { clearSession } from "../../utils/auth";
import { useUserRole } from "../../hooks/useUserRole";
import ConfirmDialog from "../../components/ConfirmDialog";
import api from "../../services/api";
import { offlineDb } from "../../offline/db";
import { getSyncSnapshot } from "../../offline/sync";

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
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBlocked, setLogoutBlocked] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const activeKey = activeGroupKey(location.pathname);
  const items = sidebarNavigation.filter((group) => !group.adminOnly || isAdmin);

  const handleLogout = async () => {
    const [snapshot, cart, held] = await Promise.all([
      getSyncSnapshot(),
      offlineDb.cart.get(),
      offlineDb.held.all(),
    ]);
    setLogoutBlocked(snapshot.pending + snapshot.syncing + snapshot.needsAttention);
    setDraftCount((cart?.lines.length ? 1 : 0) + held.length);
    setLogoutError(null);
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    if (logoutBlocked > 0) {
      setLogoutOpen(false);
      return;
    }
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await api.post("/auth/logout/");
      const held = await offlineDb.held.all();
      await Promise.all([
        offlineDb.cart.clear(),
        ...held.map((sale) => offlineDb.held.remove(sale.id)),
      ]);
      clearSession();
      navigate("/login?reason=logged-out", { replace: true });
    } catch {
      setLogoutError("Could not securely log out. Check the connection and try again.");
    } finally {
      setLoggingOut(false);
    }
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
        <button className="sidebar__item" onClick={() => void handleLogout()} type="button">
          <LogOut size={19} /> Log out
        </button>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title={logoutBlocked > 0 ? "Sync sales before logging out" : "Log out of AkinFolu Foods?"}
        message={logoutBlocked > 0 ? (
          <p><strong>{logoutBlocked} sale{logoutBlocked === 1 ? " is" : "s are"} not safely on the server yet.</strong> Stay signed in until they sync or resolve them from Invoices.</p>
        ) : (
          <>
            <p>Your server session will be closed on this device.</p>
            {draftCount > 0 && <p><strong>{draftCount} local draft{draftCount === 1 ? "" : "s"}</strong> (active or held carts) will be cleared.</p>}
            {logoutError && <p className="notice notice--error" role="alert">{logoutError}</p>}
          </>
        )}
        confirmLabel={logoutBlocked > 0 ? "Stay signed in" : "Yes, log out"}
        cancelLabel={logoutBlocked > 0 ? "View invoices" : "Cancel"}
        busy={loggingOut}
        onConfirm={() => void confirmLogout()}
        onCancel={() => {
          setLogoutOpen(false);
          if (logoutBlocked > 0) navigate("/sales/invoices");
        }}
      />
    </aside>
  );
};

export default Sidebar;
