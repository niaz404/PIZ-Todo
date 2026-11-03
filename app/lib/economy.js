import { addDays, dateFromKey, formatShortDate, getDateKey } from "./utils";

/**
 * The economy is intentionally a little harsh. A task should feel like a
 * small promise: keeping it pays a little, breaking it costs noticeably more.
 * All values are in coins unless the name says otherwise.
 */
export const ECONOMY = {
  coinPerTk: 1,
  startingCoins: 0,
  defaultTaskReward: 25,
  dailyMaxTaskCoins: 150,
  finePerMissedTask: 50,
  taskEditCost: 2,
  subtaskEditCost: 0,
  deleteOpenTaskCost: 5,
  deleteDoneTaskCost: 5,
  taskDeleteCost: 5,
  deleteSubtaskCost: 0,
  heartCost: 80,
  maxHearts: 3,
  streakRewardBonus: 50,
  streakInterval: 3,
  maxUnpaidFines: 4,
  phoenixCooldownDays: 30,
  phoenixStarterCoins: 25,
};

export const BKASH_CONFIG = {
  number: "01902954519",
  type: "Personal (Send Money)",
  recipient: "PIZ-Todo Official Treasury",
};

export const COIN_PACKS = [
  {
    id: "coins-20",
    coins: 20,
    tk: 20,
    label: "Small top-up",
    note: "A little breathing room",
  },
  {
    id: "coins-50",
    coins: 50,
    tk: 50,
    label: "Quick rescue",
    note: "Half a missed-task fine",
  },
  {
    id: "coins-100",
    coins: 100,
    tk: 100,
    label: "Fine shield",
    note: "Clears one missed task",
    featured: true,
  },
  {
    id: "coins-200",
    coins: 200,
    tk: 200,
    label: "Recovery pack",
    note: "Clears two missed tasks",
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

export function buildMonthHistory({ days, fines, transactions, todayKey = "2026-11-01" }) {
  const parts = todayKey.split("-");
  const currentYear = Number(parts[0]) || 2026;
  const monthNum = Number(parts[1]) || 11;
  const currentMonth = monthNum - 1; // 0-indexed
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const daysByDate = new Map((days || []).map((day) => [day.date, day]));
  const monthName = MONTH_NAMES[currentMonth] || "Nov";

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayNum = index + 1;
    const y = currentYear;
    const m = String(monthNum).padStart(2, "0");
    const d = String(dayNum).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    const day = daysByDate.get(dateKey);

    const doneTasks = (day?.tasks || []).filter((task) => task.done);
    const openTasks = (day?.tasks || []).filter((task) => !task.done);
    const earned = doneTasks.reduce(
      (sum, task) => sum + (Number(task.reward) || 0),
      0,
    );
    const fined = (fines || [])
      .filter((fine) => fine.dayId === dateKey)
      .reduce((sum, fine) => sum + (Number(fine.amount) || 0), 0);
    const spent = (transactions || [])
      .filter(
        (entry) =>
          entry.date === dateKey &&
          ["edit", "delete", "reward"].includes(entry.type),
      )
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount) || 0), 0);
    const total = doneTasks.length + openTasks.length;

    return {
      date: dateKey,
      dayNum,
      label: `${monthName} ${dayNum}`,
      shortLabel: `${dayNum}`,
      earned,
      fined,
      spent,
      completed: doneTasks.length,
      missed: openTasks.length,
      rate: total ? Math.round((doneTasks.length / total) * 100) : 0,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    };
  });
}

export function calculateMonthlyStreak(days, todayKey = "2026-11-01") {
  const parts = todayKey.split("-");
  const currentYear = Number(parts[0]) || 2026;
  const monthNum = Number(parts[1]) || 11;
  const todayDateNum = Number(parts[2]) || 1;
  const daysByDate = new Map((days || []).map((day) => [day.date, day]));

  const y = currentYear;
  const m = String(monthNum).padStart(2, "0");
  const todayDay = daysByDate.get(todayKey);
  const todayDone = (todayDay?.tasks || []).some((t) => t.done);

  let streak = 0;
  let checkDayNum = todayDone ? todayDateNum : todayDateNum - 1;

  while (checkDayNum >= 1) {
    const key = `${y}-${m}-${String(checkDayNum).padStart(2, "0")}`;
    const day = daysByDate.get(key);
    const hasCompleted = (day?.tasks || []).some((t) => t.done);
    if (hasCompleted) {
      streak += 1;
      checkDayNum -= 1;
    } else {
      break;
    }
  }

  return streak;
}

export const TEAM_PEERS = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    role: "Design",
    completed: 34,
    streak: 21,
    fines: 0,
    status: "on-fire",
    praise:
      "Maya is on a 21-day tear. 34 tasks this week, zero fines. The rest of us are just living in her shadow.",
  },
  {
    id: "noah",
    name: "Noah Kim",
    initials: "NK",
    role: "Engineering",
    completed: 31,
    streak: 14,
    fines: 0,
    status: "on-fire",
    praise:
      "Noah cleared 31 tasks and kept a 14-day streak. Annoyingly consistent. Genuinely impressive.",
  },
  {
    id: "priya",
    name: "Priya Shah",
    initials: "PS",
    role: "Writing",
    completed: 22,
    streak: 8,
    fines: 1,
    status: "steady",
    praise: "Priya is quietly stacking good days. One small slip, no drama.",
  },
  {
    id: "sam",
    name: "Sam Ortiz",
    initials: "SO",
    role: "Community",
    completed: 12,
    streak: 2,
    fines: 3,
    status: "at-risk",
    roast:
      "Sam is treating fines like a subscription. Three unpaid slips and the todo list is still 'in progress'.",
  },
  {
    id: "leo",
    name: "Leo Park",
    initials: "LP",
    role: "Planning",
    completed: 6,
    streak: 0,
    fines: 4,
    status: "locked",
    roast:
      "Leo has been planning to start since Tuesday. The list is not a vision board. Four fines and a timeout.",
  },
];

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
