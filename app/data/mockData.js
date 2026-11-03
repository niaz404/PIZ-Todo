import { ECONOMY } from "../lib/economy";
import { getDateKey } from "../lib/utils";

export const DEFAULT_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tasks", label: "Todo", icon: "tasks" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/store", label: "Store", icon: "store" },
  { href: "/guide", label: "Guide", icon: "guide" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export const mockNavItems = DEFAULT_NAV_ITEMS;

export function createInitialDays() {
  const todayKey = getDateKey();
  return [
    {
      id: todayKey,
      date: todayKey,
      settled: false,
      settledAt: null,
      tasks: [],
    },
  ];
}

export const DEFAULT_PREFERENCES = [
  {
    id: "digest",
    title: "Weekly digest",
    description: "A short summary of your week, every Monday.",
    enabled: true,
  },
  {
    id: "reminders",
    title: "Task reminders",
    description: "A gentle nudge before a task is due.",
    enabled: true,
  },
  {
    id: "publicProfile",
    title: "Public profile",
    description: "Let teammates see your streak and level.",
    enabled: false,
  },
];

export const mockPreferences = DEFAULT_PREFERENCES;
