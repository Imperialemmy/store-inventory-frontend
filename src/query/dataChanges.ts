import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export type DataResource =
  | "products"
  | "customers"
  | "sales"
  | "operations"
  | "notifications"
  | "team";

export interface DataChange {
  resources: DataResource[];
  source?: string;
}

export const DATA_CHANGE_EVENT = "akinfolu-data-change";
const CHANNEL_NAME = "akinfolu-live-data";

export const invalidateResources = async (client: QueryClient, resources: DataResource[]) => {
  const unique = new Set(resources);
  const work: Promise<unknown>[] = [];
  if (unique.has("products")) work.push(client.invalidateQueries({ queryKey: queryKeys.products }));
  if (unique.has("customers")) work.push(client.invalidateQueries({ queryKey: queryKeys.customers }));
  if (unique.has("sales")) work.push(client.invalidateQueries({ queryKey: queryKeys.sales }));
  if (unique.has("operations")) work.push(client.invalidateQueries({ queryKey: queryKeys.operations }));
  if (unique.has("notifications")) work.push(client.invalidateQueries({ queryKey: queryKeys.notifications }));
  if (unique.has("team")) work.push(client.invalidateQueries({ queryKey: queryKeys.team }));
  await Promise.all(work);
};

export const announceDataChange = (resources: DataResource[], source = "local") => {
  const detail: DataChange = { resources: [...new Set(resources)], source };
  window.dispatchEvent(new CustomEvent<DataChange>(DATA_CHANGE_EVENT, { detail }));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(detail);
    channel.close();
  }
};

export const openDataChangeChannel = (onChange: (change: DataChange) => void) => {
  if (!("BroadcastChannel" in window)) return () => undefined;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<DataChange>) => onChange(event.data);
  return () => channel.close();
};
