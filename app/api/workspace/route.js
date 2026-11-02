import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/db";
import { ObjectId } from "mongodb";
import { ECONOMY } from "@/app/lib/economy";
import { canChangeDueTime, getNextDueTimeUnlockDate } from "@/app/lib/utils";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user) {
      return NextResponse.json({
        user: null,
        tasks: [],
        fines: [],
        transactions: [],
      });
    }

    const db = await getDb();

    let userFilter;
    try {
      userFilter = { _id: new ObjectId(user.id) };
    } catch {
      userFilter = { _id: user.id };
    }

    let userDoc = await db.collection("user").findOne(userFilter);
    if (!userDoc && user.id !== "guest_user") {
      userDoc = await db.collection("user").findOne({ email: user.email });
    }

    const idStr = userDoc ? userDoc._id.toString() : String(user.id);

    // Ensure oauthImage is saved if user has a google image
    const oauthImage =
      userDoc?.oauthImage ||
      (userDoc?.image && !userDoc.image.includes("api.dicebear.com")
        ? userDoc.image
        : null) ||
      (user?.image && !user.image.includes("api.dicebear.com")
        ? user.image
        : null);

    if (userDoc && !userDoc.oauthImage && oauthImage) {
      await db.collection("user").updateOne(userFilter, {
        $set: { oauthImage },
      });
    }

    // Retrieve real tasks for this user
    const tasks = await db
      .collection("tasks")
      .find({
        $or: [
          { userId: idStr },
          ...(ObjectId.isValid(idStr) ? [{ userId: new ObjectId(idStr) }] : []),
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate current month streak from real completed tasks in db
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const yStr = String(currentYear);
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const todayNum = now.getDate();
    const todayKey = `${yStr}-${mStr}-${String(todayNum).padStart(2, "0")}`;

    const datesWithCompletedTasks = new Set(
      tasks.filter((t) => t.done && t.date).map((t) => t.date),
    );

    let monthlyStreak = 0;
    let checkDay = datesWithCompletedTasks.has(todayKey) ? todayNum : todayNum - 1;

    while (checkDay >= 1) {
      const key = `${yStr}-${mStr}-${String(checkDay).padStart(2, "0")}`;
      if (datesWithCompletedTasks.has(key)) {
        monthlyStreak += 1;
        checkDay -= 1;
      } else {
        break;
      }
    }

    const realStreak = userDoc?.streak ?? monthlyStreak;

    return NextResponse.json({
      user: {
        id: idStr,
        name: userDoc?.name || user.name || "Member",
        email: userDoc?.email || user.email || "",
        image: userDoc?.image || user.image || null,
        oauthImage: oauthImage || null,
        initials: (userDoc?.name || user.name || "MEM")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 3),
        role: userDoc?.role || "Member",
        bio: userDoc?.bio || "",
        preferences: userDoc?.preferences || {
          digest: true,
          reminders: true,
          publicProfile: true,
        },
        coins: userDoc?.coins ?? 0,
        streak: monthlyStreak,
        bestStreak: Math.max(userDoc?.bestStreak ?? 0, monthlyStreak),
        unpaidFines: userDoc?.unpaidFines ?? 0,
        finishedMode: userDoc?.finishedMode ?? "section",
        dueTime: userDoc?.dueTime || "12:00 AM",
        dueHour: typeof userDoc?.dueHour === "number" ? userDoc.dueHour : 0,
        dueTimeChangedAt: userDoc?.dueTimeChangedAt || null,
        canChangeDueTime: canChangeDueTime(userDoc?.dueTimeChangedAt),
        nextDueTimeUnlockDate: getNextDueTimeUnlockDate(userDoc?.dueTimeChangedAt),
        createdAt: userDoc?.createdAt || new Date().toISOString(),
      },
      tasks: tasks.map((t) => ({ ...t, id: t._id.toString() })),
      fines: [],
      transactions: [],
    });
  } catch (err) {
    console.error("Workspace GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user || user.id === "guest_user") {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    const db = await getDb();
    const body = await request.json();
    const { action, payload } = body;

    let userFilter;
    try {
      userFilter = { _id: new ObjectId(user.id) };
    } catch {
      userFilter = { _id: user.id };
    }

    if (action === "sync-state") {
      const { finishedMode } = payload;
      await db.collection("user").updateOne(
        userFilter,
        {
          $set: {
            finishedMode: finishedMode || "section",
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: false },
      );
      return NextResponse.json({ success: true });
    }

    if (action === "update-profile") {
      const { name, role, bio, preferences, image, resetToOAuth } = payload;
      const updateData = { updatedAt: new Date().toISOString() };

      if (typeof name === "string" && name.trim()) {
        updateData.name = name.trim();
      }
      if (typeof role === "string") updateData.role = role.trim();
      if (typeof bio === "string") updateData.bio = bio.trim();
      if (preferences && typeof preferences === "object") {
        updateData.preferences = preferences;
      }

      if (resetToOAuth) {
        const existing = await db.collection("user").findOne(userFilter);
        const targetImage = existing?.oauthImage || (user.image && !user.image.includes("api.dicebear.com") ? user.image : null);
        if (targetImage) {
          updateData.image = targetImage;
        }
      } else if (typeof image === "string" && image.trim()) {
        updateData.image = image.trim();
      }

      await db.collection("user").updateOne(
        userFilter,
        { $set: updateData },
        { upsert: false },
      );

      const updatedUser = await db.collection("user").findOne(userFilter);
      return NextResponse.json({
        success: true,
        user: updatedUser
          ? {
              id: updatedUser._id.toString(),
              name: updatedUser.name,
              email: updatedUser.email,
              image: updatedUser.image,
              oauthImage: updatedUser.oauthImage || null,
              role: updatedUser.role,
              bio: updatedUser.bio,
              preferences: updatedUser.preferences,
            }
          : null,
      });
    }

    if (action === "update-due-time") {
      const { dueTime, dueHour } = payload || {};
      const existing = await db.collection("user").findOne(userFilter);
      if (!canChangeDueTime(existing?.dueTimeChangedAt)) {
        return NextResponse.json({
          error: `Due cutoff time is locked until ${getNextDueTimeUnlockDate(existing?.dueTimeChangedAt)}. You can only change it once per month.`,
        }, { status: 400 });
      }

      const validHours = [0, 3, 6, 9, 12, 15, 18, 21];
      const parsedHour = Number(dueHour);
      if (!validHours.includes(parsedHour) || !dueTime) {
        return NextResponse.json({ error: "Invalid due time selection" }, { status: 400 });
      }

      const now = new Date().toISOString();
      await db.collection("user").updateOne(userFilter, {
        $set: {
          dueTime: String(dueTime),
          dueHour: parsedHour,
          dueTimeChangedAt: now,
          updatedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        dueTime: String(dueTime),
        dueHour: parsedHour,
        dueTimeChangedAt: now,
        canChangeDueTime: false,
        nextDueTimeUnlockDate: getNextDueTimeUnlockDate(now),
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Workspace POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
