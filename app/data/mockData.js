import { ECONOMY } from "../lib/economy";
import { getDateKey } from "../lib/utils";

export const mockUser = {
  name: "New Member",
  firstName: "Member",
  email: "user@piz-todo.app",
  handle: "@member",
  initials: "PIZ",
  role: "Free member",
  memberSince: "October 2026",
  level: 1,
  xp: 0,
  xpGoal: 100,
  coins: 0,
  weeklyEarned: 0,
  lifetimeCoins: 0,
  rank: 1,
  streak: 0,
  bestStreak: 0,
};

export const mockNavItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/tasks", label: "Todo", icon: "tasks" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/store", label: "Store", icon: "store" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

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

export const mockPreferences = [
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
