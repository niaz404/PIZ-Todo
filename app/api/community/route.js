import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/db";
import { getDateKey, addDays } from "@/app/lib/utils";

export async function GET(request) {
  try {
    const db = await getDb();
    const todayKey = getDateKey(new Date());

    const currentUser = await getUserFromRequest(request.headers);
    const currentUserId = currentUser?.id ? String(currentUser.id) : null;

    // Fetch REAL users strictly from the better-auth `user` collection
    const users = await db.collection("user").find({}).toArray();

    // Fetch all real tasks
    const allTasks = await db.collection("tasks").find({}).toArray();

    // Map tasks by user ID
    const tasksByUser = new Map();
    allTasks.forEach((t) => {
      const uId = String(t.userId);
      if (!tasksByUser.has(uId)) tasksByUser.set(uId, []);
      tasksByUser.get(uId).push({
        id: t._id ? t._id.toString() : String(t.id),
        title: t.title,
        tag: t.tag || "General",
        reward: Number(t.reward) || 15,
        done: Boolean(t.done),
        time: t.time || "Today",
        date: t.date || todayKey,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      });
    });

    const communityProfiles = users.map((u) => {
      const uIdStr = u._id.toString();
      const userTasks = tasksByUser.get(uIdStr) || [];

      // Filter tasks for today
      const todayTasks = userTasks.filter((t) => t.date === todayKey);
      const todayDone = todayTasks.filter((t) => t.done).length;
      const todayTotal = todayTasks.length;
      const todayProgress =
        todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

      // Calculate all-time completed tasks
      const allTimeCompleted = userTasks.filter((t) => t.done).length;

      // Group tasks by date for real accountability history
      const historyByDate = new Map();
      userTasks.forEach((t) => {
        const d = t.date;
        if (!d) return;
        if (!historyByDate.has(d)) {
          historyByDate.set(d, { date: d, completed: 0, total: 0 });
        }
        const record = historyByDate.get(d);
        record.total += 1;
        if (t.done) record.completed += 1;
      });

      const history = Array.from(historyByDate.values())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);

      // Monthly streak calculation: consecutive completed days within current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      let calculatedStreak = 0;
      let checkDate = new Date(now);

      const todayRecord = historyByDate.get(getDateKey(checkDate));
      if (todayRecord && todayRecord.completed > 0) {
        calculatedStreak += 1;
        checkDate = addDays(checkDate, -1);
      } else {
        const yesterdayRecord = historyByDate.get(getDateKey(addDays(checkDate, -1)));
        if (yesterdayRecord && yesterdayRecord.completed > 0) {
          checkDate = addDays(checkDate, -1);
        }
      }

      while (
        checkDate.getFullYear() === currentYear &&
        checkDate.getMonth() === currentMonth
      ) {
        const key = getDateKey(checkDate);
        const record = historyByDate.get(key);
        if (record && record.completed > 0) {
          calculatedStreak += 1;
          checkDate = addDays(checkDate, -1);
        } else {
          break;
        }
      }

      const streakVal = u.streak ?? calculatedStreak;
      const isYou = currentUserId ? uIdStr === currentUserId : false;

      let status = "steady";
      if (todayProgress === 100 && todayTotal > 0) {
        status = "completed";
      } else if (streakVal >= 3) {
        status = "on-fire";
      } else if (todayTotal > 0 && todayDone === 0) {
        status = "in-progress";
      }

      return {
        id: uIdStr,
        name: u.name || "Member",
        email: u.email || "",
        image: u.image || null,
        initials: (u.name || "MEM")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 3),
        role: u.role || (isYou ? "You" : "Community Member"),
        bio: u.bio || "",
        streak: streakVal,
        bestStreak: Math.max(u.bestStreak ?? 0, streakVal),
        allTimeCompleted,
        coins: u.coins ?? 0,
        fines: u.unpaidFines ?? 0,
        status,
        todayTasks,
        todayDone,
        todayTotal,
        todayProgress,
        allTasks: userTasks,
        history,
        isYou,
      };
    });

    // Sort by leaderboard criteria: highest streak, then today completed, then all-time completed
    communityProfiles.sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      if (b.todayDone !== a.todayDone) return b.todayDone - a.todayDone;
      return b.allTimeCompleted - a.allTimeCompleted;
    });

    // Assign rank
    const rankedProfiles = communityProfiles.map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));

    // Stats
    const totalMembers = rankedProfiles.length;
    const totalTasksToday = rankedProfiles.reduce(
      (sum, p) => sum + p.todayTotal,
      0,
    );
    const totalDoneToday = rankedProfiles.reduce(
      (sum, p) => sum + p.todayDone,
      0,
    );
    const avgCompletion =
      totalTasksToday > 0
        ? Math.round((totalDoneToday / totalTasksToday) * 100)
        : 0;
    const maxStreak = Math.max(0, ...rankedProfiles.map((p) => p.streak));

    return NextResponse.json({
      members: rankedProfiles,
      currentUserId,
      stats: {
        totalMembers,
        totalTasksToday,
        totalDoneToday,
        avgCompletion,
        maxStreak,
      },
    });
  } catch (err) {
    console.error("Community GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
