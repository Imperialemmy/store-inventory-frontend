import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSyncEngine } from './offline/sync'

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then((registration) => {
      const urls = performance.getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((url) => url.startsWith(window.location.origin));
      registration.active?.postMessage({ type: "CACHE_URLS", urls });
    });
  });
}

void startSyncEngine();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
