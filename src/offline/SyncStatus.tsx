import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

// Always Nigerian time, whatever the device's own timezone is set to.
const lagosTime = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: true,
});
const lagosDate = new Intl.DateTimeFormat("en-NG", {
  timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", year: "numeric",
});

const SyncStatus = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  return (
    <div className="sync-strip sync-strip--time" aria-label="Current Nigerian time and date">
      <Clock3 size={15} aria-hidden="true" />
      <span>{lagosTime.format(now)} · {lagosDate.format(now)}</span>
    </div>
  );
};

export default SyncStatus;
