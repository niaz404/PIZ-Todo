"use client";

import {
  AlertTriangle,
  Check,
  Coins,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "../components/icons";
import { useWorkspace } from "../components/Providers";
import { COIN_PACKS, ECONOMY } from "../lib/economy";
import { formatCoins } from "../lib/utils";

export default function StorePage() {
  const {
    coins,
    buyCoins,
    payFines,
    unpaidFineCount,
    totalOutstanding,
    isLocked,
    notify,
  } = useWorkspace();

  const canPayOne = coins >= ECONOMY.finePerMissedTask;
  const payableNow = Math.min(
    unpaidFineCount,
    Math.floor(coins / ECONOMY.finePerMissedTask),
  );

  const handleComingSoon = (pack) => {
    notify(
      "Payment Gateway Coming Soon",
      `Online coin purchase for ${pack.label} (${pack.coins} coins / ${pack.tk} Tk) will be enabled when the payment gateway launches. For now, coins are earned by completing tasks.`,
      "info",
    );
  };

  return (
    <div className="animate-page mx-auto w-full max-w-5xl space-y-8">
      {/* Page Header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-faint">
            Store & Fine Desk
          </p>
          <h1 className="mt-3 font-display text-4xl font-normal leading-[1.05] tracking-[-0.015em] text-ink sm:text-5xl">
            Coin Exchange
          </h1>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
            Settle missed task fines and maintain your streak solvency. 1 Coin = 1 Tk.
          </p>
        </div>

        <div className="neu-soft flex items-center gap-3.5 rounded-2xl px-5 py-3.5">
          <span className="neu-inset-soft grid size-10 place-items-center rounded-xl text-accent">
            <Coins className="size-4" />
          </span>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-faint">
              Current Balance
            </p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-ink">
              {formatCoins(coins)} coins
            </p>
            <p className="text-[10px] tabular-nums text-faint">
              ≈ {formatCoins(coins)} Tk
            </p>
          </div>
        </div>
      </header>

      {/* Fine Settlement Desk (if fines exist) */}
      {unpaidFineCount > 0 ? (
        <section
          className={`rounded-[26px] border p-4 sm:p-5 ${
            isLocked
              ? "border-danger/20 bg-danger/[0.06]"
              : "border-warning/15 bg-warning/[0.045]"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-2xl ${
                  isLocked ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                }`}
              >
                {isLocked ? (
                  <Lock className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
                  Fine Desk
                </p>
                <h2 className="mt-1 font-display text-xl font-normal text-ink">
                  {isLocked
                    ? "Account locked due to unpaid fines"
                    : `${unpaidFineCount} unpaid fine${
                        unpaidFineCount === 1 ? "" : "s"
                      } outstanding`}
                </h2>
                <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted">
                  {formatCoins(totalOutstanding)} coins needed to fully clear fines.{" "}
                  {payableNow > 0
                    ? `You can pay ${payableNow} right now with your earned balance.`
                    : "Complete more daily tasks to earn coins and unlock your todos."}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={payFines}
                disabled={!canPayOne}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-300 ${
                  canPayOne
                    ? "neu-accent"
                    : "neu-inset-soft cursor-not-allowed text-faint"
                }`}
              >
                {canPayOne
                  ? `Pay ${payableNow} fine${payableNow === 1 ? "" : "s"} now`
                  : `Need ${ECONOMY.finePerMissedTask} coins`}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Production Notice: Direct Payment Gateway Coming Soon */}
      <div className="neu-inset-soft rounded-[24px] p-5 border border-accent/20 bg-accent/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="neu-button grid size-10 shrink-0 place-items-center rounded-2xl text-accent">
            <Sparkles className="size-4" />
          </span>
          <div>
            <span className="rounded bg-accent/20 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-accent">
              Coming Soon
            </span>
            <h2 className="mt-1.5 text-sm font-semibold text-ink">
              Direct Payment Gateway & Top-Up Integration
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed max-w-2xl">
              Official payment options (bKash, Nagad, and Cards) are currently being integrated for safe transactions.
              In the meantime, the economy remains secure: coins can only be earned by completing your real daily tasks!
            </p>
          </div>
        </div>

        <span className="neu-button shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-faint self-start sm:self-auto cursor-not-allowed">
          In Development
        </span>
      </div>

      {/* Top-up Packages (Preview Mode) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
              Packages Preview
            </p>
            <h2 className="mt-1 font-display text-2xl font-normal tracking-[-0.015em] text-ink">
              Coin Packages
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-faint/80">
            <Lock className="size-3 text-accent" />
            Purchases locked until gateway launch
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COIN_PACKS.map((pack) => (
            <article
              key={pack.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                pack.featured
                  ? "neu-deep ring-1 ring-accent/30 shadow-[0_12px_32px_-12px_rgba(220,199,154,0.18)]"
                  : "neu"
              }`}
            >
              {pack.featured ? (
                <span className="absolute -top-2.5 right-6 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#17130c] shadow-sm">
                  <Sparkles className="size-2.5" />
                  Most Popular
                </span>
              ) : null}

              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="neu-inset-soft grid size-12 place-items-center rounded-2xl text-accent">
                    <Coins className="size-5" />
                  </span>
                  <span className="rounded-xl bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted">
                    {pack.label}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink">
                    +{formatCoins(pack.coins)}
                    <span className="ml-1 text-sm font-normal text-faint">coins</span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {pack.note}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Price</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                    {formatCoins(pack.tk)} <span className="text-xs font-normal text-muted">Tk</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleComingSoon(pack)}
                  className="neu-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:text-accent transition-colors"
                >
                  <Lock className="size-3 text-accent" />
                  <span>Coming Soon</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
