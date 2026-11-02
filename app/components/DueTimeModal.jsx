"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, Lock, X } from "./icons";
import { useWorkspace } from "./Providers";
import { DUE_TIME_OPTIONS, canChangeDueTime, getNextDueTimeUnlockDate } from "../lib/utils";

export default function DueTimeModal({ open, onClose }) {
  const { dueTime, dueHour, dueTimeChangedAt, updateDueTime } = useWorkspace();
  const [selectedHour, setSelectedHour] = useState(dueHour ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedHour(dueHour ?? 0);
    }
  }, [open, dueHour]);

  if (!open) return null;

  const isChangeable = canChangeDueTime(dueTimeChangedAt);
  const nextUnlockDate = getNextDueTimeUnlockDate(dueTimeChangedAt);

  const selectedOption =
    DUE_TIME_OPTIONS.find((opt) => opt.hour === selectedHour) ||
    DUE_TIME_OPTIONS[0];

  const handleConfirm = async () => {
    if (!isChangeable || saving) return;
    setSaving(true);
    const success = await updateDueTime(selectedOption.value, selectedOption.hour);
    setSaving(false);
    if (success) {
      onClose?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="due-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in p-4 sm:p-6"
    >
      <div onClick={onClose} className="fixed inset-0" />

      <div className="flex min-h-full items-center justify-center">
        <div className="neu relative z-10 w-full max-w-lg my-auto rounded-[28px] p-6 sm:p-7 shadow-2xl border border-white/[0.06]">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="neu-button absolute right-4 top-4 grid size-8 place-items-center rounded-xl text-muted hover:text-ink transition-colors"
          >
            <X className="size-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <span className="neu-inset-soft grid size-11 shrink-0 place-items-center rounded-2xl text-accent">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">
                Day Boundary Setting
              </p>
              <h2 id="due-modal-title" className="font-display text-2xl font-normal text-ink mt-0.5">
                Task Due Cutoff Time
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Choose the time of day when your current work tasks are marked due and the next day begins.
              </p>
            </div>
          </div>

          {/* Important Monthly Lock Warning Notice */}
          <div
            className={`mt-5 rounded-2xl p-4 border text-xs leading-relaxed ${
              isChangeable
                ? "border-warning/30 bg-warning/[0.06] text-warning"
                : "border-accent/30 bg-accent/[0.06] text-accent"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isChangeable ? (
                <AlertTriangle className="size-4 shrink-0 text-warning mt-0.5" />
              ) : (
                <Lock className="size-4 shrink-0 text-accent mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-[11px] uppercase tracking-[0.14em]">
                  {isChangeable ? "Monthly Lock Policy" : "Locked For This Month"}
                </p>
                <p className="mt-1 text-[11.5px] text-ink/90">
                  {isChangeable ? (
                    <>
                      You can only change this cutoff time <strong>once per month</strong>. Once you confirm, your selection will be strictly locked until the 1st of next month.
                    </>
                  ) : (
                    <>
                      You recently updated your cutoff time to <strong>{dueTime}</strong>. Per policy, this setting is locked and can only be changed again on <strong>{nextUnlockDate}</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Time Options Grid */}
          <div className="mt-5">
            <label className="text-[9px] uppercase tracking-[0.18em] text-faint font-semibold">
              Select Cutoff Time (Every 3 Hours)
            </label>
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DUE_TIME_OPTIONS.map((opt) => {
                const isSelected = selectedHour === opt.hour;
                const isCurrent = dueHour === opt.hour;

                return (
                  <button
                    key={opt.hour}
                    type="button"
                    disabled={!isChangeable}
                    onClick={() => setSelectedHour(opt.hour)}
                    className={`relative flex flex-col items-start rounded-xl p-3 text-left transition-all duration-200 ${
                      !isChangeable
                        ? isCurrent
                          ? "neu-inset border border-accent/40 text-accent opacity-90 cursor-not-allowed"
                          : "neu-soft text-faint opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "neu-inset border border-accent/50 text-accent ring-1 ring-accent/30"
                          : "neu-button text-muted hover:text-ink"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />
                    )}
                    <span className="font-semibold text-xs tracking-tight text-ink">
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-faint mt-0.5">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div className="text-[11px] text-faint">
              Current: <span className="font-semibold text-accent">{dueTime}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="neu-button px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl transition-colors"
              >
                Close
              </button>

              {isChangeable ? (
                <button
                  type="button"
                  disabled={saving || selectedHour === dueHour}
                  onClick={handleConfirm}
                  className="neu-accent inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Check className="size-3.5" />
                  <span>{saving ? "Saving..." : "Lock & Save Time"}</span>
                </button>
              ) : (
                <span className="neu-button inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-faint cursor-not-allowed rounded-xl opacity-75">
                  <Lock className="size-3 text-accent" />
                  <span>Locked</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
