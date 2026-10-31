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
