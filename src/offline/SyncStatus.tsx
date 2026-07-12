import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { getSyncSnapshot, retrySale, SYNC_EVENT } from "./sync";
import { offlineDb } from "./db";
import type { QueuedSale, SyncSnapshot } from "./types";

const empty: SyncSnapshot = {
  online: navigator.onLine,
  pending: 0,
  syncing: 0,
  needsAttention: 0,
};

const SyncStatus = () => {
  const [snapshot, setSnapshot] = useState(empty);
  const [details, setDetails] = useState(false);
  const [attention, setAttention] = useState<QueuedSale[]>([]);

  const refresh = async () => {
    setSnapshot(await getSyncSnapshot());
    setAttention((await offlineDb.sales.all()).filter((sale) => sale.state === "needs_attention"));
  };

  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    window.addEventListener(SYNC_EVENT, update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener(SYNC_EVENT, update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const queued = snapshot.pending + snapshot.syncing;
  let Icon = CheckCircle2;
  let className = "sync-strip sync-strip--ok";
  let message = snapshot.lastSyncedAt
    ? `All sales synced · ${new Date(snapshot.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Ready to record sales";

  if (snapshot.needsAttention) {
    Icon = AlertCircle;
    className = "sync-strip sync-strip--attention";
    message = `${snapshot.needsAttention} sale${snapshot.needsAttention === 1 ? "" : "s"} need attention`;
  } else if (snapshot.syncing) {
    Icon = RefreshCw;
    className = "sync-strip sync-strip--syncing";
    message = `Syncing ${snapshot.syncing} of ${queued}`;
  } else if (!snapshot.online || snapshot.pending) {
    Icon = CloudOff;
    className = "sync-strip sync-strip--offline";
    message = `Offline · ${snapshot.pending} sale${snapshot.pending === 1 ? "" : "s"} safely saved`;
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setDetails((value) => !value)} aria-expanded={details}>
        <Icon size={16} className={snapshot.syncing ? "sync-strip__spin" : ""} />
        <span>{message}</span>
        {(queued > 0 || snapshot.needsAttention > 0) && <small>View details</small>}
      </button>
      {details && attention.length > 0 && (
        <section className="sync-details" aria-label="Sales needing sync attention">
          {attention.map((sale) => (
            <div key={sale.client_sale_id}>
              <span><strong>{sale.local_reference}</strong><small>{sale.last_error}</small></span>
              <button type="button" onClick={() => void retrySale(sale.client_sale_id)}>Retry</button>
            </div>
          ))}
        </section>
      )}
    </>
  );
};

export default SyncStatus;
