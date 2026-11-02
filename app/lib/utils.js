export function formatCoins(value) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, value));
}

const STABLE_SSR_DATE = new Date(2026, 9, 31);

export function getSafeToday() {
  if (typeof window === "undefined") {
    return STABLE_SSR_DATE;
  }
  return new Date();
}

export function getDateKey(date) {
  const target = date || getSafeToday();
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getEffectiveDateKey(date, cutoffHour = 0) {
  const target = date ? new Date(date) : getSafeToday();
  const adjusted = new Date(target.getTime() - (Number(cutoffHour) || 0) * 60 * 60 * 1000);
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, "0");
  const day = String(adjusted.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const DUE_TIME_OPTIONS = [
  { label: "12:00 AM", sub: "Midnight", value: "12:00 AM", hour: 0, tag: "Default" },
  { label: "3:00 AM", sub: "Night Owl", value: "3:00 AM", hour: 3, tag: "Popular" },
  { label: "6:00 AM", sub: "Early Riser", value: "6:00 AM", hour: 6 },
  { label: "9:00 AM", sub: "Morning", value: "9:00 AM", hour: 9 },
  { label: "12:00 PM", sub: "Noon", value: "12:00 PM", hour: 12 },
  { label: "3:00 PM", sub: "Afternoon", value: "3:00 PM", hour: 15 },
  { label: "6:00 PM", sub: "Evening", value: "6:00 PM", hour: 18 },
  { label: "9:00 PM", sub: "Night", value: "9:00 PM", hour: 21 },
];

export function canChangeDueTime(dueTimeChangedAt) {
  if (!dueTimeChangedAt) return true;
  const changed = new Date(dueTimeChangedAt);
  if (isNaN(changed.getTime())) return true;
  const now = new Date();
  if (
    changed.getFullYear() < now.getFullYear() ||
    changed.getMonth() < now.getMonth()
  ) {
    return true;
  }
  return false;
}

export function getNextDueTimeUnlockDate(dueTimeChangedAt) {
  if (!dueTimeChangedAt) return null;
  const changed = new Date(dueTimeChangedAt);
  if (isNaN(changed.getTime())) return null;
  const nextMonth = new Date(changed.getFullYear(), changed.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function dateFromKey(key) {
  if (!key || typeof key !== "string") return getSafeToday();
  const parts = key.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return getSafeToday();
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatFullDate(key) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateFromKey(key));
}

export function formatShortDate(key) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(dateFromKey(key));
}

export function formatSectionDate(key) {
  const date = dateFromKey(key);
  const calendar = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
  return `${calendar} ${weekday}`;
}
