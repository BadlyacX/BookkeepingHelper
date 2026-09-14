"use client";

import { useEffect } from "react";
import { flushQueuedTransactions } from "@/lib/offlineQueue";

/** Registers the PWA service worker and flushes offline-queued
 * transactions whenever connectivity comes back. Mounted once from
 * the root layout. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }

    const handleOnline = () => {
      flushQueuedTransactions().catch((err) => {
        console.error("Failed to flush offline queue:", err);
      });
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) handleOnline();

    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
