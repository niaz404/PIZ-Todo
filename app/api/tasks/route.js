import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/db";
import { ObjectId } from "mongodb";
import { getDateKey } from "@/app/lib/utils";

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
      userId: userIdStr,
      date: body.date || todayKey,
      title,
      tag: body.tag || "Personal",
      reward: Number(body.reward) || 15,
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

    const userFilter = {
      userId: String(user.id),
      $or: filters,
    };

    const updateFields = { ...patch, updatedAt: new Date().toISOString() };
    const updateResult = await db.collection("tasks").updateOne(userFilter, { $set: updateFields });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    const updatedTask = await db.collection("tasks").findOne(userFilter);
    return NextResponse.json({
      success: true,
      task: updatedTask ? { ...updatedTask, id: updatedTask._id.toString() } : null,
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

    const userFilter = {
      userId: String(user.id),
      $or: filters,
    };

    const deleteResult = await db.collection("tasks").deleteOne(userFilter);
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Task deletion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
