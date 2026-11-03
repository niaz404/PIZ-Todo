"use client";

import { AlertTriangle, Coins, Pencil, Trash2, X } from "./icons";
import { formatCoins } from "../lib/utils";

export default function ActionConfirmModal({
  open,
  type = "edit", // "edit" | "delete"
  taskTitle = "",
  cost = 2,
  userCoins = 0,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDelete = type === "delete";
  const hasEnoughCoins = userCoins >= cost;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in p-4 sm:p-6"
    >
      <div onClick={onCancel} className="fixed inset-0" />

      <div className="flex min-h-full items-center justify-center">
        <div className="neu relative z-10 w-full max-w-md my-auto rounded-[28px] p-6 sm:p-7 shadow-2xl border border-white/[0.06]">
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="neu-button absolute right-4 top-4 grid size-8 place-items-center rounded-xl text-muted hover:text-ink transition-colors"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <span
              className={`neu-inset-soft grid size-11 shrink-0 place-items-center rounded-2xl ${
                isDelete ? "text-danger" : "text-accent"
              }`}
            >
              {isDelete ? <Trash2 className="size-5" /> : <Pencil className="size-5" />}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-semibold">
                Integrity Check
              </p>
              <h2 id="confirm-modal-title" className="font-display text-xl font-normal text-ink mt-0.5">
                {isDelete ? "Confirm Task Deletion" : "Confirm Task Edit"}
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4 rounded-2xl p-4 border border-white/[0.05] bg-white/[0.02]">
            <p className="text-xs text-muted leading-relaxed">
              Target task: <span className="text-ink font-semibold">&ldquo;{taskTitle}&rdquo;</span>
            </p>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              {isDelete
                ? "Deleting active work requires a 5-coin deduction to maintain deadline integrity and prevent fine evasion."
                : "Modifying an active task costs 2 coins to prevent changing challenging commitments to easy ones."}
            </p>
          </div>

          {/* Cost Notice */}
          <div className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 neu-inset-soft">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-accent" />
              <span className="text-xs text-ink font-medium">Cost to proceed:</span>
            </div>
            <span className="text-xs font-bold text-accent">
              -{cost} Coins
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="neu-button px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`${
                isDelete ? "neu-danger text-danger hover:bg-danger/10" : "neu-accent"
              } px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm`}
            >
              {isDelete ? "Confirm & Delete (-5 Coins)" : "Confirm & Edit (-2 Coins)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

