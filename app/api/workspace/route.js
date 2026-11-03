import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/db";
import { ObjectId } from "mongodb";
import { ECONOMY } from "@/app/lib/economy";
import { canChangeDueTime, getDateKey, getNextDueTimeUnlockDate } from "@/app/lib/utils";

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

    // Fetch authentic user fines and transactions
    const fines = await db
      .collection("fines")
      .find({ userId: idStr })
      .sort({ createdAt: -1 })
      .toArray();

    const transactions = await db
      .collection("transactions")
      .find({ userId: idStr })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const unpaidFinesList = fines.filter((f) => f.status === "unpaid");
    const earnedCoins = userDoc?.earnedCoins ?? (userDoc?.coins ?? 0);
    const purchasedCoins = userDoc?.purchasedCoins ?? 0;
    const totalCoins = earnedCoins + purchasedCoins;

    const rawUserRequests = await db
      .collection("coin_requests")
      .find({ userId: idStr })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const paymentRequests = rawUserRequests.map((r) => ({
      ...r,
      id: r._id.toString(),
    }));

    const userRole = userDoc?.role || (user.email === "nuddintanim@gmail.com" ? "owner" : "member");

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
        role: userRole,
        bio: userDoc?.bio || "",
        preferences: userDoc?.preferences || {
          digest: true,
          reminders: true,
          publicProfile: true,
        },
        coins: totalCoins,
        earnedCoins,
        purchasedCoins,
        hearts: userDoc?.hearts ?? 0,
        autoPayFines: Boolean(userDoc?.autoPayFines),
        lastPhoenixAt: userDoc?.lastPhoenixAt || null,
        probationUntil: userDoc?.probationUntil || null,
        streak: monthlyStreak,
        bestStreak: Math.max(userDoc?.bestStreak ?? 0, monthlyStreak),
        unpaidFines: unpaidFinesList.length,
        finishedMode: userDoc?.finishedMode ?? "section",
        dueTime: userDoc?.dueTime || "6:00 AM",
        dueHour: typeof userDoc?.dueHour === "number" ? userDoc.dueHour : 6,
        dueTimeChangedAt: userDoc?.dueTimeChangedAt || null,
        canChangeDueTime: canChangeDueTime(userDoc?.dueTimeChangedAt),
        nextDueTimeUnlockDate: getNextDueTimeUnlockDate(userDoc?.dueTimeChangedAt),
        createdAt: userDoc?.createdAt || new Date().toISOString(),
      },
      tasks: tasks.map((t) => ({ ...t, id: t._id.toString() })),
      fines: fines.map((f) => ({ ...f, id: f._id.toString() })),
      transactions: transactions.map((tx) => ({ ...tx, id: tx._id.toString() })),
      paymentRequests,
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

    // 1. Buy Heart (80 Coins, Max 3)
    if (action === "buy-heart") {
      const existing = await db.collection("user").findOne(userFilter);
      const currentHearts = existing?.hearts ?? 0;
      if (currentHearts >= ECONOMY.maxHearts) {
        return NextResponse.json(
          { error: `You already hold the maximum of ${ECONOMY.maxHearts} Hearts.` },
          { status: 400 },
        );
      }

      const earned = existing?.earnedCoins ?? (existing?.coins ?? 0);
      const purchased = existing?.purchasedCoins ?? 0;
      const total = earned + purchased;
      if (total < ECONOMY.heartCost) {
        return NextResponse.json(
          { error: `Insufficient coins. A Heart costs ${ECONOMY.heartCost} coins.` },
          { status: 400 },
        );
      }

      // Spend earned coins first, then purchased coins
      let newEarned = earned;
      let newPurchased = purchased;
      if (newEarned >= ECONOMY.heartCost) {
        newEarned -= ECONOMY.heartCost;
      } else {
        const remainder = ECONOMY.heartCost - newEarned;
        newEarned = 0;
        newPurchased -= remainder;
      }

      const now = new Date().toISOString();
      const updatedHearts = currentHearts + 1;
      await db.collection("user").updateOne(userFilter, {
        $set: {
          earnedCoins: newEarned,
          purchasedCoins: newPurchased,
          coins: newEarned + newPurchased,
          hearts: updatedHearts,
          updatedAt: now,
        },
      });

      await db.collection("transactions").insertOne({
        userId: user.id,
        type: "buy-heart",
        amount: -ECONOMY.heartCost,
        label: "Purchased Heart (Permanent Wealth Vault)",
        date: getDateKey(new Date()),
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        hearts: updatedHearts,
        earnedCoins: newEarned,
        purchasedCoins: newPurchased,
        coins: newEarned + newPurchased,
      });
    }

    // 2. Pay or Waive Fine (Coins or Heart)
    if (action === "pay-fine") {
      const { fineId, method } = payload || {};
      const fineFilter = {
        userId: user.id,
        ...(ObjectId.isValid(fineId) ? { _id: new ObjectId(fineId) } : { id: fineId }),
      };

      const fine = await db.collection("fines").findOne(fineFilter);
      if (!fine || fine.status !== "unpaid") {
        return NextResponse.json(
          { error: "Fine not found or already settled." },
          { status: 400 },
        );
      }

      const existing = await db.collection("user").findOne(userFilter);
      const now = new Date().toISOString();

      if (method === "heart") {
        const currentHearts = existing?.hearts ?? 0;
        if (currentHearts < 1) {
          return NextResponse.json(
            { error: "No Hearts available in your vault." },
            { status: 400 },
          );
        }

        await db.collection("user").updateOne(userFilter, {
          $inc: { hearts: -1 },
          $set: { updatedAt: now },
        });

        await db.collection("fines").updateOne(fineFilter, {
          $set: { status: "waived", waivedAt: now, method: "heart" },
        });

        await db.collection("transactions").insertOne({
          userId: user.id,
          type: "heart-waive",
          amount: 0,
          label: `Waived fine for "${fine.title || "Missed task"}" using Heart`,
          date: getDateKey(new Date()),
          createdAt: now,
        });

        return NextResponse.json({
          success: true,
          method: "heart",
          fineId,
          hearts: Math.max(0, currentHearts - 1),
        });
      }

      // Paying with 50 coins
      const earned = existing?.earnedCoins ?? (existing?.coins ?? 0);
      const purchased = existing?.purchasedCoins ?? 0;
      const total = earned + purchased;
      const fineCost = fine.amount || ECONOMY.finePerMissedTask;

      if (total < fineCost) {
        return NextResponse.json(
          { error: `Insufficient coins. Paying this fine requires ${fineCost} coins.` },
          { status: 400 },
        );
      }

      let newEarned = earned;
      let newPurchased = purchased;
      if (newEarned >= fineCost) {
        newEarned -= fineCost;
      } else {
        const remainder = fineCost - newEarned;
        newEarned = 0;
        newPurchased -= remainder;
      }

      await db.collection("user").updateOne(userFilter, {
        $set: {
          earnedCoins: newEarned,
          purchasedCoins: newPurchased,
          coins: newEarned + newPurchased,
          updatedAt: now,
        },
      });

      await db.collection("fines").updateOne(fineFilter, {
        $set: { status: "paid", paidAt: now, method: "coins" },
      });

      await db.collection("transactions").insertOne({
        userId: user.id,
        type: "fine-payment",
        amount: -fineCost,
        label: `Paid fine for "${fine.title || "Missed task"}"`,
        date: getDateKey(new Date()),
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        method: "coins",
        fineId,
        earnedCoins: newEarned,
        purchasedCoins: newPurchased,
        coins: newEarned + newPurchased,
      });
    }

    // 3. Toggle Auto-Pay Fines Setting
    if (action === "toggle-auto-pay") {
      const { enabled } = payload || {};
      const now = new Date().toISOString();
      await db.collection("user").updateOne(userFilter, {
        $set: { autoPayFines: Boolean(enabled), updatedAt: now },
      });
      return NextResponse.json({ success: true, autoPayFines: Boolean(enabled) });
    }

    // 4. Activate Phoenix Protocol (Comeback Fresh Start)
    if (action === "activate-phoenix") {
      const existing = await db.collection("user").findOne(userFilter);
      const unpaidFines = await db.collection("fines").find({ userId: user.id, status: "unpaid" }).toArray();

      if (unpaidFines.length < 3) {
        return NextResponse.json(
          { error: "Phoenix Fresh Start is reserved for members with 3 or more unpaid fines." },
          { status: 400 },
        );
      }

      const now = new Date();
      if (existing?.lastPhoenixAt) {
        const lastDate = new Date(existing.lastPhoenixAt);
        const daysDiff = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        if (daysDiff < ECONOMY.phoenixCooldownDays) {
          const remaining = Math.ceil(ECONOMY.phoenixCooldownDays - daysDiff);
          return NextResponse.json(
            { error: `Phoenix Protocol is on cooldown. Available again in ${remaining} days.` },
            { status: 400 },
          );
        }
      }

      const nowIso = now.toISOString();
      const probationEnd = new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString();

      // Waive all unpaid fines
      await db.collection("fines").updateMany(
        { userId: user.id, status: "unpaid" },
        { $set: { status: "waived", waivedAt: nowIso, waivedReason: "phoenix" } },
      );

      // Reset coins to 25 starter coins and activate 3-day probation
      await db.collection("user").updateOne(userFilter, {
        $set: {
          earnedCoins: ECONOMY.phoenixStarterCoins,
          coins: ECONOMY.phoenixStarterCoins + (existing?.purchasedCoins || 0),
          lastPhoenixAt: nowIso,
          probationUntil: probationEnd,
          streak: 0,
          updatedAt: nowIso,
        },
      });

      await db.collection("transactions").insertOne({
        userId: user.id,
        type: "phoenix",
        amount: ECONOMY.phoenixStarterCoins,
        label: "Phoenix Protocol Fresh Start (+25 Starter Coins)",
        date: getDateKey(now),
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        coins: ECONOMY.phoenixStarterCoins + (existing?.purchasedCoins || 0),
        earnedCoins: ECONOMY.phoenixStarterCoins,
        probationUntil: probationEnd,
      });
    }

    // 5. Settle Overdue Tasks (Daily Cutoff Missed Task Accounting)
    if (action === "settle-missed-tasks") {
      const { todayKey } = payload || {};
      if (!todayKey) {
        return NextResponse.json({ error: "todayKey is required" }, { status: 400 });
      }

      const existing = await db.collection("user").findOne(userFilter);
      const pastUnfinishedTasks = await db.collection("tasks").find({
        userId: user.id,
        date: { $lt: todayKey },
        done: false,
      }).toArray();

      if (pastUnfinishedTasks.length === 0) {
        return NextResponse.json({ success: true, createdFines: 0 });
      }

      const existingFines = await db.collection("fines").find({ userId: user.id }).toArray();
      const finedTaskIds = new Set(existingFines.map((f) => f.taskId));
      const now = new Date().toISOString();
      const newFines = [];

      for (const task of pastUnfinishedTasks) {
        const taskIdStr = task._id.toString();
        if (finedTaskIds.has(taskIdStr) || finedTaskIds.has(task.id)) continue;

        newFines.push({
          userId: user.id,
          taskId: taskIdStr,
          dayId: task.date,
          title: task.title,
          amount: ECONOMY.finePerMissedTask,
          status: "unpaid",
          createdAt: now,
          paidAt: null,
          waivedAt: null,
        });
      }

      if (newFines.length > 0) {
        await db.collection("fines").insertMany(newFines);
      }

      // If user has autoPayFines enabled, automatically pay as many as possible
      if (existing?.autoPayFines && newFines.length > 0) {
        let earned = existing.earnedCoins ?? (existing.coins ?? 0);
        let purchased = existing.purchasedCoins ?? 0;
        let total = earned + purchased;
        const fineCost = ECONOMY.finePerMissedTask;

        for (const fine of newFines) {
          if (total >= fineCost) {
            if (earned >= fineCost) {
              earned -= fineCost;
            } else {
              const rem = fineCost - earned;
              earned = 0;
              purchased -= rem;
            }
            total = earned + purchased;

            await db.collection("fines").updateOne(
              { userId: user.id, taskId: fine.taskId },
              { $set: { status: "paid", paidAt: now, method: "autopay" } },
            );

            await db.collection("transactions").insertOne({
              userId: user.id,
              type: "fine-payment",
              amount: -fineCost,
              label: `Auto-paid fine for "${fine.title}"`,
              date: todayKey,
              createdAt: now,
            });
          }
        }

        await db.collection("user").updateOne(userFilter, {
          $set: {
            earnedCoins: earned,
            purchasedCoins: purchased,
            coins: total,
            updatedAt: now,
          },
        });
      }

      return NextResponse.json({ success: true, createdFines: newFines.length });
    }

    // 6. Submit Manual bKash Payment Request
    if (action === "submit-payment-request") {
      const { packId, coins, tk, packLabel, bkashNumber, senderName, trxId, note } = payload || {};
      if (!packId || !coins || !tk || !bkashNumber || !senderName || !trxId) {
        return NextResponse.json(
          { error: "Sender bKash number, Sender Name, and Transaction ID (TrxID) are required." },
          { status: 400 },
        );
      }

      const cleanTrx = String(trxId).trim().toUpperCase();
      const existingTrx = await db.collection("coin_requests").findOne({ trxId: cleanTrx });
      if (existingTrx) {
        return NextResponse.json(
          { error: "This Transaction ID (TrxID) has already been submitted." },
          { status: 400 },
        );
      }

      const nowIso = new Date().toISOString();
      const newRequest = {
        userId: idStr,
        userEmail: user.email,
        userName: userDoc?.name || user.name || "Member",
        userImage: userDoc?.image || user.image || null,
        packId: String(packId),
        packLabel: String(packLabel || `${coins} Coins Pack`),
        requestedCoins: Number(coins),
        tk: Number(tk),
        bkashNumber: String(bkashNumber).trim(),
        senderName: String(senderName).trim(),
        trxId: cleanTrx,
        note: note ? String(note).trim() : "",
        status: "pending",
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const insertResult = await db.collection("coin_requests").insertOne(newRequest);
      return NextResponse.json({
        success: true,
        message: "Payment request submitted. Our team will verify and credit your coins shortly.",
        request: { ...newRequest, id: insertResult.insertedId.toString() },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Workspace POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
