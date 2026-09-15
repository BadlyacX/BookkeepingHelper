"use client";

import type { Transaction } from "./types";
import { openDb, MONTH_CACHE_STORE } from "./db";

/**
 * Caches the last successful GET /api/transactions?month=… response
 * per month, so the app has something to show when offline instead
 * of an empty list. This is read-only local state mirroring the
 * server — it's overwritten on every successful fetch and never
 * itself synced back up (writes go through offlineQueue.ts instead).
 */

type MonthCacheEntry = {
  month: string;
  transactions: Transaction[];
  syncedAt: string;
};

export async function cacheMonthTransactions(
  month: string,
  transactions: Transaction[]
): Promise<void> {
  const db = await openDb();
  const entry: MonthCacheEntry = { month, transactions, syncedAt: new Date().toISOString() };

  await new Promise<void>((resolve, reject) => {
    const store = db
      .transaction(MONTH_CACHE_STORE, "readwrite")
      .objectStore(MONTH_CACHE_STORE);
    const request = store.put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedMonthTransactions(
  month: string
): Promise<MonthCacheEntry | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction(MONTH_CACHE_STORE, "readonly").objectStore(MONTH_CACHE_STORE);
    const request = store.get(month);
    request.onsuccess = () => resolve((request.result as MonthCacheEntry) ?? null);
    request.onerror = () => reject(request.error);
  });
}
