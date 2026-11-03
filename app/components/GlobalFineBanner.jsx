"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Coins, Heart } from "./icons";
import { useWorkspace } from "./Providers";
import { formatCoins } from "../lib/utils";

export default function GlobalFineBanner() {
  const {
    unpaidFineCount,
    totalOutstanding,
    hearts,
    coins,
    unpaidFines,
    payFineWithCoins,
    payFineWithHeart,
  } = useWorkspace();

  if (unpaidFineCount === 0) return null;

  const firstFine = unpaidFines[0];

  return (
    <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 pt-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-warning/25 bg-warning/[0.045] p-3.5 sm:px-5 sm:py-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
            <AlertTriangle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <span>Account Alert:</span>
              <span className="text-warning">
                {unpaidFineCount} Unpaid Fine{unpaidFineCount > 1 ? "s" : ""}
              </span>
              <span className="text-faint">({formatCoins(totalOutstanding)} coins due)</span>
            </p>
            <p className="text-[10.5px] text-muted truncate mt-0.5">
              Missed cutoff accountability. Settle with coins or redeem a Heart.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {hearts > 0 && firstFine && (
            <button
              type="button"
              onClick={() => payFineWithHeart(firstFine.id)}
              className="neu-button inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-accent hover:text-ink transition-all"
            >
              <Heart className="size-3 text-danger fill-danger/20" />
              <span>Use Heart ({hearts})</span>
            </button>
          )}

          {firstFine && coins >= 50 && (
            <button
              type="button"
              onClick={() => payFineWithCoins(firstFine.id)}
              className="neu-button inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-ink hover:text-accent transition-all"
            >
              <Coins className="size-3 text-accent" />
              <span>Pay 50 Coins</span>
            </button>
          )}

          <Link
            href="/store"
            className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[11px] font-semibold transition-all"
          >
            <span>Review at Store</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
