import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getDateKey } from "@/app/lib/utils";

const uri =
  process.env.MONGO_URI ||
  "mongodb+srv://tanimDb:7cRMoICFj1sRUM04@niazsshowcase.qanzpdr.mongodb.net/linkup-todo";

let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db("linkup-todo");
}

async function getUserFromRequest(headers) {
  try {
    const session = await auth.api.getSession({ headers });
    return session?.user || null;
  } catch {
    return null;
  }
}

function getSafeRole(userDoc, userEmail) {
  if (userDoc?.role) return String(userDoc.role).toLowerCase();
  if (userEmail === "nuddintanim@gmail.com") return "owner";
  return "member";
}

const STAFF_ROLES = new Set(["owner", "admin", "moderator"]);

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const role = getSafeRole(userDoc, user.email);
    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Access denied. Management portal is restricted to staff." },
        { status: 403 },
      );
    }

    // 1. Fetch coin purchase requests
    const rawRequests = await db
      .collection("coin_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const requests = rawRequests.map((r) => ({
      ...r,
      id: r._id.toString(),
    }));

    // 2. Fetch all members with relevant economy status
    const rawMembers = await db
      .collection("user")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const members = rawMembers.map((m) => {
      const mEmail = m.email || "";
      const mRole = getSafeRole(m, mEmail);
      const earned = m.earnedCoins ?? (m.coins ?? 0);
      const purchased = m.purchasedCoins ?? 0;
      return {
        id: m._id.toString(),
        name: m.name || "Member",
        email: mEmail,
        image: m.image || null,
        role: mRole,
        coins: earned + purchased,
        earnedCoins: earned,
        purchasedCoins: purchased,
        hearts: m.hearts ?? 0,
        unpaidFines: m.unpaidFines ?? 0,
        createdAt: m.createdAt || null,
        bestStreak: m.bestStreak ?? 0,
      };
    });

    // 3. Generate summary reports
    let totalRevenue = 0;
    let totalCoinsGranted = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    for (const req of requests) {
      if (req.status === "approved") {
        totalRevenue += Number(req.tk) || 0;
        totalCoinsGranted += Number(req.grantedCoins ?? req.requestedCoins) || 0;
        approvedCount += 1;
      } else if (req.status === "pending") {
        pendingCount += 1;
      } else if (req.status === "rejected") {
        rejectedCount += 1;
      }
    }

    return NextResponse.json({
      currentUserRole: role,
      requests,
      members,
      reports: {
        totalRevenue,
        totalCoinsGranted,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalMembers: members.length,
      },
    });
  } catch (err) {
    console.error("Manage GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request.headers);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const role = getSafeRole(userDoc, user.email);
    if (!STAFF_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Access denied. Action restricted to staff." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, payload } = body || {};

    // ACTION: APPROVE REQUEST
    if (action === "approve-request") {
      const { requestId, grantedCoins, adminNote } = payload || {};
      if (!requestId) {
        return NextResponse.json({ error: "requestId is required" }, { status: 400 });
      }

      let reqFilter;
      try {
        reqFilter = { _id: new ObjectId(requestId) };
      } catch {
        reqFilter = { _id: requestId };
      }

      const reqDoc = await db.collection("coin_requests").findOne(reqFilter);
      if (!reqDoc) {
        return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
      }

      if (reqDoc.status === "approved") {
        return NextResponse.json({ error: "Request has already been approved." }, { status: 400 });
      }

      const finalCoins = Number(grantedCoins) || reqDoc.requestedCoins || 0;
      const nowIso = new Date().toISOString();

      // Update request status
      await db.collection("coin_requests").updateOne(reqFilter, {
        $set: {
          status: "approved",
          grantedCoins: finalCoins,
          adminNote: adminNote ? String(adminNote).trim() : "",
          reviewedBy: {
            id: userDoc ? userDoc._id.toString() : String(user.id),
            name: userDoc?.name || user.name || "Staff",
            email: user.email,
            role,
          },
          reviewedAt: nowIso,
          updatedAt: nowIso,
        },
      });

      // Credit target user purchased coins
      let targetUserFilter;
      try {
        targetUserFilter = { _id: new ObjectId(reqDoc.userId) };
      } catch {
        targetUserFilter = { _id: reqDoc.userId };
      }

      await db.collection("user").updateOne(targetUserFilter, {
        $inc: {
          purchasedCoins: finalCoins,
          coins: finalCoins,
        },
        $set: {
          updatedAt: nowIso,
        },
      });

      // Record transaction
      const targetIdStr = reqDoc.userId;
      await db.collection("transactions").insertOne({
        userId: targetIdStr,
        type: "purchase",
        amount: finalCoins,
        label: `bKash Top-Up (${reqDoc.packLabel}) · TrxID: ${reqDoc.trxId}`,
        date: getDateKey(new Date()),
        createdAt: nowIso,
        meta: {
          requestId: reqDoc._id.toString(),
          trxId: reqDoc.trxId,
          bkashNumber: reqDoc.bkashNumber,
          tk: reqDoc.tk,
          grantedCoins: finalCoins,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully granted ${finalCoins} coins to user.`,
        grantedCoins: finalCoins,
      });
    }

    // ACTION: REJECT REQUEST
    if (action === "reject-request") {
      const { requestId, rejectionReason } = payload || {};
      if (!requestId) {
        return NextResponse.json({ error: "requestId is required" }, { status: 400 });
      }

      let reqFilter;
      try {
        reqFilter = { _id: new ObjectId(requestId) };
      } catch {
        reqFilter = { _id: requestId };
      }

      const nowIso = new Date().toISOString();
      await db.collection("coin_requests").updateOne(reqFilter, {
        $set: {
          status: "rejected",
          rejectionReason: rejectionReason ? String(rejectionReason).trim() : "Details did not match payment record.",
          reviewedBy: {
            id: userDoc ? userDoc._id.toString() : String(user.id),
            name: userDoc?.name || user.name || "Staff",
            email: user.email,
            role,
          },
          reviewedAt: nowIso,
          updatedAt: nowIso,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment request rejected.",
      });
    }

    // ACTION: UPDATE MEMBER ROLE (Owner and Admin only)
    if (action === "update-member-role") {
      if (role !== "owner" && role !== "admin") {
        return NextResponse.json(
          { error: "Only owners and admins can modify member roles." },
          { status: 403 },
        );
      }

      const { memberId, newRole } = payload || {};
      const validRoles = ["owner", "admin", "moderator", "member"];
      const cleanRole = String(newRole).toLowerCase();

      if (!memberId || !validRoles.includes(cleanRole)) {
        return NextResponse.json({ error: "Invalid role selection." }, { status: 400 });
      }

      let targetFilter;
      try {
        targetFilter = { _id: new ObjectId(memberId) };
      } catch {
        targetFilter = { _id: memberId };
      }

      await db.collection("user").updateOne(targetFilter, {
        $set: {
          role: cleanRole,
          updatedAt: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Member role updated to ${cleanRole}.`,
        newRole: cleanRole,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Manage POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

