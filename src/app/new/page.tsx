"use client";

import { useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(todayIsoDate());
  const [calc, dispatch] = useReducer(calculatorReducer, initialCalculatorState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const categories = categoriesForType(type);
  const amount = calculatorValue(calc);

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

    try {
      if (!navigator.onLine) {
        await queueTransaction(tx);
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx),
        });
        if (!res.ok) {
          await queueTransaction(tx);
        }
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col max-w-md w-full mx-auto bg-white min-h-dvh">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="返回"
          className="text-xl text-gray-500"
        >
          ←
        </button>
        <div className="flex-1 flex bg-gray-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => switchType("expense")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              type === "expense" ? "bg-indigo-600 text-white" : "text-gray-500"
            }`}
          >
            支出
          </button>
          <button
            type="button"
            onClick={() => switchType("income")}
            className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
              type === "income" ? "bg-indigo-600 text-white" : "text-gray-500"
            }`}
          >
            收入
          </button>
        </div>
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
            <span className="text-xs text-gray-600">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
          <span className="text-2xl">
            {categoryId ? categories.find((c) => c.id === categoryId)?.emoji : "🙂"}
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="備註"
            className="flex-1 text-sm outline-none"
          />
          <span className="text-lg font-semibold tabular-nums">
            $ {calc.display}
          </span>
        </div>

        {error && (
          <p className="px-4 pb-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-between px-4 py-2 bg-indigo-50 text-indigo-900">
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

        <div className="grid grid-cols-5 gap-px bg-indigo-100 p-px">
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
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-gray-800"
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
            {submitting ? "…" : "OK"}
          </button>
        </div>
      </div>
    </main>
  );
}
