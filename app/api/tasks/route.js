import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getDateKey } from "@/app/lib/utils";
import { ECONOMY } from "@/app/lib/economy";

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user || user.id === "guest_user") {
      return NextResponse.json({ error: "Unauthorized. Please sign in to create tasks." }, { status: 401 });
    }
    const db = await getDb();
    const body = await request.json();

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const todayKey = getDateKey(new Date());
    const userIdStr = String(user.id);

    const newTask = {
      id: body.id || `task-${Date.now()}`,
      userId: userIdStr,
      date: body.date || todayKey,
      title,
      tag: body.tag || "Personal",
      reward: Number(body.reward) || ECONOMY.defaultTaskReward,
      time: body.time || "Today",
      done: Boolean(body.done),
      notes: body.notes || "",
      subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const result = await db.collection("tasks").insertOne(newTask);
    const insertedId = result.insertedId.toString();

    return NextResponse.json({
      success: true,
      task: { ...newTask, id: insertedId, _id: insertedId },
    });
  } catch (err) {
    console.error("Task creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user || user.id === "guest_user") {
      return NextResponse.json({ error: "Unauthorized. Please sign in to update tasks." }, { status: 401 });
    }
    const db = await getDb();
    const body = await request.json();
    const { taskId, patch } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const filters = [{ id: String(taskId) }];
    if (ObjectId.isValid(taskId)) {
      filters.push({ _id: new ObjectId(taskId) });
    }

    const userIdStr = String(user.id);
    const userFilter = {
      $and: [
        {
          $or: [
            { userId: userIdStr },
            ...(ObjectId.isValid(userIdStr) ? [{ userId: new ObjectId(userIdStr) }] : []),
          ],
        },
        { $or: filters },
      ],
    };

    const existingTask = await db.collection("tasks").findOne(userFilter);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    const userObjFilter = {
      $or: [
        { _id: userIdStr },
        ...(ObjectId.isValid(userIdStr) ? [{ _id: new ObjectId(userIdStr) }] : []),
      ],
    };

    const now = new Date().toISOString();
    const todayKey = existingTask.date || getDateKey(new Date());

    // 1. Completion logic & 150 daily coin cap
    let coinsEarnedChange = 0;
    if (patch.done === true && !existingTask.done) {
      // Check if task has subtasks and all subtasks are finished
      if (Array.isArray(existingTask.subtasks) && existingTask.subtasks.length > 0) {
        const hasUnfinishedSubtasks = existingTask.subtasks.some((s) => !s.done);
        if (hasUnfinishedSubtasks) {
          return NextResponse.json(
            { error: "Complete all subtasks before checking off the parent task." },
            { status: 400 },
          );
        }
      }

      // Check daily cap (Max 150 coins/day from task rewards)
      const todayRewards = await db.collection("transactions").find({
        userId: userIdStr,
        type: "task-reward",
        date: todayKey,
      }).toArray();
      const alreadyEarnedToday = todayRewards.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      const remainingCap = Math.max(0, ECONOMY.dailyMaxTaskCoins - alreadyEarnedToday);
      const actualReward = Math.min(ECONOMY.defaultTaskReward, remainingCap);

      // Fetch current user document to get existing completedDates & streak
      const userDoc = await db.collection("user").findOne(userObjFilter);
      const prevCompletedDates = new Set(Array.isArray(userDoc?.completedDates) ? userDoc.completedDates : []);
      prevCompletedDates.add(todayKey);

      // Compute updated consecutive streak
      let checkDate = new Date();
      let currentStreak = 0;
      const todayStr = getDateKey(checkDate);
      if (prevCompletedDates.has(todayStr)) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (prevCompletedDates.has(getDateKey(checkDate))) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const bestStreak = Math.max(userDoc?.bestStreak ?? 0, currentStreak);

      // Check 3-Day Consecutive Streak Milestone Bonus (+30 coins)
      let streakBonusGiven = false;
      if (currentStreak >= 3 && currentStreak % 3 === 0) {
        const existingStreakTx = await db.collection("transactions").findOne({
          userId: userIdStr,
          type: "streak-bonus",
          date: todayKey,
        });
        if (!existingStreakTx) {
          streakBonusGiven = true;
          await db.collection("transactions").insertOne({
            userId: userIdStr,
            type: "streak-bonus",
            amount: ECONOMY.streakRewardBonus || 30,
            label: `Streak Milestone Reward (${currentStreak} Days Consecutive!)`,
            date: todayKey,
            createdAt: now,
          });
        }
      }

      const totalEarnedInc = actualReward + (streakBonusGiven ? (ECONOMY.streakRewardBonus || 30) : 0);

      // Update user document in MongoDB with pre-aggregated stats
      await db.collection("user").updateOne(userObjFilter, {
        $inc: {
          earnedCoins: totalEarnedInc,
          coins: totalEarnedInc,
          lifetimeCompleted: 1,
          [`historyByDate.${todayKey}.completed`]: 1,
          [`historyByDate.${todayKey}.earned`]: actualReward,
        },
        $set: {
          streak: currentStreak,
          bestStreak,
          updatedAt: now,
        },
        $addToSet: {
          completedDates: todayKey,
        },
      });

      if (actualReward > 0) {
        await db.collection("transactions").insertOne({
          userId: userIdStr,
          type: "task-reward",
          amount: actualReward,
          label: `Completed "${existingTask.title}"${remainingCap <= actualReward ? " (Daily Cap Reached)" : ""}`,
          date: todayKey,
          createdAt: now,
        });
      }
    } else if (patch.done === false && existingTask.done) {
      // Reopened task: reverse reward
      const revokeAmount = ECONOMY.defaultTaskReward;
      await db.collection("user").updateOne(userObjFilter, {
        $inc: {
          earnedCoins: -revokeAmount,
          coins: -revokeAmount,
          lifetimeCompleted: -1,
          [`historyByDate.${todayKey}.completed`]: -1,
          [`historyByDate.${todayKey}.earned`]: -revokeAmount,
        },
        $set: { updatedAt: now },
      });
      await db.collection("transactions").insertOne({
        userId: userIdStr,
        type: "reopen",
        amount: -revokeAmount,
        label: `Reopened "${existingTask.title}"`,
        date: todayKey,
        createdAt: now,
      });
    }

    // 2. Title edit fee (-2 coins)
    if (typeof patch.title === "string" && patch.title.trim() && patch.title.trim() !== existingTask.title) {
      const editFee = ECONOMY.taskEditCost;
      await db.collection("user").updateOne(userObjFilter, {
        $inc: { earnedCoins: -editFee, coins: -editFee },
        $set: { updatedAt: now },
      });
      await db.collection("transactions").insertOne({
        userId: userIdStr,
        type: "task-edit",
        amount: -editFee,
        label: `Edit fee for "${existingTask.title}"`,
        date: todayKey,
        createdAt: now,
      });
    }

    const updateFields = { ...patch, updatedAt: now };
    delete updateFields._id;
    delete updateFields.id;
    delete updateFields.userId;

    await db.collection("tasks").updateOne(userFilter, { $set: updateFields });

    const updatedTask = await db.collection("tasks").findOne(userFilter);
    return NextResponse.json({
      success: true,
      task: updatedTask ? { ...updatedTask, id: updatedTask._id.toString() } : null,
      coinsEarnedChange,
    });
  } catch (err) {
    console.error("Task update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user || user.id === "guest_user") {
      return NextResponse.json({ error: "Unauthorized. Please sign in to delete tasks." }, { status: 401 });
    }
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const filters = [{ id: String(taskId) }];
    if (ObjectId.isValid(taskId)) {
      filters.push({ _id: new ObjectId(taskId) });
    }

    const userIdStr = String(user.id);
    const userFilter = {
      $and: [
        {
          $or: [
            { userId: userIdStr },
            ...(ObjectId.isValid(userIdStr) ? [{ userId: new ObjectId(userIdStr) }] : []),
          ],
        },
        { $or: filters },
      ],
    };

    const existingTask = await db.collection("tasks").findOne(userFilter);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    const userObjFilter = {
      $or: [
        { _id: userIdStr },
        ...(ObjectId.isValid(userIdStr) ? [{ _id: new ObjectId(userIdStr) }] : []),
      ],
    };

    const now = new Date().toISOString();
    const deleteFee = ECONOMY.taskDeleteCost;

    // Deduct 5 coins delete fee
    await db.collection("user").updateOne(userObjFilter, {
      $inc: { earnedCoins: -deleteFee, coins: -deleteFee },
      $set: { updatedAt: now },
    });
    await db.collection("transactions").insertOne({
      userId: userIdStr,
      type: "task-delete",
      amount: -deleteFee,
      label: `Delete fee for "${existingTask.title}"`,
      date: existingTask.date || getDateKey(new Date()),
      createdAt: now,
    });

    await db.collection("tasks").deleteOne(userFilter);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Task deletion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
