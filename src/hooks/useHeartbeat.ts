import { useEffect } from "react";
import api from "../services/api";

const HEARTBEAT_MS = 30_000;

/**
 * Quietly pings an authenticated endpoint every 30s (and whenever the tab
 * regains focus). If this account has since signed in on another device, the
 * server rejects the stale token and the axios interceptor signs this device
 * out automatically — no user action required. The request is flagged
 * `_background` so it never shows the global loading bar.
 */
export const useHeartbeat = () => {
  useEffect(() => {
    let stopped = false;

    const ping = () => {
      if (stopped || document.visibilityState === "hidden") return;
      if (!localStorage.getItem("access_token")) return;
      void api.get("/auth/users/me/", { _background: true } as never).catch(() => {
        /* A replaced session is handled by the response interceptor. */
      });
    };

    const timer = window.setInterval(ping, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    window.addEventListener("focus", ping);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", ping);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
};

export default useHeartbeat;
