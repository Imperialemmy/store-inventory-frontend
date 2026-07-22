import { useEffect, useState } from "react";
import { API_ACTIVITY_EVENT } from "../services/api";

/**
 * A thin progress bar pinned to the top of the viewport that appears whenever
 * the app is talking to the server, so any action (saving a product, recording
 * a sale, loading a list) has a visible loading indicator.
 */
const GlobalLoadingBar = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    const onActivity = (event: Event) => {
      const count = (event as CustomEvent<number>).detail;
      if (count > 0) {
        window.clearTimeout(hideTimer);
        setActive(true);
      } else {
        // Small delay so back-to-back requests don't flicker the bar.
        hideTimer = window.setTimeout(() => setActive(false), 250);
      }
    };
    window.addEventListener(API_ACTIVITY_EVENT, onActivity);
    return () => {
      window.removeEventListener(API_ACTIVITY_EVENT, onActivity);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!active) return null;
  return (
    <div className="global-loading" role="progressbar" aria-label="Loading">
      <div className="global-loading__bar" />
    </div>
  );
};

export default GlobalLoadingBar;
