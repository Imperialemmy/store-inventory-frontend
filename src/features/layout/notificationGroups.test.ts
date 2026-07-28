import { describe, expect, it } from "vitest";
import { buildNotificationGroups, type NotificationItem } from "./notificationGroups";

describe("notification groups", () => {
  it("reconciles every server alert into an actionable group", () => {
    const alerts: NotificationItem[] = [
      { type: "low_stock", message: "Rice is out of stock.", link: "/products?stock_status=out_of_stock" },
      { type: "low_stock", message: "Oil is low on stock.", link: "/products?stock_status=low_stock" },
      { type: "low_stock", message: "Pasta is low on stock.", link: "/products?stock_status=low_stock" },
      { type: "stock_conflict", message: "A sale needs attention.", link: "/sales/invoices" },
    ];

    const groups = buildNotificationGroups(alerts);

    expect(groups.map(({ key, count }) => ({ key, count }))).toEqual([
      { key: "out_of_stock", count: 1 },
      { key: "low_stock", count: 2 },
      { key: "stock_conflict", count: 1 },
    ]);
    expect(groups.reduce((total, group) => total + group.count, 0)).toBe(alerts.length);
  });

  it("keeps previews short even when a group is large", () => {
    const alerts: NotificationItem[] = Array.from({ length: 207 }, (_, index) => ({
      type: "low_stock",
      message: `Product ${index + 1} is low on stock.`,
      link: "/products?stock_status=low_stock",
    }));

    const [group] = buildNotificationGroups(alerts);

    expect(group.count).toBe(207);
    expect(group.previews).toHaveLength(2);
  });
});
