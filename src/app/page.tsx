"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { queueTransaction, flushQueuedTransactions } from "@/lib/offlineQueue";
import type { Transaction } from "@/lib/types";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const [occurredOn, setOccurredOn] = useState(todayIsoDate());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((body) => setTransactions(body.data ?? []))
      .catch(() => {});
  }, [userEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    const tx = {
      occurred_on: occurredOn,
      amount: Number(amount),
      category,
      note: note || undefined,
    };

    if (!navigator.onLine) {
      await queueTransaction(tx);
      setStatus("目前離線,已暫存到本機,恢復網路後會自動同步。");
    } else {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        const { data } = await res.json();
        setTransactions((prev) => [data, ...prev]);
        setStatus("已新增。");
      } else {
        // 送出失敗(例如網路突然斷線)也先存到本機佇列,避免資料遺失。
        await queueTransaction(tx);
        setStatus("送出失敗,已暫存到本機,稍後會自動重試。");
      }
    }

    setAmount("");
    setCategory("");
    setNote("");
  }

  if (!userEmail) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">
          尚未登入。Supabase Auth 登入畫面待實作 — 見{" "}
          <code>src/lib/supabase/client.ts</code>。
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-lg w-full mx-auto p-6 flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">記帳工具</h1>
        <p className="text-sm text-gray-500">{userEmail}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          step="0.01"
          placeholder="金額"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="類別(例如:飲食)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="備註(選填)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-slate-900 text-white rounded px-3 py-2"
        >
          新增
        </button>
        {status && <p className="text-sm text-gray-500">{status}</p>}
      </form>

      <button
        type="button"
        onClick={() => flushQueuedTransactions()}
        className="text-sm text-gray-500 underline self-start"
      >
        手動同步離線紀錄
      </button>

      <ul className="flex flex-col gap-2">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex justify-between border-b pb-2 text-sm"
          >
            <span>
              {tx.occurred_on} · {tx.category}
              {tx.note ? `(${tx.note})` : ""}
            </span>
            <span>{tx.amount}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
