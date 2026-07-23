import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, AlertTriangle, Clock, PackageX } from "lucide-react";
import api from "../../services/api";
import { useUserRole } from "../../hooks/useUserRole";
import ThemeToggle from "../../components/ThemeToggle";

interface TopBarProps {
  onMenu: () => void;
}

interface NotificationItem {
  type: "low_stock" | "overdue_invoice" | "expiring_batch";
  message: string;
  link: string;
}

const typeIcon = {
  low_stock: PackageX,
  overdue_invoice: Clock,
  expiring_batch: AlertTriangle,
};

const TopBar = ({ onMenu }: TopBarProps) => {
  const { role, username } = useUserRole();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials = (username || "U").slice(0, 2).toUpperCase();

  useEffect(() => {
    api.get("/notifications/")
      .then((res) => setAlerts(res.data.items ?? []))
      .catch(() => setAlerts([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Open menu" type="button">
        <Menu size={22} />
      </button>

      <div className="topbar__spacer" />

      <ThemeToggle />

      <div className="topbar__bell-wrap" ref={panelRef}>
        <button
          className={`topbar__bell${alerts.length > 0 ? " topbar__bell--alert" : ""}`}
          aria-label={`Notifications (${alerts.length})`}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <Bell size={20} />
        </button>

        {open && (
          <div className="notif-panel glass-panel">
            <div className="notif-panel__head">
              <strong>Notifications</strong>
              <span className="customer-chip">{alerts.length}</span>
            </div>
            {alerts.length === 0 ? (
              <p className="notif-panel__empty">All clear — nothing needs attention.</p>
            ) : (
              <ul className="notif-panel__list">
                {alerts.slice(0, 12).map((alert, index) => {
                  const Icon = typeIcon[alert.type] ?? AlertTriangle;
                  return (
                    <li key={index}>
                      <Link to={alert.link} className="notif-panel__item" onClick={() => setOpen(false)}>
                        <Icon size={16} />
                        <span>{alert.message}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="topbar__profile">
        <span className="topbar__avatar">{initials}</span>
        <span className="topbar__who">
          <strong>{username || "User"}</strong>
          <span>{role}</span>
        </span>
      </div>
    </header>
  );
};

export default TopBar;
