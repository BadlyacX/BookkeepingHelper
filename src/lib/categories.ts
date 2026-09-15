export type TransactionType = "expense" | "income";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  /** Tailwind classes for the round icon chip (light + dark variants). */
  chipClassName: string;
  /** Hex color used for the donut chart segment (needs a real color
   * value for inline conic-gradient, not just a Tailwind class). */
  chartColor: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "breakfast", label: "早餐", emoji: "🍞", chipClassName: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", chartColor: "#f59e0b" },
  { id: "lunch", label: "午餐", emoji: "🍜", chipClassName: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", chartColor: "#fb923c" },
  { id: "dinner", label: "晚餐", emoji: "🍽️", chipClassName: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", chartColor: "#fb7185" },
  { id: "drinks", label: "飲品", emoji: "🧋", chipClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", chartColor: "#38bdf8" },
  { id: "snacks", label: "點心", emoji: "🧁", chipClassName: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300", chartColor: "#f472b6" },
  { id: "alcohol", label: "酒類", emoji: "🍷", chipClassName: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", chartColor: "#a78bfa" },
  { id: "transport", label: "交通", emoji: "🚌", chipClassName: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", chartColor: "#60a5fa" },
  { id: "shopping", label: "購物", emoji: "🛍️", chipClassName: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300", chartColor: "#e879f9" },
  { id: "fun", label: "娛樂", emoji: "🎮", chipClassName: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", chartColor: "#8b5cf6" },
  { id: "daily", label: "日用品", emoji: "🧴", chipClassName: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300", chartColor: "#2dd4bf" },
  { id: "rent", label: "房租", emoji: "🏠", chipClassName: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300", chartColor: "#a8a29e" },
  { id: "medical", label: "醫療", emoji: "⚕️", chipClassName: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", chartColor: "#f87171" },
  { id: "social", label: "人際", emoji: "👥", chipClassName: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", chartColor: "#22d3ee" },
  { id: "gift", label: "禮物", emoji: "🎁", chipClassName: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", chartColor: "#fbbf24" },
  { id: "electronics", label: "3C", emoji: "📱", chipClassName: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", chartColor: "#818cf8" },
  { id: "other-expense", label: "其他", emoji: "🔖", chipClassName: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300", chartColor: "#9ca3af" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "salary", label: "薪資", emoji: "💰", chipClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", chartColor: "#34d399" },
  { id: "bonus", label: "獎金", emoji: "🎉", chipClassName: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300", chartColor: "#a3e635" },
  { id: "investment", label: "投資", emoji: "📈", chipClassName: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", chartColor: "#4ade80" },
  { id: "side-job", label: "副業", emoji: "💼", chipClassName: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300", chartColor: "#2dd4bf" },
  { id: "refund", label: "退款", emoji: "🔁", chipClassName: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", chartColor: "#38bdf8" },
  { id: "other-income", label: "其他", emoji: "🔖", chipClassName: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300", chartColor: "#9ca3af" },
];

export function categoriesForType(type: TransactionType): Category[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function findCategory(type: TransactionType, id: string): Category | undefined {
  return categoriesForType(type).find((c) => c.id === id);
}
