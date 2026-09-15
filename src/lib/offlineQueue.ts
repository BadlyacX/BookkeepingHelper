"use client";

import type { NewTransaction } from "./types";

/**
 * IndexedDB-backed queue for transactions created while offline.
 * See 記帳小幫手 技術架構規劃.md — 「前端本機儲存(離線用)」。
 *
 * Flow: save() while offline → flush() once back online → rows are
 * POSTed to the API and removed from the local queue on success.
 */

const DB_NAME = "bookkeeping-helper";
const DB_VERSION = 1;
const STORE_NAME = "pending-transactions";

export type QueuedTransaction = NewTransaction & {
  localId: string;
  queuedAt: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Queue a transaction locally (e.g. because navigator.onLine is false). */
export async function queueTransaction(
  tx: NewTransaction
): Promise<QueuedTransaction> {
  const db = await openDb();
  const queued: QueuedTransaction = {
    ...tx,
    localId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const store = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME);
    const request = store.add(queued);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  return queued;
}

export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as QueuedTransaction[]);
    request.onerror = () => reject(request.error);
  });
}

async function removeQueuedTransaction(localId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const store = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME);
    const request = store.delete(localId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Attempt to POST every queued transaction to the API. Successfully
 * synced rows are removed from the local queue; failures stay queued
 * for the next retry (e.g. next "online" event).
 */
export async function flushQueuedTransactions(): Promise<{
  synced: number;
  remaining: number;
}> {
  const pending = await getQueuedTransactions();
  let synced = 0;

  for (const tx of pending) {
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tx.type,
          occurred_on: tx.occurred_on,
          amount: tx.amount,
          category: tx.category,
          note: tx.note,
        }),
      });
      if (!res.ok) continue;
      await removeQueuedTransaction(tx.localId);
      synced += 1;
    } catch {
      // Still offline or request failed — leave it queued.
    }
  }

  return { synced, remaining: pending.length - synced };
}
