"use client";

import { useState } from "react";
import { Check, CornerDownRight, Pencil, Plus, Trash2, X } from "./icons";
import { useWorkspace } from "./Providers";
import { ECONOMY } from "../lib/economy";

export default function SubtaskManager({ task, compact = false }) {
  const { addSubtask, toggleSubtask, updateSubtask, deleteSubtask } =
    useWorkspace();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;

  const handleAdd = (event) => {
    event.preventDefault();
    if (!draft.trim()) return;
    addSubtask(task.id, draft);
    setDraft("");
  };

  const startEditing = (subtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveEditing = () => {
    if (!editingId) return;
    if (!editingTitle.trim()) {
      cancelEditing();
      return;
    }
    const saved = updateSubtask(task.id, editingId, editingTitle);
    if (saved === false) return;
    cancelEditing();
  };

  const handleEditKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEditing();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const textSize = compact ? "text-[11px]" : "text-xs";
  const rowPadding = compact ? "px-1.5 py-1.5" : "px-2 py-2";
  const iconSize = compact ? "size-3" : "size-3.5";
  const actionSize = compact ? "size-6" : "size-7";
  const checkSize = compact ? "size-2.5" : "size-3";
  const circleSize = compact ? "size-4" : "size-5";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-faint">
          <CornerDownRight className="size-3 text-accent/70" />
          Subtasks
        </span>
        <span className="text-[10px] tabular-nums text-faint">
          {doneSubtasks} / {subtasks.length}
        </span>
      </div>

      <div className={compact ? "mt-2 space-y-0.5" : "mt-3 space-y-1"}>
        {subtasks.map((subtask) => {
          const editing = editingId === subtask.id;

          return (
            <div
              key={subtask.id}
              className={`group/sub flex items-center gap-2 rounded-lg transition-colors duration-200 hover:bg-white/[0.035] ${rowPadding}`}
            >
              <button
                type="button"
                onClick={() => toggleSubtask(task.id, subtask.id)}
                aria-pressed={subtask.done}
                aria-label={`Mark "${subtask.title}" as ${
                  subtask.done ? "incomplete" : "complete"
                }`}
                className={`grid shrink-0 place-items-center rounded-full transition-all duration-300 ${circleSize} ${
                  subtask.done
                    ? "bg-accent text-[#17130c] shadow-[0_2px_5px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]"
                    : "neu-inset-soft text-transparent hover:text-faint"
                }`}
              >
                <Check className={checkSize} strokeWidth={2.8} />
              </button>

              {editing ? (
                <>
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onKeyDown={handleEditKeyDown}
                    aria-label={`Edit subtask "${subtask.title}"`}
                    className={`min-w-0 flex-1 rounded-md bg-app/50 px-2 py-1 text-ink outline-none ring-1 ring-accent/30 ${textSize}`}
                  />
                  <button
                    type="button"
                    onClick={saveEditing}
                    aria-label="Save subtask"
                    title="Save subtask"
                    className={`grid ${actionSize} shrink-0 place-items-center rounded-md text-success transition-colors hover:bg-white/[0.06]`}
                  >
                    <Check className={iconSize} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    aria-label="Cancel editing"
                    title="Cancel"
                    className={`grid ${actionSize} shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-white/[0.06] hover:text-ink`}
                  >
                    <X className={iconSize} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`min-w-0 flex-1 truncate ${textSize} ${
                      subtask.done
                        ? "text-faint line-through decoration-faint/50"
                        : "text-muted"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditing(subtask)}
                    aria-label={`Edit subtask "${subtask.title}"`}
                    title="Edit subtask"
                    className={`grid ${actionSize} shrink-0 place-items-center rounded-md text-faint/70 transition-all duration-200 hover:bg-white/[0.06] hover:text-ink group-hover/sub:text-faint`}
                  >
                    <Pencil className={iconSize} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    aria-label={`Delete subtask "${subtask.title}"`}
                    title="Delete subtask"
                    className={`grid ${actionSize} shrink-0 place-items-center rounded-md text-faint/70 transition-all duration-200 hover:bg-white/[0.06] hover:text-danger group-hover/sub:text-faint`}
                  >
                    <Trash2 className={iconSize} />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {subtasks.length === 0 ? (
          <p
            className={`rounded-lg px-2 py-1.5 text-faint ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
          >
            No subtasks yet. Add the first step below.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleAdd}
        className={`neu-inset relative mt-2 flex items-center gap-2 rounded-xl p-1 pl-2.5 ${
          compact ? "" : "mt-3"
        }`}
      >
        <Plus className="size-3 shrink-0 text-faint" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a subtask"
          aria-label={`Add a subtask to "${task.title}"`}
          className={`peer min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-faint ${
            compact ? "py-1.5 text-[11px]" : "py-2 text-xs"
          }`}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Add subtask"
          className="neu-button grid size-6 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-3" />
        </button>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent transition duration-200 peer-focus:ring-accent/40"
        />
      </form>
    </div>
  );
}
