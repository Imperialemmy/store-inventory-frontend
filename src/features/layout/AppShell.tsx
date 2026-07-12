import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { sidebarNavigation, activeGroupKey, activeSubTo } from "../../config/navigation";
import SyncStatus from "../../offline/SyncStatus";

const AppShell = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeKey = activeGroupKey(location.pathname);
  const activeGroup = sidebarNavigation.find((g) => g.key === activeKey);
  const subItems = activeGroup?.sub;
  const activeSub = subItems ? activeSubTo(location.pathname, subItems) : undefined;

  return (
    <div className="app-shell">
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <div className="app-main">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <SyncStatus />

        {subItems && subItems.length > 1 && (
          <nav className="subnav" aria-label={`${activeGroup?.label} sections`}>
            {subItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`subnav__tab${item.to === activeSub ? " subnav__tab--active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="app-content">
          <div className="page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>

        <footer className="app-footer">
          <p>AkinFolu Foods © {new Date().getFullYear()}</p>
          <p>Fresh. Quality. Delivered.</p>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
