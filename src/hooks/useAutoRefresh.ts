import { useEffect, useRef } from "react";

/**
 * Keeps a page's data fresh without a manual reload: calls `refresh` whenever
 * the tab regains focus / becomes visible again. Combined with fetch-on-mount
 * and refetch-after-actions, this means the user rarely (if ever) needs to
 * hard-refresh to see the latest.
 */
export const useAutoRefresh = (refresh: () => void) => {
  const saved = useRef(refresh);
  saved.current = refresh;

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "visible") saved.current();
    };
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);
};

export default useAutoRefresh;
