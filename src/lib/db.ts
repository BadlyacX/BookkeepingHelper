"use client";

/**
 * Shared IndexedDB connection for this app. All stores are defined
 * here in one onupgradeneeded so a version bump only has to happen
 * in one place — see 記帳小幫手 技術架構規劃.md —「前端本機儲存(離線用)」。
 */

export const DB_NAME = "bookkeeping-helper";
export const DB_VERSION = 2;

/** Queued transactions created while offline, waiting to be POSTed. */
export const PENDING_STORE = "pending-transactions";
/** Last-synced-from-Supabase transactions, per month, for offline reads. */
export const MONTH_CACHE_STORE = "monthly-cache";

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: "localId" });
      }
      if (!db.objectStoreNames.contains(MONTH_CACHE_STORE)) {
        db.createObjectStore(MONTH_CACHE_STORE, { keyPath: "month" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
