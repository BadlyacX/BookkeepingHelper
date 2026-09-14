"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { flushQueuedTransactions } from "@/lib/offlineQueue";
import { findCategory, type TransactionType } from "@/lib/categories";
import {
  currentMonth,
  formatMonthLabel,
  shiftMonth,
} from "@/lib/date";
import type { Transaction } from "@/lib/types";
import { signOut } from "@/app/login/actions";

function groupByDate(transactions: Transaction[]): Array<[string, Transaction[]]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const list = groups.get(tx.occurred_on) ?? [];
    list.push(tx);
    groups.set(tx.occurred_on, list);
  }
  return Array.from(groups.entries());
}

function formatAmount(n: number): string {
  return n.toLocaleString("zh-Hant");
}

/** conic-gradient() background for a donut chart of category totals. */
function donutBackground(
  transactions: Transaction[],
  type: TransactionType
): string {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
  }
  const total = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  if (total === 0) return "#e5e7eb";

  let start = 0;
  const stops: string[] = [];
  for (const [categoryId, value] of totals) {
    const color = findCategory(type, categoryId)?.chartColor ?? "#9ca3af";
    const end = start + (value / total) * 360;
    stops.push(`${color} ${start}deg ${end}deg`);
    start = end;
  }
  return `conic-gradient(${stops.join(", ")})`;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [donutType, setDonutType] = useState<TransactionType>("expense");
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/transactions?month=${month}`)
      .then((res) => res.json())
      .then((body) => setTransactions(body.data ?? []))
      .catch(() => {});
  }, [userEmail, month]);

  const { totalExpense, totalIncome } = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    for (const tx of transactions) {
      if (tx.type === "expense") totalExpense += tx.amount;
      else totalIncome += tx.amount;
    }
    return { totalExpense, totalIncome };
  }, [transactions]);

  const balance = totalIncome - totalExpense;
  const dayGroups = useMemo(() => groupByDate(transactions), [transactions]);

  async function handleSync() {
    const { synced, remaining } = await flushQueuedTransactions();
    setSyncMessage(
      synced === 0 && remaining === 0
        ? "沒有待同步的離線紀錄"
        : `已同步 ${synced} 筆${remaining > 0 ? `,還有 ${remaining} 筆待同步` : ""}`
    );
    fetch(`/api/transactions?month=${month}`)
      .then((res) => res.json())
      .then((body) => setTransactions(body.data ?? []))
      .catch(() => {});
  }

  if (!userEmail) {
    // proxy.ts 已經在 server 端擋掉未登入的請求,這裡短暫顯示只是
    // 因為瀏覽器端的 getUser() 還沒回來。
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">載入中…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col max-w-md w-full mx-auto bg-white min-h-dvh relative">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="選單"
          className="text-xl text-gray-500"
        >
          ☰
        </button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            ◀
          </button>
          <span className="font-medium">{formatMonthLabel(month)}</span>
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            ▶
          </button>
        </div>
        <span className="w-6" />

        {menuOpen && (
          <div className="absolute top-full left-4 mt-1 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-20 py-2 text-sm">
            <p className="px-3 py-1.5 text-gray-500 truncate">{userEmail}</p>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleSync();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
            >
              手動同步離線紀錄
            </button>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-red-600"
              >
                登出
              </button>
            </form>
          </div>
        )}
      </header>

      {syncMessage && (
        <p className="px-4 pt-2 text-xs text-gray-500">{syncMessage}</p>
      )}

      <div className="flex justify-around px-4 py-4">
        <button
          type="button"
          onClick={() => setDonutType("expense")}
          className={`text-center rounded-lg px-4 py-1 ${donutType === "expense" ? "bg-indigo-50" : ""}`}
        >
          <p className="text-xs text-gray-500">支出</p>
          <p className="text-lg font-semibold text-indigo-600">
            ${formatAmount(totalExpense)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setDonutType("income")}
          className={`text-center rounded-lg px-4 py-1 ${donutType === "income" ? "bg-emerald-50" : ""}`}
        >
          <p className="text-xs text-gray-500">收入</p>
          <p className="text-lg font-semibold text-emerald-600">
            ${formatAmount(totalIncome)}
          </p>
        </button>
      </div>

      <div className="flex justify-center pb-6">
        <div
          className="w-44 h-44 rounded-full flex items-center justify-center"
          style={{ background: donutBackground(transactions, donutType) }}
        >
          <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500">結餘</p>
            <p
              className={`text-lg font-semibold ${balance < 0 ? "text-rose-600" : "text-gray-900"}`}
            >
              ${formatAmount(balance)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 pb-24">
        {dayGroups.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            這個月還沒有紀錄,點右下角「+」開始記帳。
          </p>
        )}
        {dayGroups.map(([date, txs]) => {
          const dayNet = txs.reduce(
            (sum, tx) => sum + (tx.type === "income" ? tx.amount : -tx.amount),
            0
          );
          return (
            <div key={date}>
              <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs text-gray-500">
                <span>{date}</span>
                <span className={dayNet < 0 ? "text-rose-600" : "text-emerald-600"}>
                  {dayNet > 0 ? "+" : ""}
                  {formatAmount(dayNet)}
                </span>
              </div>
              {txs.map((tx) => {
                const category = findCategory(tx.type, tx.category);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${category?.chipClassName ?? "bg-gray-100"}`}
                    >
                      {category?.emoji ?? "🔖"}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {category?.label ?? tx.category}
                      {tx.note ? `‧${tx.note}` : ""}
                    </span>
                    <span
                      className={`text-sm font-medium tabular-nums ${tx.type === "income" ? "text-emerald-600" : "text-gray-900"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatAmount(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <Link
        href="/new"
        aria-label="新增紀錄"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl flex items-center justify-center shadow-lg"
      >
        +
      </Link>
    </main>
  );
}
