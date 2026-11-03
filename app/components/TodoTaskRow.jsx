"use client";

import { useEffect, useId, useState } from "react";
import {
  Check,
  ChevronDown,
  Coins,
  CornerDownRight,
  Pencil,
  Trash2,
  X,
} from "./icons";
import SubtaskManager from "./SubtaskManager";
import TaskStatusCircle from "./TaskStatusCircle";
import ActionConfirmModal from "./ActionConfirmModal";
import { useWorkspace } from "./Providers";
import { ECONOMY } from "../lib/economy";

export default function TodoTaskRow({
  task,
  onToggle,
  onUpdate,
  onDelete,
  dateLabel,
}) {
  const { coins } = useWorkspace();
  const panelId = `subtasks-${useId().replace(/:/g, "")}`;
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [confirmModal, setConfirmModal] = useState(null);

  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const isDone = Boolean(task.done);
  const editCost = ECONOMY.taskEditCost;
  const deleteCost = isDone
    ? ECONOMY.deleteDoneTaskCost
    : ECONOMY.deleteOpenTaskCost;

  useEffect(() => {
    if (!confirmingDelete) return;

    const timer = setTimeout(() => setConfirmingDelete(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const startEditing = () => {
    setTitleDraft(task.title);
    setEditing(true);
  };

  const cancelEditing = () => {
    setTitleDraft(task.title);
    setEditing(false);
  };

  const saveEditing = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }

    if (trimmed !== task.title) {
      const saved = onUpdate?.(task.id, { title: trimmed });
      if (saved === false) return;
    }
    setEditing(false);
  };

  const handleTitleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEditing();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const handleDelete = () => {
    if (confirmingDelete) {
      const deleted = onDelete?.(task.id);
      if (!deleted) setConfirmingDelete(false);
      return;
    }
    setConfirmingDelete(true);
  };

  return (
    <div
      className={`group rounded-2xl transition-all duration-300 ${
        isDone
          ? "neu-inset-soft opacity-60 hover:opacity-100"
          : "neu-soft"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        <TaskStatusCircle
          task={task}
          size={24}
          expanded={expanded}
          onToggle={onToggle}
          onExpand={() => setExpanded((current) => !current)}
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={handleTitleKeyDown}
                aria-label={`Edit title for "${task.title}"`}
                className="min-w-0 flex-1 rounded-lg bg-app/50 px-2.5 py-1.5 text-[13px] font-medium text-ink outline-none ring-1 ring-accent/30"
              />
              <button
                type="button"
                onClick={saveEditing}
                aria-label="Save task title"
                title="Save title"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-success transition-colors hover:bg-white/[0.06]"
              >
                <Check className="size-3.5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                aria-label="Cancel editing"
                title="Cancel"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <p
              className={`truncate text-[13px] font-medium transition-colors duration-300 ${
                isDone
                  ? "text-muted/90 line-through decoration-faint/50"
                  : "text-ink"
              }`}
            >
              {task.title}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.13em] text-faint">
            <span className={isDone ? "text-faint" : "text-accent/90"}>
              {task.tag}
            </span>
            <span className="size-0.5 rounded-full bg-faint/60" />
            <span>{dateLabel ?? task.time}</span>
            {subtasks.length > 0 ? (
              <>
                <span className="size-0.5 rounded-full bg-faint/60" />
                <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                  <CornerDownRight className="size-3" />
                  {doneSubtasks}/{subtasks.length}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmModal({ type: "edit" })}
                aria-label={`Edit "${task.title}"`}
                title="Edit task (-2 coins)"
                className="grid size-7 place-items-center rounded-lg text-faint/80 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink"
              >
                <Pencil className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmModal({ type: "delete" });
                }}
                aria-label={`Delete "${task.title}"`}
                title="Delete task (-5 coins)"
                className="grid size-7 place-items-center rounded-lg text-faint/80 transition-colors duration-200 hover:bg-white/[0.05] hover:text-danger"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          ) : null}

          <button
            type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={`${
                  expanded ? "Hide" : "Show"
                } subtasks for "${task.title}"`}
                title={expanded ? "Hide subtasks" : "Show subtasks"}
                className={`grid size-9 place-items-center rounded-xl transition-all duration-300 ${
                  expanded
                    ? "neu-inset text-accent"
                    : "neu-button text-muted hover:text-ink"
                }`}
              >
                <ChevronDown
                  className={`size-4 transition-transform duration-300 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>
        </div>
      </div>

      <div
        id={panelId}
        inert={!expanded}
        aria-hidden={!expanded}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mx-3 border-t border-white/[0.06] pb-3 pt-3">
            <SubtaskManager task={task} compact />
          </div>
        </div>
      </div>

      {confirmModal && (
        <ActionConfirmModal
          open={Boolean(confirmModal)}
          type={confirmModal.type}
          taskTitle={task.title}
          cost={confirmModal.type === "edit" ? ECONOMY.taskEditCost : ECONOMY.taskDeleteCost}
          userCoins={coins}
          onConfirm={() => {
            const isEdit = confirmModal.type === "edit";
            setConfirmModal(null);
            if (isEdit) {
              setTitleDraft(task.title);
              setEditing(true);
            } else {
              onDelete?.(task.id);
            }
          }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
