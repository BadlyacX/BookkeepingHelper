"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { flushQueuedTransactions } from "@/lib/offlineQueue";
import { findCategory } from "@/lib/categories";
import {
  currentMonth,
  formatMonthLabel,
  remainingDaysInMonth,
  shiftMonth,
} from "@/lib/date";
import type { Transaction } from "@/lib/types";
import { signOut } from "@/app/login/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

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

const EXPENSE_COLOR = "#008ae0";
const INCOME_COLOR = "#ca8a04";
const NEGATIVE_COLOR = "#dc2626";

/** Ring showing 支出 as a share of 收入 this month: blue slice for the
 * spent portion, yellow for the rest of income. Caps at a full blue
 * ring if expense >= income (spent it all, or more); grey when there's
 * no income or expense at all yet. */
function donutBackground(totalExpense: number, totalIncome: number): string {
  if (totalIncome <= 0) return totalExpense > 0 ? EXPENSE_COLOR : "#e5e7eb";
  const ratio = Math.min(totalExpense / totalIncome, 1);
  const angle = ratio * 360;
  return `conic-gradient(${EXPENSE_COLOR} 0deg ${angle}deg, ${INCOME_COLOR} ${angle}deg 360deg)`;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [showDailyBudget, setShowDailyBudget] = useState(false);

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
  const remainingDays = remainingDaysInMonth(month);
  const dailyBudget = balance / remainingDays;

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
        <p className="text-sm text-gray-500 dark:text-slate-400">載入中…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col max-w-md w-full mx-auto bg-white dark:bg-slate-900 h-dvh overflow-hidden relative">
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700 relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="選單"
          className="text-xl text-gray-500 dark:text-slate-400"
        >
          ☰
        </button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
            ◀
          </button>
          <span className="font-medium dark:text-slate-100">{formatMonthLabel(month)}</span>
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
            ▶
          </button>
        </div>
        <ThemeToggle />

        {menuOpen && (
          <div className="absolute top-full left-4 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-lg z-20 py-2 text-sm">
            <p className="px-3 py-1.5 text-gray-500 dark:text-slate-400 truncate">{userEmail}</p>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleSync();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-slate-200"
            >
              手動同步離線紀錄
            </button>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
              >
                登出
              </button>
            </form>
          </div>
        )}
      </header>

      <div className="shrink-0">
        {syncMessage && (
          <p className="px-4 pt-2 text-xs text-gray-500 dark:text-slate-400">{syncMessage}</p>
        )}

        <div className="flex justify-around px-4 py-4">
          <div className="text-center rounded-lg px-4 py-1">
            <p className="text-xs text-gray-500 dark:text-slate-400">支出</p>
            <p className="text-lg font-semibold" style={{ color: EXPENSE_COLOR }}>
              ${formatAmount(totalExpense)}
            </p>
          </div>
          <div className="text-center rounded-lg px-4 py-1">
            <p className="text-xs text-gray-500 dark:text-slate-400">收入</p>
            <p className="text-lg font-semibold" style={{ color: INCOME_COLOR }}>
              ${formatAmount(totalIncome)}
            </p>
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <div
            className="w-44 h-44 rounded-full flex items-center justify-center"
            style={{ background: donutBackground(totalExpense, totalIncome) }}
          >
            <button
              type="button"
              onClick={() => setShowDailyBudget(true)}
              className="w-28 h-28 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center"
            >
              <p className="text-xs text-gray-500 dark:text-slate-400">結餘</p>
              <p
                className="text-lg font-semibold"
                style={{ color: balance < 0 ? NEGATIVE_COLOR : INCOME_COLOR }}
              >
                ${formatAmount(balance)}
              </p>
            </button>
          </div>
        </div>
      </div>

      {showDailyBudget && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setShowDailyBudget(false)}
        >
          <div
            className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
              每日可用預算(結餘 ÷ 本月剩餘 {remainingDays} 天)
            </p>
            {balance < 0 ? (
              <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">
                沒有餘額
              </p>
            ) : (
              <p className="text-2xl font-semibold" style={{ color: INCOME_COLOR }}>
                ${formatAmount(Math.floor(dailyBudget))} / 天
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowDailyBudget(false)}
              className="mt-4 w-full rounded-lg bg-gray-100 dark:bg-slate-700 dark:text-slate-100 py-2 text-sm font-medium"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-24">
        {dayGroups.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">
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
              <div className="flex justify-between px-4 py-2 bg-gray-50 dark:bg-slate-800 text-xs text-gray-500 dark:text-slate-400">
                <span>{date}</span>
                <span className={dayNet < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                  {dayNet > 0 ? "+" : ""}
                  {formatAmount(dayNet)}
                </span>
              </div>
              {txs.map((tx) => {
                const category = findCategory(tx.type, tx.category);
                return (
                  <Link
                    key={tx.id}
                    href={`/new?id=${tx.id}`}
                    className="relative flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-150 hover:z-10 hover:bg-gray-50 dark:hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:bg-gray-100 dark:active:bg-slate-700"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${category?.chipClassName ?? "bg-gray-100 dark:bg-slate-700"}`}
                    >
                      {category?.emoji ?? "🔖"}
                    </span>
                    <span className="flex-1 text-sm truncate dark:text-slate-100">
                      {category?.label ?? tx.category}
                      {tx.note ? `‧${tx.note}` : ""}
                    </span>
                    <span
                      className={`text-sm font-medium tabular-nums ${tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-slate-100"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatAmount(tx.amount)}
                    </span>
                  </Link>
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
