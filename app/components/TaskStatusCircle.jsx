"use client";

import { Check } from "./icons";

export default function TaskStatusCircle({
  task,
  size = 24,
  readOnly = false,
  expanded = false,
  onToggle,
  onExpand,
}) {
  const subtasks = task.subtasks ?? [];
  const hasSubtasks = subtasks.length > 0;
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const percent = hasSubtasks
    ? Math.round((doneSubtasks / subtasks.length) * 100)
    : task.done
      ? 100
      : 0;
  const isDone = hasSubtasks ? percent === 100 : Boolean(task.done);
  const checkClass = size > 28 ? "size-4" : "size-3.5";

  if (!hasSubtasks) {
    const className = `grid shrink-0 place-items-center rounded-full transition-all duration-300 ${
      isDone
        ? "bg-accent text-[#17130c] shadow-[0_2px_5px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]"
        : "neu-inset-soft text-transparent hover:text-faint"
    }`;
    const label = isDone
      ? `Reopen "${task.title}"`
      : `Complete "${task.title}"`;
    const content = <Check className={checkClass} strokeWidth={2.8} />;

    if (readOnly) {
      return (
        <span
          className={className}
          style={{ width: size, height: size }}
          role="img"
          aria-label={isDone ? "Completed" : "Not completed"}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onToggle?.(task.id)}
        aria-pressed={isDone}
        aria-label={label}
        title={label}
        className={className}
        style={{ width: size, height: size }}
      >
        {content}
      </button>
    );
  }

  if (isDone) {
    const className =
      "grid shrink-0 place-items-center rounded-full bg-accent text-[#17130c] shadow-[0_2px_5px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]";
    const label = `Manage subtasks for "${task.title}" (${doneSubtasks} of ${subtasks.length} complete)`;
    const content = <Check className={checkClass} strokeWidth={2.8} />;

    if (readOnly) {
      return (
        <span
          className={className}
          style={{ width: size, height: size }}
          role="img"
          aria-label={`${doneSubtasks} of ${subtasks.length} subtasks complete`}
        >
          {content}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={expanded}
        aria-label={label}
        title="Manage subtasks"
        className={className}
        style={{ width: size, height: size }}
      >
        {content}
      </button>
    );
  }

  const stroke = Math.max(2, Math.round(size * 0.11));
  const radius = (size - stroke) / 2 - 1.5;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const className =
    "neu-inset-soft relative grid shrink-0 place-items-center rounded-full text-accent";

  const ring = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgb(255 255 255 / 0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--neu-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: "stroke-dashoffset 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </svg>
  );

  const label = `Manage subtasks for "${task.title}" (${doneSubtasks} of ${subtasks.length} complete)`;

  if (readOnly) {
    return (
      <span
        className={className}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${doneSubtasks} of ${subtasks.length} subtasks complete`}
      >
        {ring}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-expanded={expanded}
      aria-label={label}
      title="Manage subtasks"
      className={className}
      style={{ width: size, height: size }}
    >
      {ring}
    </button>
  );
}
