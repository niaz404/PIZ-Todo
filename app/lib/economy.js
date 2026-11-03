import { addDays, dateFromKey, formatShortDate, getDateKey } from "./utils";

/**
 * The economy is intentionally a little harsh. A task should feel like a
 * small promise: keeping it pays a little, breaking it costs noticeably more.
 * All values are in coins unless the name says otherwise.
 */
export const ECONOMY = {
  coinPerTk: 1,
  startingCoins: 0,
  defaultTaskReward: 15,
  dailyMaxTaskCoins: 60,
  finePerMissedTask: 45,
  taskEditCost: 2,
  subtaskEditCost: 0,
  deleteOpenTaskCost: 5,
  deleteDoneTaskCost: 5,
  taskDeleteCost: 5,
  deleteSubtaskCost: 0,
  heartCost: 75,
  maxHearts: 3,
  streakRewardBonus: 30,
  streakInterval: 3,
  maxUnpaidFines: 4,
  phoenixCooldownDays: 30,
  phoenixStarterCoins: 20,
};

export const BKASH_CONFIG = {
  number: "01902954519",
  type: "Personal (Send Money)",
  recipient: "PIZ-Todo Official Treasury",
};

export const COIN_PACKS = [
  {
    id: "coins-25",
    coins: 25,
    tk: 25,
    label: "Small top-up",
    note: "Quick coin boost",
  },
  {
    id: "coins-50",
    coins: 50,
    tk: 50,
    label: "Quick rescue",
    note: "Clears one missed task fine",
  },
  {
    id: "coins-100",
    coins: 100,
    tk: 100,
    label: "Fine shield",
    note: "Clears two fines or funds a Heart",
    featured: true,
  },
  {
    id: "coins-200",
    coins: 200,
    tk: 200,
    label: "Recovery pack",
    note: "Deep fine shield & emergency wealth",
  },
  {
    id: "coins-500",
    coins: 500,
    tk: 500,
    label: "Fresh start",
    note: "A full reset, without the guilt",
  },
];

export const HISTORY_MODES = [
  {
    id: "balanced",
    label: "Balanced",
    description: "A realistic mix of wins, fines, and small spends.",
  },
  {
    id: "consistent",
    label: "On fire",
    description: "Mostly green days, no fines, a visible streak.",
  },
  {
    id: "lazy",
    label: "Lazy week",
    description: "Missed days, heavy fines, and a lot of red.",
  },
];

const historyPatterns = {
  balanced: {
    earned: [130, 95, 145, 70, 150, 120, 105],
    fined: [0, 100, 0, 0, 100, 0, 0],
    spent: [15, 0, 25, 110, 0, 15, 0],
    completed: [4, 2, 5, 1, 5, 3, 4],
    missed: [1, 3, 0, 4, 0, 2, 1],
  },
  consistent: {
    earned: [145, 160, 130, 150, 170, 140, 155],
    fined: [0, 0, 0, 0, 0, 0, 0],
    spent: [15, 0, 25, 0, 10, 0, 0],
    completed: [5, 5, 4, 5, 5, 4, 5],
    missed: [0, 0, 1, 0, 0, 1, 0],
  },
  lazy: {
    earned: [40, 60, 25, 0, 45, 30, 20],
    fined: [300, 200, 400, 300, 200, 300, 400],
    spent: [30, 0, 50, 20, 0, 40, 0],
    completed: [0, 1, 0, 0, 1, 0, 0],
    missed: [5, 4, 5, 5, 4, 5, 5],
  },
};

export function createSeedHistory(todayKey, mode = "balanced", length = 28) {
  const today = dateFromKey(todayKey);

  return Array.from({ length }, (_, index) => {
    const offset = length - 1 - index;
    const date = getDateKey(addDays(today, -offset));

    return {
      date,
      label: formatShortDate(date),
      earned: 0,
      fined: 0,
      spent: 0,
      completed: 0,
      missed: 0,
      rate: 0,
      seeded: false,
    };
  });
}

export function buildDailyHistory({
  days,
  fines,
  transactions,
  todayKey,
  mode = "balanced",
  length = 28,
}) {
  const today = dateFromKey(todayKey);
  const daysByDate = new Map((days || []).map((day) => [day.date, day]));

  return Array.from({ length }, (_, index) => {
    const offset = length - 1 - index;
    const date = getDateKey(addDays(today, -offset));
    const day = daysByDate.get(date);

    if (!day) {
      return {
        date,
        label: formatShortDate(date),
        earned: 0,
        fined: 0,
        spent: 0,
        completed: 0,
        missed: 0,
        rate: 0,
        seeded: false,
      };
    }

    const doneTasks = (day.tasks || []).filter((task) => task.done);
    const openTasks = (day.tasks || []).filter((task) => !task.done);
    const earned = doneTasks.reduce(
      (sum, task) => sum + (Number(task.reward) || 0),
      0,
    );
    const fined = (fines || [])
      .filter((fine) => fine.dayId === date)
      .reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0);
    const spent = (transactions || [])
      .filter(
        (entry) =>
          entry.date === date &&
          ["edit", "delete", "reward"].includes(entry.type),
      )
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0);
    const total = doneTasks.length + openTasks.length;

    return {
      date,
      label: formatShortDate(date),
      earned,
      fined,
      spent,
      completed: doneTasks.length,
      missed: openTasks.length,
      rate: total ? Math.round((doneTasks.length / total) * 100) : 0,
      seeded: false,
    };
  });
}

export function summarizeHistory(history) {
  return history.reduce(
    (totals, day) => ({
      earned: totals.earned + (day.earned || 0),
      fined: totals.fined + (day.fined || 0),
      spent: totals.spent + (day.spent || 0),
      completed: totals.completed + (day.completed || 0),
      missed: totals.missed + (day.missed || 0),
      days: totals.days + 1,
    }),
    { earned: 0, fined: 0, spent: 0, completed: 0, missed: 0, days: 0 },
  );
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getDaysInMonth(year, monthIdx) {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysMap = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysMap[monthIdx] ?? 30;
}

export function buildMonthHistory({
  days,
  fines,
  transactions,
  todayKey = "2026-11-01",
  historyByDate = {},
  completedDates = [],
}) {
  const parts = todayKey.split("-");
  const currentYear = Number(parts[0]) || 2026;
  const monthNum = Number(parts[1]) || 11;
  const currentMonth = monthNum - 1; // 0-indexed
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const daysByDate = new Map((days || []).map((day) => [day.date, day]));
  const monthName = MONTH_NAMES[currentMonth] || "Nov";
  const persistentSet = new Set(Array.isArray(completedDates) ? completedDates : []);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNum = index + 1;
    const y = currentYear;
    const m = String(monthNum).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    const day = daysByDate.get(dateKey);
    const persistentHistory = historyByDate[dateKey];

    const doneTasks = (day?.tasks || []).filter((task) => task.done);
    const openTasks = (day?.tasks || []).filter((task) => !task.done);

    const completed = Math.max(
      doneTasks.length,
      persistentHistory?.completed ?? (persistentSet.has(dateKey) ? 1 : 0),
    );

    const txEarned = (transactions || [])
      .filter((tx) => tx.date === dateKey && (tx.type === "task-reward" || tx.type === "earn"))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const earned = Math.max(
      doneTasks.reduce((sum, task) => sum + (Number(task.reward) || 0), 0),
      persistentHistory?.earned ?? txEarned,
    );

    const fined = (fines || [])
      .filter((fine) => fine.dayId === dateKey)
      .reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0);

    const spent = (transactions || [])
      .filter(
        (entry) =>
          entry.date === dateKey &&
          ["edit", "delete", "reward", "task-edit", "task-delete"].includes(entry.type),
      )
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0);

    const total = completed + openTasks.length;

    return {
      date: dateKey,
      dayNum,
      label: `${monthName} ${dayNum}`,
      shortLabel: `${dayNum}`,
      earned,
      fined,
      spent,
      completed,
      missed: openTasks.length,
      rate: total ? Math.round((completed / total) * 100) : 0,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    };
  });
}

export function calculateMonthlyStreak(days, todayKey = "2026-11-01", completedDates = []) {
  const parts = todayKey.split("-");
  const currentYear = Number(parts[0]) || 2026;
  const monthNum = Number(parts[1]) || 11;
  const todayDateNum = Number(parts[2]) || 1;
  const daysByDate = new Map((days || []).map((day) => [day.date, day]));
  const persistentSet = new Set(Array.isArray(completedDates) ? completedDates : []);

  const y = currentYear;
  const m = String(monthNum).padStart(2, "0");
  const todayDay = daysByDate.get(todayKey);
  const todayDone = (todayDay?.tasks || []).some((t) => t.done) || persistentSet.has(todayKey);

  let streak = 0;
  let checkDayNum = todayDone ? todayDateNum : todayDateNum - 1;

  while (checkDayNum >= 1) {
    const key = `${y}-${m}-${String(checkDayNum).padStart(2, "0")}`;
    const day = daysByDate.get(key);
    const hasCompleted = (day?.tasks || []).some((t) => t.done) || persistentSet.has(key);
    if (hasCompleted) {
      streak += 1;
      checkDayNum -= 1;
    } else {
      break;
    }
  }

  return streak;
}

export const DEMO_SCENARIOS = [
  {
    id: "balanced",
    label: "Balanced week",
    description: "A normal week: some wins, one or two slips, enough coins to recover.",
    state: {
      balance: 360,
      unpaidFines: 0,
      historyMode: "balanced",
      socialFocus: "mixed",
      streak: 12,
    },
  },
  {
    id: "consistent",
    label: "On fire",
    description: "High balance, no fines, green graph, praise cards at the top.",
    state: {
      balance: 760,
      unpaidFines: 0,
      historyMode: "consistent",
      socialFocus: "praise",
      streak: 21,
    },
  },
  {
    id: "at-risk",
    label: "At risk",
    description: "Two unpaid fines, a thinner balance, and a warning banner.",
    state: {
      balance: 180,
      unpaidFines: 2,
      historyMode: "balanced",
      socialFocus: "mixed",
      streak: 4,
    },
  },
  {
    id: "locked",
    label: "Timed out",
    description: "Four unpaid fines. New todos are locked until the fines are cleared.",
    state: {
      balance: 20,
      unpaidFines: 4,
      historyMode: "lazy",
      socialFocus: "roast",
      streak: 0,
    },
  },
  {
    id: "lazy",
    label: "Lazy week",
    description: "A week of missed days and red bars. Roasts take over the team pulse.",
    state: {
      balance: 40,
      unpaidFines: 4,
      historyMode: "lazy",
      socialFocus: "roast",
      streak: 0,
    },
  },
  {
    id: "fresh",
    label: "Fresh start",
    description: "A small balance, no fines, and a clean slate for a new user.",
    state: {
      balance: 120,
      unpaidFines: 0,
      historyMode: "balanced",
      socialFocus: "mixed",
      streak: 1,
    },
  },
];

export const COST_RULES = [
  {
    id: "missed",
    label: "Missed task",
    amount: ECONOMY.finePerMissedTask,
    note: "Charged at day rollover",
  },
  {
    id: "edit-task",
    label: "Edit task",
    amount: ECONOMY.taskEditCost,
    note: "Title changes only",
  },
  {
    id: "edit-subtask",
    label: "Edit subtask",
    amount: ECONOMY.subtaskEditCost,
    note: "Small correction fee",
  },
  {
    id: "delete-open",
    label: "Delete open task",
    amount: ECONOMY.deleteOpenTaskCost,
    note: "Higher than a fine, so deleting is not a loophole",
  },
  {
    id: "delete-done",
    label: "Delete finished task",
    amount: ECONOMY.deleteDoneTaskCost,
    note: "Cleanup fee",
  },
  {
    id: "delete-subtask",
    label: "Delete subtask",
    amount: ECONOMY.deleteSubtaskCost,
    note: "Keeps the checklist honest",
  },
];
