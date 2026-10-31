"use client";

import { ChevronRight, Coins, CornerDownRight } from "./icons";
import TaskStatusCircle from "./TaskStatusCircle";

export default function TaskRow({
  task,
  onToggle,
  onOpen,
  dateLabel,
  variant = "default",
  showReward = true,
  surface = "raised",
}) {
  const done = task.done || variant === "completed";
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const hasSubtasks = subtasks.length > 0;
  const clickable = typeof onOpen === "function";
  const surfaceClass =
    surface === "raised"
      ? "neu-soft neu-hover"
      : "hover:bg-panel-2 transition-colors duration-300";

  const handleKeyDown = (event) => {
    if (!clickable || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(task.id);
    }
  };

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onOpen(task.id) : undefined}
      onKeyDown={handleKeyDown}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${surfaceClass} ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      {hasSubtasks ? (
        <TaskStatusCircle task={task} size={24} readOnly />
      ) : (
        <TaskStatusCircle task={task} size={24} onToggle={onToggle} />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] font-medium transition-colors duration-300 ${
            done
              ? "text-muted/90 line-through decoration-faint/50"
              : "text-ink"
          }`}
        >
          {task.title}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.13em] text-faint">
          <span className={done ? "text-faint" : "text-accent/90"}>
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

      {showReward ? (
        <span
          className={`flex shrink-0 items-center gap-1 text-[10px] tabular-nums ${
            done ? "text-faint" : "text-accent/80"
          }`}
        >
          <Coins className="size-3" />
          {task.reward}
        </span>
      ) : null}

      {clickable ? (
        <ChevronRight className="size-3.5 shrink-0 text-faint/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-faint" />
      ) : null}
    </div>
  );
}
