"use client";

import { Suspense, useEffect, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  calculatorReducer,
  calculatorValue,
  initialCalculatorState,
  type Operator,
} from "@/lib/calculator";
import { categoriesForType } from "@/lib/categories";
import { formatDateWithWeekday, isToday, shiftDate, todayIsoDate } from "@/lib/date";
import { queueTransaction } from "@/lib/offlineQueue";
import type { TransactionType } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

const KEYPAD_ROWS: Array<Array<{ label: string; kind: "digit" | "op" | "decimal" | "clear" | "backspace" }>> = [
  [
    { label: "7", kind: "digit" },
    { label: "8", kind: "digit" },
    { label: "9", kind: "digit" },
    { label: "÷", kind: "op" },
    { label: "AC", kind: "clear" },
  ],
  [
    { label: "4", kind: "digit" },
    { label: "5", kind: "digit" },
    { label: "6", kind: "digit" },
    { label: "×", kind: "op" },
    { label: "⌫", kind: "backspace" },
  ],
  [
    { label: "1", kind: "digit" },
    { label: "2", kind: "digit" },
    { label: "3", kind: "digit" },
    { label: "-", kind: "op" },
  ],
  [
    { label: "00", kind: "digit" },
    { label: "0", kind: "digit" },
    { label: ".", kind: "decimal" },
    { label: "+", kind: "op" },
  ],
];

export default function NewTransactionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-sm text-gray-500 dark:text-slate-400">載入中…</p>
        </main>
      }
    >
      <NewTransactionForm />
    </Suspense>
  );
}

function NewTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayIsoDate());
  const [calc, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const categories = categoriesForType(type);
  const amount = calculatorValue(calc);

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/transactions/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error("找不到這筆紀錄");
        return res.json();
      })
      .then(({ data }: { data: Transaction }) => {
        setType(data.type);
        setCategoryId(data.category);
        setNote(data.note ?? "");
        setOccurredOn(data.occurred_on);
        dispatch({ type: "set", value: data.amount });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, [editId]);

  function switchType(nextType: TransactionType) {
    setType(nextType);
    setCategoryId(null);
  }

  async function handleSubmit() {
    if (!categoryId) {
      setError("請選擇類別");
      return;
    }
    if (!(amount > 0)) {
      setError("金額要大於 0");
      return;
    }
    setError(null);
    setSubmitting(true);

    const tx = {
      type,
      occurred_on: occurredOn,
      amount,
      category: categoryId,
      note: note || undefined,
    };

    const url = editId ? `/api/transactions/${editId}` : "/api/transactions";
    const method = editId ? "PATCH" : "POST";

    try {
      if (!editId && !navigator.onLine) {
        // Genuinely offline: queue locally, sync later. (Editing while
        // offline isn't supported yet — only new entries queue.)
        await queueTransaction(tx);
        router.push("/");
        router.refresh();
        return;
      }

      let res: Response;
      try {
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        });
      } catch {
        if (editId) {
          setError("網路連線失敗,請稍後再試一次");
          return;
        }
        // fetch() itself threw — network is actually unreachable even
        // though navigator.onLine said otherwise. Queue and move on.
        await queueTransaction(tx);
        router.push("/");
        router.refresh();
        return;
      }

      if (!res.ok) {
        // The server reached us and rejected the request (bad data,
        // RLS, missing column, expired session, ...) — this is a real
        // error, not an offline situation. Show it instead of quietly
        // queueing the transaction and pretending it saved.
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `送出失敗(HTTP ${res.status})`);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editId) return;
    if (!window.confirm("確定要刪除這筆紀錄嗎?")) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${editId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `刪除失敗(HTTP ${res.status})`);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("網路連線失敗,請稍後再試一次");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500 dark:text-slate-400">載入中…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col max-w-md w-full mx-auto bg-white dark:bg-slate-900 min-h-dvh">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="返回"
          className="text-xl text-gray-500 dark:text-slate-400"
        >
          ←
        </button>
        <div className="flex-1 flex bg-gray-100 dark:bg-slate-800 rounded-full p-1">
          <button
            type="button"
            onClick={() => switchType("expense")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              type === "expense" ? "bg-indigo-600 text-white" : "text-gray-500 dark:text-slate-400"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => switchType("income")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              type === "income" ? "bg-indigo-600 text-white" : "text-gray-500 dark:text-slate-400"
            }`}
          >
            收入
          </button>
        </div>
        {editId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="刪除"
            className="text-xl text-rose-500 disabled:opacity-60"
          >
            🗑️
          </button>
        )}
      </header>

      <div className="grid grid-cols-4 gap-y-4 px-4 py-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${cat.chipClassName} ${
                categoryId === cat.id ? "ring-2 ring-indigo-500 ring-offset-2" : ""
              }`}
            >
              {cat.emoji}
            </span>
            <span className="text-xs text-gray-600 dark:text-slate-400">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-700">
          <span className="text-2xl">
            {categoryId ? categories.find((c) => c.id === categoryId)?.emoji : "🙂"}
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備註"
            className="flex-1 text-sm outline-none bg-transparent dark:text-slate-100 placeholder:dark:text-slate-500"
          />
          <span className="text-lg font-semibold tabular-nums dark:text-slate-100">
            $ {calc.display}
          </span>
        </div>

        {error && (
          <p className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200">
          <button
            type="button"
            onClick={() => setOccurredOn((d) => shiftDate(d, -1))}
            aria-label="前一天"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex items-center gap-2 text-sm font-medium"
          >
            📅 {isToday(occurredOn) ? "今日 " : ""}
            {formatDateWithWeekday(occurredOn)}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={occurredOn}
            onChange={(e) => e.target.value && setOccurredOn(e.target.value)}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => setOccurredOn((d) => shiftDate(d, 1))}
            aria-label="後一天"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-5 gap-px bg-indigo-100 dark:bg-slate-700 p-px">
          {KEYPAD_ROWS.map((row, rowIndex) =>
            row.map((key) => (
              <button
                key={`${rowIndex}-${key.label}`}
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (key.kind === "digit") dispatch({ type: "digit", digit: key.label });
                  else if (key.kind === "decimal") dispatch({ type: "decimal" });
                  else if (key.kind === "clear") dispatch({ type: "clear" });
                  else if (key.kind === "backspace") dispatch({ type: "backspace" });
                  else dispatch({ type: "operator", operator: key.label as Operator });
                }}
                className={`h-14 flex items-center justify-center text-lg font-medium ${
                  key.kind === "op" || key.kind === "clear" || key.kind === "backspace"
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
                }`}
              >
                {key.label}
              </button>
            ))
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            style={{ gridColumn: "5", gridRow: "3 / span 2" }}
            className="h-full flex items-center justify-center text-lg font-semibold bg-indigo-600 text-white disabled:opacity-60"
          >
            {submitting ? "…" : editId ? "更新" : "OK"}
          </button>
        </div>
      </div>
    </main>
  );
}
