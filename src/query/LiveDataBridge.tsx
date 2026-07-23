import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DATA_CHANGE_EVENT,
  invalidateResources,
  openDataChangeChannel,
  type DataChange,
} from "./dataChanges";

const websocketUrl = () => {
  const configured = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const root = configured || apiBase;
  if (!root) return null;
  const url = new URL(root, window.location.origin);
  if (url.protocol === "https:") url.protocol = "wss:";
  else if (url.protocol === "http:") url.protocol = "ws:";
  url.pathname = `${url.pathname.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")}/ws/activity/`;
  url.search = "";
  return url;
};

const LiveDataBridge = () => {
  const client = useQueryClient();

  useEffect(() => {
    const apply = (change?: DataChange) => {
      if (!change?.resources?.length) return;
      void invalidateResources(client, change.resources);
    };
    const onLocal = (event: Event) => apply((event as CustomEvent<DataChange>).detail);
    window.addEventListener(DATA_CHANGE_EVENT, onLocal);
    const closeChannel = openDataChangeChannel(apply);
    return () => {
      window.removeEventListener(DATA_CHANGE_EVENT, onLocal);
      closeChannel();
    };
  }, [client]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let fallbackTimer: number | undefined;
    let stopped = false;

    const stopFallback = () => {
      window.clearInterval(fallbackTimer);
      fallbackTimer = undefined;
    };
    const startFallback = () => {
      if (fallbackTimer) return;
      fallbackTimer = window.setInterval(() => {
        void invalidateResources(client, [
          "products", "customers", "sales", "operations", "notifications", "team",
        ]);
      }, 15_000);
    };

    const connect = () => {
      const base = websocketUrl();
      const token = localStorage.getItem("access_token");
      if (stopped || !base || !token) return;
      base.searchParams.set("token", token);
      socket = new WebSocket(base);
      socket.onopen = stopFallback;
      socket.onmessage = (event) => {
        try {
          const change = JSON.parse(event.data) as DataChange;
          if (change.resources?.length) void invalidateResources(client, change.resources);
        } catch {
          // Ignore malformed activity messages; normal query refresh remains available.
        }
      };
      socket.onclose = () => {
        if (!stopped) {
          startFallback();
          retryTimer = window.setTimeout(connect, 4_000);
        }
      };
    };

    connect();
    const reconnect = () => {
      if (socket) socket.onclose = null;
      socket?.close();
      window.clearTimeout(retryTimer);
      connect();
    };
    window.addEventListener("akinfolu-auth-change", reconnect);
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      stopFallback();
      socket?.close();
      window.removeEventListener("akinfolu-auth-change", reconnect);
    };
  }, [client]);

  return null;
};

export default LiveDataBridge;
