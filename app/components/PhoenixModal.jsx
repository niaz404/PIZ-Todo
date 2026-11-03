"use client";

import { Sparkles, X, Zap } from "./icons";
import { useWorkspace } from "./Providers";

export default function PhoenixModal({ open, onClose }) {
  const { unpaidFineCount, activatePhoenix } = useWorkspace();

  if (!open || unpaidFineCount < 3) return null;

  const handleActivate = async () => {
    const success = await activatePhoenix();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phoenix-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in p-4 sm:p-6"
    >
      <div onClick={onClose} className="fixed inset-0" />

      <div className="flex min-h-full items-center justify-center">
        <div className="neu relative z-10 w-full max-w-lg my-auto rounded-[32px] p-6 sm:p-8 shadow-2xl border border-accent/20">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="neu-button absolute right-4 top-4 grid size-8 place-items-center rounded-xl text-muted hover:text-ink transition-colors"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3.5 pr-8">
            <span className="neu-inset-soft grid size-12 shrink-0 place-items-center rounded-2xl text-accent">
              <Zap className="size-6 text-accent" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold">
                Comeback Protocol
              </p>
              <h2 id="phoenix-title" className="font-display text-2xl font-normal text-ink mt-0.5">
                The Phoenix Fresh Start
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Consistency is a lifelong habit, not a prison sentence. Wipe your slate clean and rebuild your momentum.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5 rounded-2xl p-4 border border-white/[0.06] bg-white/[0.02] text-xs text-muted">
            <p className="font-semibold text-ink text-[11px] uppercase tracking-[0.14em]">
              What Fresh Start grants you:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-[11.5px]">
              <li>Clears all {unpaidFineCount} backlogged unpaid fines to 0 debt.</li>
              <li>Grants <strong>+{ECONOMY.phoenixStarterCoins || 20} Starter Coins</strong> so you can participate immediately.</li>
              <li>Resets streak cleanly to Day 0.</li>
              <li>Grants a <strong>3-Day Probation Shield</strong> with half-fines while you regain rhythm.</li>
            </ul>
            <p className="text-[10px] text-faint pt-1">
              Available once every 30 days for members with 3+ unpaid fines.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="neu-button px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl transition-colors"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={handleActivate}
              className="neu-accent inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-md"
            >
              <Sparkles className="size-3.5" />
              <span>Activate Fresh Start (+{ECONOMY.phoenixStarterCoins || 20} Coins)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

