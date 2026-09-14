const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** "2026-09-14" style ISO date string, in local time. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** "YYYY-MM" for the given ISO date, used as the month-picker key. */
export function isoDateToMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function currentMonth(): string {
  return todayIsoDate().slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return `${year}年${mon}月`;
}

/** "2026/09/14 星期日" */
export function formatDateWithWeekday(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")} 星期${WEEKDAYS[date.getDay()]}`;
}

export function shiftDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  return toIsoDate(date);
}

export function isToday(isoDate: string): boolean {
  return isoDate === todayIsoDate();
}
