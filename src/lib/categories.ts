export type TransactionType = "expense" | "income";

export type Category = {
  id: string;
  label: string;
  emoji: string;
  /** Tailwind classes for the round icon chip. */
  chipClassName: string;
  /** Hex color used for the donut chart segment (needs a real color
   * value for inline conic-gradient, not just a Tailwind class). */
  chartColor: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "breakfast", label: "早餐", emoji: "🍞", chipClassName: "bg-amber-100 text-amber-700", chartColor: "#f59e0b" },
  { id: "lunch", label: "午餐", emoji: "🍜", chipClassName: "bg-orange-100 text-orange-700", chartColor: "#fb923c" },
  { id: "dinner", label: "晚餐", emoji: "🍽️", chipClassName: "bg-rose-100 text-rose-700", chartColor: "#fb7185" },
  { id: "drinks", label: "飲品", emoji: "🧋", chipClassName: "bg-sky-100 text-sky-700", chartColor: "#38bdf8" },
  { id: "snacks", label: "點心", emoji: "🧁", chipClassName: "bg-pink-100 text-pink-700", chartColor: "#f472b6" },
  { id: "alcohol", label: "酒類", emoji: "🍷", chipClassName: "bg-purple-100 text-purple-700", chartColor: "#a78bfa" },
  { id: "transport", label: "交通", emoji: "🚌", chipClassName: "bg-blue-100 text-blue-700", chartColor: "#60a5fa" },
  { id: "shopping", label: "購物", emoji: "🛍️", chipClassName: "bg-fuchsia-100 text-fuchsia-700", chartColor: "#e879f9" },
  { id: "fun", label: "娛樂", emoji: "🎮", chipClassName: "bg-violet-100 text-violet-700", chartColor: "#8b5cf6" },
  { id: "daily", label: "日用品", emoji: "🧴", chipClassName: "bg-teal-100 text-teal-700", chartColor: "#2dd4bf" },
  { id: "rent", label: "房租", emoji: "🏠", chipClassName: "bg-stone-100 text-stone-700", chartColor: "#a8a29e" },
  { id: "medical", label: "醫療", emoji: "⚕️", chipClassName: "bg-red-100 text-red-700", chartColor: "#f87171" },
  { id: "social", label: "人際", emoji: "👥", chipClassName: "bg-cyan-100 text-cyan-700", chartColor: "#22d3ee" },
  { id: "gift", label: "禮物", emoji: "🎁", chipClassName: "bg-yellow-100 text-yellow-700", chartColor: "#fbbf24" },
  { id: "electronics", label: "3C", emoji: "📱", chipClassName: "bg-indigo-100 text-indigo-700", chartColor: "#818cf8" },
  { id: "other-expense", label: "其他", emoji: "🔖", chipClassName: "bg-gray-100 text-gray-600", chartColor: "#9ca3af" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "salary", label: "薪資", emoji: "💰", chipClassName: "bg-emerald-100 text-emerald-700", chartColor: "#34d399" },
  { id: "bonus", label: "獎金", emoji: "🎉", chipClassName: "bg-lime-100 text-lime-700", chartColor: "#a3e635" },
  { id: "investment", label: "投資", emoji: "📈", chipClassName: "bg-green-100 text-green-700", chartColor: "#4ade80" },
  { id: "side-job", label: "副業", emoji: "💼", chipClassName: "bg-teal-100 text-teal-700", chartColor: "#2dd4bf" },
  { id: "refund", label: "退款", emoji: "🔁", chipClassName: "bg-sky-100 text-sky-700", chartColor: "#38bdf8" },
  { id: "other-income", label: "其他", emoji: "🔖", chipClassName: "bg-gray-100 text-gray-600", chartColor: "#9ca3af" },
];

export function categoriesForType(type: TransactionType): Category[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function findCategory(type: TransactionType, id: string): Category | undefined {
  return categoriesForType(type).find((c) => c.id === id);
}
