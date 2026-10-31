"use client";

import { X } from "./icons";

const tones = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-muted",
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const dotClass = tones[toast.tone] ?? tones.success;

  return (
    <div className="animate-toast-in fixed bottom-5 right-5 z-[70] max-w-[min(300px,calc(100vw-2.5rem))]">
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-[#1b1f26]/95 px-3.5 py-3 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.95)] backdrop-blur-xl"
      >
        <span className={`mt-[5px] size-1.5 shrink-0 rounded-full ${dotClass}`} />

        <div className="min-w-0">
          <p className="text-[11px] font-medium leading-snug text-ink">
            {toast.title}
          </p>
          {toast.description ? (
            <p className="mt-0.5 text-[10px] leading-relaxed text-faint">
              {toast.description}
            </p>
          ) : null}
        </div>

        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onClose?.();
            }}
            className="shrink-0 self-center rounded-md px-1.5 py-1 text-[10px] font-semibold text-accent transition-colors duration-200 hover:bg-white/[0.06] hover:text-accent-strong"
          >
            {toast.action.label ?? "Undo"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="-mr-1.5 -mt-1.5 ml-0.5 grid size-5 shrink-0 place-items-center rounded-md text-faint/60 transition-colors duration-200 hover:bg-white/[0.06] hover:text-ink"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
