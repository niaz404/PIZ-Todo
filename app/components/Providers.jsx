"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Toast from "./Toast";
import LoginView from "./LoginView";
import DueTimeModal from "./DueTimeModal";
import PhoenixModal from "./PhoenixModal";
import { useSession } from "@/lib/auth-client";
import { createInitialDays, mockUser } from "../data/mockData";
import {
  ECONOMY,
  buildDailyHistory,
  buildMonthHistory,
  calculateMonthlyStreak,
  summarizeHistory,
} from "../lib/economy";
import { addDays, dateFromKey, formatCoins, getDateKey, getEffectiveDateKey } from "../lib/utils";

const WorkspaceContext = createContext(null);
const TOAST_DURATION = 3600;
const TOAST_ACTION_DURATION = 6500;
const STORAGE_KEY = "piz.todo.v1";
const FINISHED_MODES = new Set(["section", "together"]);
const HISTORY_MODE_IDS = new Set(["balanced", "consistent", "lazy"]);
const SOCIAL_FOCUSES = new Set(["mixed", "praise", "roast"]);

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error("useWorkspace must be used inside Providers");
  }
  return workspace;
}

function findTask(days, taskId) {
  for (const day of days) {
    const task = day.tasks.find((entry) => entry.id === taskId);
    if (task) return { day, task };
  }
  return null;
}

function deriveTaskDone(subtasks) {
  return subtasks.length > 0 && subtasks.every((subtask) => subtask.done);
}

function normalizeTask(task, date) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

  if (subtasks.length === 0) {
    return { ...task, subtasks, done: Boolean(task.done) };
  }

  const done = deriveTaskDone(subtasks);

  return {
    ...task,
    subtasks,
    done,
    completedAt: done ? task.completedAt ?? `${date}T12:00:00` : null,
  };
}

function normalizeDays(days) {
  return days.map((day) => ({
    ...day,
    settled: Boolean(day.settled),
    settledAt: day.settledAt ?? null,
    tasks: day.tasks.map((task) => normalizeTask(task, day.date)),
  }));
}

function makeTransaction({
  type,
  amount,
  label,
  date,
  createdAt = new Date().toISOString(),
  meta = null,
}) {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    amount,
    label,
    date,
    createdAt,
    meta,
  };
}

function createDemoFine(index, dayId, now) {
  return {
    id: `fine-demo-${Date.now()}-${index}`,
    taskId: `demo-task-${Date.now()}-${index}`,
    dayId,
    title: `Demo missed focus block ${index + 1}`,
    amount: ECONOMY.finePerMissedTask,
    status: "unpaid",
    createdAt: now,
    paidAt: null,
    waivedAt: null,
    simulated: true,
  };
}

function buildSettlement({ days, todayKey, coins, fines, now }) {
  const pastDays = days.filter((day) => day.date < todayKey && !day.settled);
  if (pastDays.length === 0) return null;

  let balance = coins;
  const settledDayIds = new Set();
  const nextFines = [...fines];
  const createdFines = [];
  const transactions = [];

  for (const day of pastDays) {
    settledDayIds.add(day.id);

    for (const task of day.tasks.filter((entry) => !entry.done)) {
      if (nextFines.some((fine) => fine.taskId === task.id)) continue;

      const fine = {
        id: `fine-${task.id}`,
        taskId: task.id,
        dayId: day.date,
        title: task.title,
        amount: ECONOMY.finePerMissedTask,
        status: "unpaid",
        createdAt: now,
        paidAt: null,
        waivedAt: null,
        simulated: false,
      };

      if (balance >= fine.amount) {
        balance -= fine.amount;
        fine.status = "paid";
        fine.paidAt = now;
        transactions.push(
          makeTransaction({
            type: "fine",
            amount: -fine.amount,
            label: `Missed "${task.title}"`,
            date: day.date,
            createdAt: now,
          }),
        );
      }

      nextFines.push(fine);
      createdFines.push(fine);
    }
  }

  return {
    days: days.map((day) =>
      settledDayIds.has(day.id)
        ? { ...day, settled: true, settledAt: now }
        : day,
    ),
    coins: balance,
    fines: nextFines,
    createdFines,
    transactions,
    settledDayCount: pastDays.length,
  };
}

export default function Providers({ children }) {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [days, setDays] = useState([]);
  const [coins, setCoins] = useState(ECONOMY.startingCoins);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [purchasedCoins, setPurchasedCoins] = useState(0);
  const [hearts, setHearts] = useState(0);
  const [autoPayFines, setAutoPayFines] = useState(false);
  const [lastPhoenixAt, setLastPhoenixAt] = useState(null);
  const [probationUntil, setProbationUntil] = useState(null);
  const [isPhoenixModalOpen, setIsPhoenixModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [fines, setFines] = useState([]);
  const [finishedMode, setFinishedMode] = useState("section");
  const [historyMode, setHistoryMode] = useState("balanced");
  const [socialFocus, setSocialFocus] = useState("mixed");
  const [streak, setStreak] = useState(0);
  const [userRole, setUserRole] = useState("member");
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dueTime, setDueTime] = useState("6:00 AM");
  const [dueHour, setDueHour] = useState(6);
  const [dueTimeChangedAt, setDueTimeChangedAt] = useState(null);
  const [isDueModalOpen, setIsDueModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const notify = useCallback(
    (title, description, tone = "success", action = null) => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id: Date.now(), title, description, tone, action });
      toastTimer.current = setTimeout(
        () => setToast(null),
        action ? TOAST_ACTION_DURATION : TOAST_DURATION,
      );
    },
    [],
  );

  const requireAuth = useCallback(
    (actionDescription = "perform this action") => {
      if (!session?.user) {
        notify(
          "Sign in required",
          `Please sign in with Google to ${actionDescription}.`,
          "warning",
        );
        setShowAuthModal(true);
        return false;
      }
      return true;
    },
    [session, notify],
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authErr = urlParams.get("error");
    if (authErr) {
      notify(
        "Authentication Error",
        authErr === "state_mismatch"
          ? "OAuth session expired or mismatched. Please try signing in again."
          : `Sign in error: ${authErr.replace(/_/g, " ")}.`,
        "danger",
      );
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [notify]);

  useEffect(() => {
    // If not logged in, reset workspace state so no user data is exposed to visitors
    if (!session?.user) {
      setDays([]);
      setCoins(0);
      setTransactions([]);
      setFines([]);
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }

    const userStorageKey = `piz.todo.user.${session.user.id}`;

    // Load user-specific cached state
    try {
      const stored = window.localStorage.getItem(userStorageKey);
      if (stored) {
        const saved = JSON.parse(stored);
        if (Array.isArray(saved.days)) setDays(normalizeDays(saved.days));
        if (Number.isFinite(saved.coins)) setCoins(saved.coins);
        if (FINISHED_MODES.has(saved.finishedMode)) setFinishedMode(saved.finishedMode);
        if (Array.isArray(saved.transactions)) setTransactions(saved.transactions.slice(0, 200));
        if (Array.isArray(saved.fines)) setFines(saved.fines);
      }
    } catch {}

    // Load authentic user-specific tasks strictly from MongoDB backend
    async function loadBackendWorkspace() {
      try {
        const res = await fetch("/api/workspace");
        if (!res.ok) return;
        const data = await res.json();
        if (!data.user) {
          setDays([]);
          setCoins(0);
          return;
        }

        if (Number.isFinite(data.user.coins)) setCoins(data.user.coins);
        if (Number.isFinite(data.user.earnedCoins)) setEarnedCoins(data.user.earnedCoins);
        if (Number.isFinite(data.user.purchasedCoins)) setPurchasedCoins(data.user.purchasedCoins);
        if (Number.isFinite(data.user.hearts)) setHearts(data.user.hearts);
        if (typeof data.user.autoPayFines === "boolean") setAutoPayFines(data.user.autoPayFines);
        if (data.user.lastPhoenixAt) setLastPhoenixAt(data.user.lastPhoenixAt);
        if (data.user.probationUntil) setProbationUntil(data.user.probationUntil);
        if (data.user.role) setUserRole(String(data.user.role).toLowerCase());
        if (Array.isArray(data.paymentRequests)) setPaymentRequests(data.paymentRequests);
        if (data.user.dueTime) setDueTime(data.user.dueTime);
        if (typeof data.user.dueHour === "number") setDueHour(data.user.dueHour);
        if (data.user.dueTimeChangedAt) setDueTimeChangedAt(data.user.dueTimeChangedAt);
        if (data.user.finishedMode && FINISHED_MODES.has(data.user.finishedMode)) {
          setFinishedMode(data.user.finishedMode);
        }
        if (Array.isArray(data.fines)) {
          setFines(data.fines);
        }
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }

        // Trigger overdue tasks settlement check at cutoff
        const userCutoffHour = typeof data.user.dueHour === "number" ? data.user.dueHour : 6;
        const currentTodayKey = getEffectiveDateKey(new Date(), userCutoffHour);
        fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "settle-missed-tasks", payload: { todayKey: currentTodayKey } }),
        }).catch(() => {});
        if (Array.isArray(data.tasks)) {
          const userCutoffHour = typeof data.user.dueHour === "number" ? data.user.dueHour : 6;
          const todayKey = getEffectiveDateKey(new Date(), userCutoffHour);
          const map = new Map();
          map.set(todayKey, {
            id: todayKey,
            date: todayKey,
            tasks: [],
            settled: false,
            settledAt: null,
          });
          data.tasks.forEach((task) => {
            const d = task.date || todayKey;
            if (!map.has(d)) {
              map.set(d, {
                id: d,
                date: d,
                tasks: [],
                settled: d < todayKey,
                settledAt: d < todayKey ? `${d}T23:59:00` : null,
              });
            }
            map.get(d).tasks.push(normalizeTask(task, d));
          });
          const backendDays = Array.from(map.values()).sort((a, b) =>
            b.date.localeCompare(a.date),
          );
          setDays(backendDays);
        }
      } catch (err) {
        console.error("Backend workspace load:", err);
      }
    }

    loadBackendWorkspace();
  }, [session?.user, refreshKey]);

  // Persist strictly to user-scoped local storage
  useEffect(() => {
    if (!session?.user?.id) return;
    const userStorageKey = `piz.todo.user.${session.user.id}`;
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(
          userStorageKey,
          JSON.stringify({
            days,
            coins,
            transactions,
            fines,
            finishedMode,
            historyMode,
            socialFocus,
          }),
        );
      } catch {
        // Ignore storage errors
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [
    session?.user?.id,
    days,
    coins,
    transactions,
    fines,
    finishedMode,
    historyMode,
    socialFocus,
  ]);

  useEffect(() => {
    const rotateDay = () => {
      const key = getEffectiveDateKey(new Date(), dueHour);

      setDays((current) => {
        if (current.some((day) => day.date === key)) return current;

        return [
          {
            id: key,
            date: key,
            tasks: [],
            settled: false,
            settledAt: null,
          },
          ...current,
        ].sort((a, b) => b.date.localeCompare(a.date));
      });
    };

    const firstCheck = setTimeout(rotateDay, 1000);
    const interval = setInterval(rotateDay, 60_000);

    return () => {
      clearTimeout(firstCheck);
      clearInterval(interval);
    };
  }, []);

  // Settle any past day that has not been closed yet.
  // Coin fine settlement is paused while coin gateway is in development.
  useEffect(() => {
    // No automatic fine deductions while payment system is disabled
    return;
  }, []);

  const [effectiveTodayKey, setEffectiveTodayKey] = useState(() => days[0]?.date || "");

  useEffect(() => {
    setEffectiveTodayKey(getEffectiveDateKey(new Date(), dueHour));
  }, [dueHour]);

  const todayDay = days[0] ?? {
    id: effectiveTodayKey,
    date: effectiveTodayKey,
    tasks: [],
    settled: false,
    settledAt: null,
  };
  const todayKey = todayDay.date;

  const openToday = todayDay.tasks.filter((task) => !task.done).length;
  const doneToday = todayDay.tasks.filter((task) => task.done).length;
  const pendingTasks = openToday;
  const availableTodayCoins = todayDay.tasks
    .filter((task) => !task.done)
    .reduce((sum, task) => sum + (Number(task.reward) || 0), 0);

  const unpaidFines = useMemo(
    () => fines.filter((fine) => fine.status === "unpaid"),
    [fines],
  );
  const unpaidFineCount = unpaidFines.length;
  const totalOutstanding = unpaidFines.reduce(
    (sum, fine) => sum + (Number(fine.amount) || 0),
    0,
  );

  const todayTaskCoinsEarned = useMemo(() => {
    return transactions
      .filter((tx) => tx.date === todayKey && (tx.type === "task-reward" || tx.type === "earn") && tx.amount > 0)
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions, todayKey]);
  // Account lock disabled while coin gateway is in development
  const isLocked = false;

  const dailyHistory = useMemo(
    () =>
      buildDailyHistory({
        days,
        fines,
        transactions,
        todayKey,
        mode: historyMode,
        length: 98,
      }),
    [days, fines, transactions, todayKey, historyMode],
  );
  const weekTotals = useMemo(
    () => summarizeHistory(dailyHistory.slice(-7)),
    [dailyHistory],
  );
  const todayFlow = dailyHistory[dailyHistory.length - 1];

  const monthHistory = useMemo(
    () => buildMonthHistory({ days, fines, transactions, todayKey }),
    [days, fines, transactions, todayKey],
  );
  const monthTotals = useMemo(
    () => summarizeHistory(monthHistory),
    [monthHistory],
  );
  const monthlyStreak = useMemo(
    () => calculateMonthlyStreak(days, todayKey),
    [days, todayKey],
  );

  const completedTasks = useMemo(
    () =>
      days
        .flatMap((day) =>
          day.tasks
            .filter((task) => task.done)
            .map((task) => ({ ...task, date: day.date })),
        )
        .sort((a, b) => {
          const aKey = a.completedAt ?? `${a.date}T00:00:00`;
          const bKey = b.completedAt ?? `${b.date}T00:00:00`;
          return bKey.localeCompare(aKey);
        }),
    [days],
  );

  const addTransaction = useCallback((entry) => {
    setTransactions((current) => [makeTransaction(entry), ...current].slice(0, 200));
  }, []);

  const commitTask = (taskId, buildNextTask, options = {}) => {
    const found = findTask(days, taskId);
    if (!found) return null;

    const nextTask = buildNextTask(found.task);
    if (!nextTask) return null;

    const wasDone = Boolean(found.task.done);
    const isDone = Boolean(nextTask.done);
    const isPastDay = found.day.date < todayKey;
    const unpaidFine = fines.find(
      (fine) => fine.taskId === taskId && fine.status === "unpaid",
    );

    setDays((current) =>
      current.map((day) => ({
        ...day,
        tasks: day.tasks.map((task) =>
          task.id === taskId ? nextTask : task,
        ),
      })),
    );

    // Persist to MongoDB
    fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, patch: nextTask }),
    }).catch(() => {});

    if (wasDone === isDone) return nextTask;

    if (isDone) {
      if (unpaidFine) {
        const now = new Date().toISOString();
        setFines((current) =>
          current.map((fine) =>
            fine.id === unpaidFine.id
              ? { ...fine, status: "waived", waivedAt: now }
              : fine,
          ),
        );
        addTransaction({
          type: "waive",
          amount: 0,
          label: `Fine waived · "${found.task.title}"`,
          date: found.day.date,
          createdAt: now,
        });
        notify(
          "Fine waived",
          `"${found.task.title}" recovered. ${formatCoins(
            unpaidFine.amount,
          )} coin fine cleared.`,
          "success",
        );
        return nextTask;
      }

      if (isPastDay) {
        notify(
          "Overdue task closed",
          "No reward for a past day, but the record is clean.",
          "info",
        );
        return nextTask;
      }

      const reward = Number(found.task.reward) || 0;

      if (reward > 0) {
        setCoins((current) => current + reward);
        addTransaction({
          type: "earn",
          amount: reward,
          label: `Completed "${found.task.title}"`,
          date: found.day.date,
        });
      }

      const undo =
        options.undo && reward > 0
          ? {
              label: "Undo",
              onClick: () => {
                setDays((current) =>
                  current.map((day) => ({
                    ...day,
                    tasks: day.tasks.map((task) =>
                      task.id === taskId
                        ? {
                            ...task,
                            done: found.task.done,
                            completedAt: found.task.completedAt,
                          }
                        : task,
                    ),
                  })),
                );
                setCoins((current) => current - reward);
                addTransaction({
                  type: "undo",
                  amount: -reward,
                  label: `Completion undone · "${found.task.title}"`,
                  date: found.day.date,
                });
              },
            }
          : null;

      notify(
        "Task completed",
        `"${found.task.title}" is finished!`,
        "success",
        undo,
      );
      return nextTask;
    }

    if (isPastDay) {
      notify(
        "Task reopened",
        `"${found.task.title}" is back in its day. No coin change for a past day.`,
        "info",
      );
      return nextTask;
    }

    const reward = Number(found.task.reward) || 0;
    if (reward > 0) {
      setCoins((current) => current - reward);
      addTransaction({
        type: "reopen",
        amount: -reward,
        label: `Reopened "${found.task.title}"`,
        date: found.day.date,
      });
    }
    notify(
      "Task reopened",
      `"${found.task.title}" is back in its day.`,
      "info",
    );
    return nextTask;
  };

  const addTask = (title) => {
    if (!requireAuth("create tasks")) return false;
    const trimmed = title.trim();
    if (!trimmed) return false;

    const key = getEffectiveDateKey(new Date(), dueHour);
    const task = {
      id: `task-${Date.now()}`,
      title: trimmed,
      tag: "Personal",
      reward: ECONOMY.defaultTaskReward,
      time: "Today",
      done: false,
      notes: "",
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setDays((current) => {
      const hasToday = current.some((day) => day.date === key);

      if (!hasToday) {
        return [
          {
            id: key,
            date: key,
            tasks: [task],
            settled: false,
            settledAt: null,
          },
          ...current,
        ].sort((a, b) => b.date.localeCompare(a.date));
      }

      return current.map((day) =>
        day.date === key
          ? { ...day, tasks: [...day.tasks, task] }
          : day,
      );
    });

    // Persist to MongoDB
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.task?.id && data.task.id !== task.id) {
          setDays((current) =>
            current.map((day) => ({
              ...day,
              tasks: day.tasks.map((t) =>
                t.id === task.id ? { ...t, id: data.task.id } : t,
              ),
            })),
          );
        }
      })
      .catch(() => {});

    notify(
      "Task added",
      `"${trimmed}" is waiting in today's list.`,
      "success",
    );
    return true;
  };

  const toggleTask = (taskId) => {
    if (!requireAuth("check off tasks")) return;
    const found = findTask(days, taskId);
    if (!found) return;

    if ((found.task.subtasks ?? []).length > 0) {
      notify(
        "Subtasks in progress",
        "This task completes when every subtask is done.",
        "info",
      );
      return;
    }

    commitTask(
      taskId,
      (task) => {
        const nextDone = !task.done;
        return {
          ...task,
          done: nextDone,
          completedAt: nextDone ? new Date().toISOString() : null,
        };
      },
      { undo: true },
    );
  };

  const updateTask = (taskId, patch) => {
    if (!requireAuth("edit tasks")) return false;
    const found = findTask(days, taskId);
    if (!found) return false;

    const nextTitle =
      typeof patch.title === "string" ? patch.title.trim() : found.task.title;
    if (!nextTitle) return false;

    setDays((current) =>
      current.map((day) => ({
        ...day,
        tasks: day.tasks.map((task) =>
          task.id === taskId ? { ...task, ...patch, title: nextTitle } : task,
        ),
      })),
    );

    fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, patch: { ...patch, title: nextTitle } }),
    }).catch(() => {});

    notify("Task updated", `"${nextTitle}" saved.`, "info");
    return true;
  };

  const deleteTask = (taskId) => {
    if (!requireAuth("delete tasks")) return false;
    const found = findTask(days, taskId);
    if (!found) return false;

    setDays((current) =>
      current.map((entry) => ({
        ...entry,
        tasks: entry.tasks.filter((entryTask) => entryTask.id !== taskId),
      })),
    );

    // Delete from MongoDB
    fetch(`/api/tasks?taskId=${taskId}`, { method: "DELETE" }).catch(() => {});

    notify(
      "Task deleted",
      `"${found.task.title}" was removed.`,
      "danger",
    );
    return true;
  };

  const addSubtask = (taskId, title) => {
    if (!requireAuth("add subtasks")) return false;
    const trimmed = title.trim();
    if (!trimmed) return false;

    const subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: trimmed,
      done: false,
    };

    commitTask(taskId, (task) => {
      const subtasks = [...(task.subtasks ?? []), subtask];
      const done = deriveTaskDone(subtasks);
      return {
        ...task,
        subtasks,
        done,
        completedAt: done
          ? task.done
            ? task.completedAt ?? new Date().toISOString()
            : new Date().toISOString()
          : null,
      };
    });
    return true;
  };

  const toggleSubtask = (taskId, subtaskId) => {
    if (!requireAuth("toggle subtasks")) return;
    commitTask(taskId, (task) => {
      const currentSubtasks = task.subtasks ?? [];
      if (!currentSubtasks.some((subtask) => subtask.id === subtaskId)) {
        return task;
      }

      const subtasks = currentSubtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, done: !subtask.done }
          : subtask,
      );
      const done = deriveTaskDone(subtasks);

      return {
        ...task,
        subtasks,
        done,
        completedAt: done
          ? task.done
            ? task.completedAt ?? new Date().toISOString()
            : new Date().toISOString()
          : null,
      };
    });
  };

  const updateSubtask = (taskId, subtaskId, title) => {
    if (!requireAuth("edit subtasks")) return false;
    const trimmed = title.trim();
    if (!trimmed) return false;

    const found = findTask(days, taskId);
    const subtask = found?.task.subtasks?.find((entry) => entry.id === subtaskId);
    if (!found || !subtask) return false;
    if (trimmed === subtask.title) return true;

    commitTask(taskId, (task) => {
      const currentSubtasks = task.subtasks ?? [];
      return {
        ...task,
        subtasks: currentSubtasks.map((entry) =>
          entry.id === subtaskId ? { ...entry, title: trimmed } : entry,
        ),
      };
    });
    return true;
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (!requireAuth("delete subtasks")) return false;
    const found = findTask(days, taskId);
    const subtask = found?.task.subtasks?.find((entry) => entry.id === subtaskId);
    if (!found || !subtask) return false;

    commitTask(taskId, (task) => {
      const currentSubtasks = task.subtasks ?? [];
      const subtasks = currentSubtasks.filter(
        (entry) => entry.id !== subtaskId,
      );
      const done = deriveTaskDone(subtasks);

      return {
        ...task,
        subtasks,
        done,
        completedAt: done
          ? task.done
            ? task.completedAt ?? new Date().toISOString()
            : new Date().toISOString()
          : null,
      };
    });
    notify("Subtask deleted", `"${subtask.title}" was removed.`, "info");
    return true;
  };

  const redeem = (item) => {
    if (!requireAuth("redeem store rewards")) return false;
    if (unpaidFineCount > 0) {
      notify(
        "Clear fines first",
        "Rewards are paused while a fine is outstanding. Your future self will thank you.",
        "warning",
      );
      return false;
    }

    if (coins < item.cost) {
      notify(
        "Not enough coins",
        `${formatCoins(item.cost - coins)} more coins are needed for ${
          item.title
        }.`,
        "warning",
      );
      return false;
    }

    setCoins((current) => current - item.cost);
    addTransaction({
      type: "reward",
      amount: -item.cost,
      label: `Redeemed · ${item.title}`,
      date: getDateKey(new Date()),
    });
    notify("Reward redeemed", `${item.title} · ${formatCoins(item.cost)} coins`);
    return true;
  };

  const buyCoins = (pack) => {
    notify(
      "Payment Gateway Coming Soon",
      "Online top-ups are locked pending official payment gateway integration. Coins can currently only be earned by completing daily tasks.",
      "info",
    );
    return false;
  };

  const payFines = () => {
    if (!requireAuth("pay fines")) return 0;
    if (unpaidFines.length === 0) {
      notify("No fines waiting", "Your account is already clear.", "info");
      return 0;
    }

    let balance = coins;
    let paidCount = 0;
    let paidTotal = 0;
    const now = new Date().toISOString();

    const nextFines = fines.map((fine) => {
      if (fine.status !== "unpaid") return fine;
      if (balance < fine.amount) return fine;

      balance -= fine.amount;
      paidCount += 1;
      paidTotal += fine.amount;
      return { ...fine, status: "paid", paidAt: now };
    });

    if (paidCount === 0) {
      notify(
        "Not enough coins",
        `You need ${formatCoins(
          totalOutstanding - coins,
        )} more coins to clear a fine. Top up in the store.`,
        "warning",
      );
      return 0;
    }

    setCoins(balance);
    setFines(nextFines);
    addTransaction({
      type: "fine-payment",
      amount: -paidTotal,
      label: `Paid ${paidCount} fine${paidCount === 1 ? "" : "s"}`,
      date: getDateKey(new Date()),
      createdAt: now,
    });

    const remaining = nextFines.filter(
      (fine) => fine.status === "unpaid",
    ).length;
    notify(
      "Fines cleared",
      `${paidCount} fine${
        paidCount === 1 ? "" : "s"
      } paid · -${formatCoins(paidTotal)} coins.${
        remaining > 0
          ? ` ${remaining} still outstanding.`
          : " Account unlocked."
      }`,
      remaining > 0 ? "warning" : "success",
    );
    return paidCount;
  };

  const waiveAllFines = () => {
    const count = unpaidFines.length;
    if (count === 0) {
      notify("No fines waiting", "Your account is already clear.", "info");
      return;
    }

    const now = new Date().toISOString();
    setFines((current) =>
      current.map((fine) =>
        fine.status === "unpaid"
          ? { ...fine, status: "waived", waivedAt: now }
          : fine,
      ),
    );
    addTransaction({
      type: "waive",
      amount: 0,
      label: `Waived ${count} fine${count === 1 ? "" : "s"}`,
      date: getDateKey(new Date()),
      createdAt: now,
    });
    notify(
      "Fines waived",
      `${count} fine${count === 1 ? "" : "s"} cleared for the demo.`,
      "success",
    );
  };

  const addCoins = (amount, label = "Demo credit") => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setCoins((current) => current + amount);
    addTransaction({
      type: "demo",
      amount,
      label,
      date: getDateKey(new Date()),
    });
    notify("Coins added", `+${formatCoins(amount)} coins · ${label}.`, "success");
  };

  const removeCoins = (amount, label = "Demo debit") => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const actual = Math.min(coins, amount);
    setCoins((current) => Math.max(0, current - amount));
    addTransaction({
      type: "demo",
      amount: -actual,
      label,
      date: getDateKey(new Date()),
    });
    notify(
      "Coins removed",
      `-${formatCoins(actual)} coins · ${label}.`,
      "warning",
    );
  };

  const applyDemoState = (state = {}) => {
    const now = new Date().toISOString();
    const nextBalance = Number.isFinite(state.balance)
      ? Math.max(0, state.balance)
      : coins;
    const nextUnpaid = Number.isFinite(state.unpaidFines)
      ? Math.max(0, Math.floor(state.unpaidFines))
      : unpaidFineCount;

    setCoins(nextBalance);
    setFines(
      Array.from({ length: nextUnpaid }, (_, index) =>
        createDemoFine(index, todayKey, now),
      ),
    );
    if (HISTORY_MODE_IDS.has(state.historyMode)) {
      setHistoryMode(state.historyMode);
    }
    if (SOCIAL_FOCUSES.has(state.socialFocus)) {
      setSocialFocus(state.socialFocus);
    }
    if (Number.isFinite(state.streak)) setStreak(state.streak);

    notify(
      "Demo state loaded",
      `Balance ${formatCoins(nextBalance)} · ${nextUnpaid} unpaid fine${
        nextUnpaid === 1 ? "" : "s"
      } · ${state.historyMode ?? historyMode} graph.`,
      "info",
    );
  };

  const simulateMissedDay = (count = 1) => {
    const missed = Math.max(1, Math.min(5, Math.floor(count)));
    const today = dateFromKey(todayKey);
    let offset = 40;
    let dateKey = getDateKey(addDays(today, -offset));

    while (days.some((day) => day.date === dateKey) && offset < 400) {
      offset += 1;
      dateKey = getDateKey(addDays(today, -offset));
    }

    const now = new Date().toISOString();
    const simulatedDay = {
      id: `sim-${dateKey}-${Date.now()}`,
      date: dateKey,
      settled: false,
      settledAt: null,
      simulated: true,
      tasks: Array.from({ length: missed }, (_, index) => ({
        id: `sim-task-${dateKey}-${Date.now()}-${index}`,
        title: `Simulated missed task ${index + 1}`,
        tag: "Demo",
        reward: ECONOMY.defaultTaskReward,
        time: "Demo",
        done: false,
        notes: "",
        subtasks: [],
        createdAt: `${dateKey}T08:00:00`,
        completedAt: null,
      })),
    };

    const result = buildSettlement({
      days: [...days, simulatedDay],
      todayKey,
      coins,
      fines,
      now,
    });

    if (!result) return;

    setDays(result.days);
    setCoins(result.coins);
    setFines(result.fines);
    if (result.transactions.length > 0) {
      setTransactions((current) =>
        [...result.transactions, ...current].slice(0, 200),
      );
    }

    const unpaid = result.createdFines.filter(
      (fine) => fine.status === "unpaid",
    ).length;
    const paid = result.createdFines.length - unpaid;
    notify(
      "Simulated settlement",
      `${missed} missed task${missed === 1 ? "" : "s"} · ${paid} paid · ${unpaid} unpaid.`,
      unpaid > 0 ? "warning" : "success",
    );
  };

  const updateDueTime = useCallback(
    async (newDueTime, newDueHour) => {
      if (!requireAuth("change task due cutoff time")) return false;
      try {
        const res = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update-due-time",
            payload: { dueTime: newDueTime, dueHour: newDueHour },
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          notify(
            "Update Locked",
            data.error || "Could not update due time.",
            "danger",
          );
          return false;
        }
        setDueTime(data.dueTime);
        setDueHour(data.dueHour);
        setDueTimeChangedAt(data.dueTimeChangedAt);
        notify(
          "Due Time Updated",
          `Work tasks will now be due at ${data.dueTime}. Locked until next month.`,
          "success",
        );
        return true;
      } catch (err) {
        notify("Update Failed", "Could not save cutoff time.", "danger");
        return false;
      }
    },
    [requireAuth, notify],
  );

  const buyHeart = useCallback(async () => {
    if (!requireAuth("buy a Heart")) return false;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buy-heart" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        notify("Heart Purchase", data.error || "Could not buy Heart.", "danger");
        return false;
      }
      setHearts(data.hearts);
      setCoins(data.coins);
      setEarnedCoins(data.earnedCoins);
      setPurchasedCoins(data.purchasedCoins);
      notify("Heart Stored", "1 Heart added to your vault. Permanent wealth immunity active.", "success");
      return true;
    } catch {
      notify("Error", "Could not complete purchase.", "danger");
      return false;
    }
  }, [requireAuth, notify]);

  const payFineWithCoins = useCallback(async (fineId) => {
    if (!requireAuth("pay fines")) return false;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-fine", payload: { fineId, method: "coins" } }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        notify("Fine Payment", data.error || "Could not pay fine.", "danger");
        return false;
      }
      setFines((prev) => prev.map((f) => (f.id === fineId || f._id === fineId ? { ...f, status: "paid" } : f)));
      setCoins(data.coins);
      setEarnedCoins(data.earnedCoins);
      setPurchasedCoins(data.purchasedCoins);
      notify("Fine Settled", "50 coins paid. Account standing cleared.", "success");
      return true;
    } catch {
      notify("Error", "Could not settle fine.", "danger");
      return false;
    }
  }, [requireAuth, notify]);

  const payFineWithHeart = useCallback(async (fineId) => {
    if (!requireAuth("use a Heart")) return false;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay-fine", payload: { fineId, method: "heart" } }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        notify("Heart Redemption", data.error || "Could not use Heart.", "danger");
        return false;
      }
      setFines((prev) => prev.map((f) => (f.id === fineId || f._id === fineId ? { ...f, status: "waived", method: "heart" } : f)));
      setHearts(data.hearts);
      notify("Fine Waived", "1 Heart redeemed. Fine cleared without spending coins.", "success");
      return true;
    } catch {
      notify("Error", "Could not redeem Heart.", "danger");
      return false;
    }
  }, [requireAuth, notify]);

  const toggleAutoPay = useCallback(async (enabled) => {
    if (!requireAuth("change settings")) return false;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-auto-pay", payload: { enabled } }),
      });
      const data = await res.json();
      if (res.ok) {
        setAutoPayFines(Boolean(data.autoPayFines));
        notify(
          "Setting Updated",
          enabled ? "Fines will auto-pay at day rollover if coins are available." : "Fines will require manual review.",
          "info",
        );
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [requireAuth, notify]);

  const activatePhoenix = useCallback(async () => {
    if (!requireAuth("activate Phoenix Fresh Start")) return false;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate-phoenix" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        notify("Phoenix Protocol", data.error || "Could not activate Fresh Start.", "danger");
        return false;
      }
      setFines((prev) => prev.map((f) => ({ ...f, status: "waived" })));
      setCoins(data.coins);
      setEarnedCoins(data.earnedCoins);
      setProbationUntil(data.probationUntil);
      notify("Phoenix Activated", "Fresh start active! +25 starter coins granted and fines cleared.", "success");
      return true;
    } catch {
      notify("Error", "Could not activate Phoenix.", "danger");
      return false;
    }
  }, [requireAuth, notify]);

  const refreshWorkspace = useCallback(() => setRefreshKey((k) => k + 1), []);

  const resetDemo = () => {
    setDays(normalizeDays(createInitialDays()));
    setCoins(ECONOMY.startingCoins);
    setTransactions([]);
    setFines([]);
    setFinishedMode("section");
    setHistoryMode("balanced");
    setSocialFocus("mixed");
    setStreak(mockUser.streak);
    notify(
      "Demo reset",
      "Seed tasks, a clean ledger, and a balanced economy.",
      "success",
    );
  };

  return (
    <WorkspaceContext.Provider
      value={{
        days,
        todayDay,
        completedTasks,
        coins,
        openToday,
        doneToday,
        pendingTasks,
        availableTodayCoins,
        finishedMode,
        setFinishedMode,
        transactions,
        fines,
        unpaidFines,
        unpaidFineCount,
        totalOutstanding,
        isLocked,
        maxUnpaidFines: ECONOMY.maxUnpaidFines,
        dailyHistory,
        weekTotals,
        monthHistory,
        monthTotals,
        monthlyStreak,
        todayFlow,
        historyMode,
        setHistoryMode,
        socialFocus,
        setSocialFocus,
        streak: monthlyStreak,
        setStreak,
        notify,
        dismissToast,
        toggleTask,
        addTask,
        updateTask,
        deleteTask,
        addSubtask,
        toggleSubtask,
        updateSubtask,
        deleteSubtask,
        redeem,
        buyCoins,
        payFines,
        addCoins,
        removeCoins,
        applyDemoState,
        simulateMissedDay,
        waiveAllFines,
        resetDemo,
        dueTime,
        dueHour,
        dueTimeChangedAt,
        isDueModalOpen,
        setIsDueModalOpen,
        updateDueTime,
        hearts,
        earnedCoins,
        purchasedCoins,
        autoPayFines,
        lastPhoenixAt,
        probationUntil,
        todayTaskCoinsEarned,
        buyHeart,
        payFineWithCoins,
        payFineWithHeart,
        toggleAutoPay,
        activatePhoenix,
        isPhoenixModalOpen,
        setIsPhoenixModalOpen,
        userRole,
        isStaff: ["owner", "admin", "moderator"].includes(userRole?.toLowerCase()),
        paymentRequests,
        refreshWorkspace,
        requireAuth,
        setShowAuthModal,
      }}
    >
      {children}
      <Toast key={toast?.id ?? "empty"} toast={toast} onClose={dismissToast} />
      <DueTimeModal
        open={isDueModalOpen}
        onClose={() => setIsDueModalOpen(false)}
      />
      <PhoenixModal
        open={isPhoenixModalOpen}
        onClose={() => setIsPhoenixModalOpen(false)}
      />
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div
            onClick={() => setShowAuthModal(false)}
            className="fixed inset-0"
          />
          <div className="relative z-10 w-full max-w-md my-auto max-h-[92vh] overflow-y-auto">
            <LoginView onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
