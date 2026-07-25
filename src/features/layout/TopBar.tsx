import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Menu, Bell, AlertCircle, AlertTriangle, Clock, CloudOff, PackageX, RefreshCw } from "lucide-react";
import api from "../../services/api";
import { useUserRole } from "../../hooks/useUserRole";
import ThemeToggle from "../../components/ThemeToggle";
import { queryKeys } from "../../query/queryKeys";
import { getSyncSnapshot, SYNC_EVENT } from "../../offline/sync";
import type { SyncSnapshot } from "../../offline/types";

interface TopBarProps {
  onMenu: () => void;
}

interface NotificationItem {
  type: "low_stock" | "overdue_invoice" | "expiring_batch" | "unsynced_sale" | "sync_attention";
  message: string;
  link: string;
}

const typeIcon = {
  low_stock: PackageX,
  overdue_invoice: Clock,
  expiring_batch: AlertTriangle,
  unsynced_sale: CloudOff,
  sync_attention: AlertCircle,
};

const emptySync: SyncSnapshot = {
  online: navigator.onLine,
  pending: 0,
  syncing: 0,
  needsAttention: 0,
};

const TopBar = ({ onMenu }: TopBarProps) => {
  const { role, username } = useUserRole();
  const [open, setOpen] = useState(false);
  const [sync, setSync] = useState<SyncSnapshot>(emptySync);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: alerts = [] } = useQuery<NotificationItem[]>({
    queryKey: queryKeys.notifications,
    queryFn: async () => (await api.get("/notifications/")).data.items ?? [],
    refetchInterval: 30_000,
  });

  const initials = (username || "U").slice(0, 2).toUpperCase();
  const waitingToSync = sync.pending + sync.syncing;
  const localAlerts: NotificationItem[] = [];
  if (sync.needsAttention > 0) {
    localAlerts.push({
      type: "sync_attention",
      message: `${sync.needsAttention} sale${sync.needsAttention === 1 ? " needs" : "s need"} attention before syncing.`,
      link: "/sales/invoices",
    });
  }
  if (waitingToSync > 0) {
    localAlerts.push({
      type: "unsynced_sale",
      message: `${waitingToSync} sale${waitingToSync === 1 ? " is" : "s are"} waiting to sync to the server.`,
      link: "/sales/invoices",
    });
  }
  const allAlerts = [...localAlerts, ...alerts];
  const alertCount = alerts.length + waitingToSync + sync.needsAttention;

  useEffect(() => {
    const refreshSync = () => void getSyncSnapshot().then(setSync);
    refreshSync();
    window.addEventListener(SYNC_EVENT, refreshSync);
    window.addEventListener("online", refreshSync);
    window.addEventListener("offline", refreshSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, refreshSync);
      window.removeEventListener("online", refreshSync);
      window.removeEventListener("offline", refreshSync);
    };
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
          className={`topbar__bell${alertCount > 0 ? " topbar__bell--alert" : ""}`}
          aria-label={`Notifications (${alertCount})`}
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <Bell size={20} />
        </button>

        {open && (
          <div className="notif-panel glass-panel">
            <div className="notif-panel__head">
              <strong>Notifications</strong>
              <span className="customer-chip">{alertCount}</span>
            </div>
            {allAlerts.length === 0 ? (
              <p className="notif-panel__empty">All clear — nothing needs attention.</p>
            ) : (
              <ul className="notif-panel__list">
                {allAlerts.slice(0, 12).map((alert) => {
                  const Icon = alert.type === "unsynced_sale" && sync.syncing > 0
                    ? RefreshCw
                    : typeIcon[alert.type] ?? AlertTriangle;
                  return (
                    <li key={`${alert.type}-${alert.message}`}>
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
