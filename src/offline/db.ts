import type {
  CachedCustomer,
  CachedProduct,
  CartDraft,
  HeldSale,
  QueuedSale,
} from "./types";

const DB_NAME = "akinfolu-offline";
const DB_VERSION = 2;

const STORES = {
  products: "products",
  customers: "customers",
  cart: "cart",
  held: "held",
  sales: "sales",
  meta: "meta",
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

const requestResult = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const openOfflineDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.products)) {
        db.createObjectStore(STORES.products, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.customers)) {
        db.createObjectStore(STORES.customers, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.cart)) {
        db.createObjectStore(STORES.cart, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.held)) {
        db.createObjectStore(STORES.held, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.sales)) {
        const sales = db.createObjectStore(STORES.sales, { keyPath: "client_sale_id" });
        sales.createIndex("state", "state", { unique: false });
        sales.createIndex("queued_at", "queued_at", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
};

export const resetOfflineDbForTests = async () => {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Offline database reset was blocked."));
  });
};

const getAll = async <T>(storeName: string) => {
  const db = await openOfflineDb();
  const tx = db.transaction(storeName, "readonly");
  return requestResult(tx.objectStore(storeName).getAll()) as Promise<T[]>;
};

const replaceAll = async <T>(storeName: string, values: T[]) => {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    values.forEach((value) => store.put(value));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const put = async <T>(storeName: string, value: T) => {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const get = async <T>(storeName: string, key: IDBValidKey) => {
  const db = await openOfflineDb();
  const tx = db.transaction(storeName, "readonly");
  return requestResult(tx.objectStore(storeName).get(key)) as Promise<T | undefined>;
};

const remove = async (storeName: string, key: IDBValidKey) => {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

export const offlineDb = {
  products: {
    all: () => getAll<CachedProduct>(STORES.products),
    replace: (values: CachedProduct[]) => replaceAll(STORES.products, values),
  },
  customers: {
    all: () => getAll<CachedCustomer>(STORES.customers),
    replace: (values: CachedCustomer[]) => replaceAll(STORES.customers, values),
    put: (value: CachedCustomer) => put(STORES.customers, value),
  },
  cart: {
    get: () => get<CartDraft>(STORES.cart, "active"),
    put: (value: CartDraft) => put(STORES.cart, value),
    clear: () => remove(STORES.cart, "active"),
  },
  held: {
    all: () => getAll<HeldSale>(STORES.held),
    put: (value: HeldSale) => put(STORES.held, value),
    remove: (id: string) => remove(STORES.held, id),
  },
  sales: {
    all: () => getAll<QueuedSale>(STORES.sales),
    put: (value: QueuedSale) => put(STORES.sales, value),
    get: (id: string) => get<QueuedSale>(STORES.sales, id),
  },
  meta: {
    get: <T>(key: string) => get<{ key: string; value: T }>(STORES.meta, key),
    put: <T>(key: string, value: T) => put(STORES.meta, { key, value }),
  },
};

export const getDeviceId = () => {
  const key = "akinfolu_device_id";
  let value = localStorage.getItem(key);
  if (!value) {
    value = createUuid();
    localStorage.setItem(key, value);
  }
  return value;
};

export const createUuid = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
};
