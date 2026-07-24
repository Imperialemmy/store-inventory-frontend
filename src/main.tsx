import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSyncEngine } from './offline/sync'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './query/queryClient'

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then((registration) => {
      const urls = performance.getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((value) => {
          const url = new URL(value, window.location.origin);
          const isServerData =
            url.pathname === "/api" ||
            url.pathname.startsWith("/api/") ||
            url.pathname === "/backend" ||
            url.pathname.startsWith("/backend/");
          return url.origin === window.location.origin && !isServerData;
        });
      registration.active?.postMessage({ type: "CACHE_URLS", urls });
    });
  });
}

void startSyncEngine();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
