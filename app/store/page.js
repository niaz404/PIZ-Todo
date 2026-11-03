"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Coins,
  Copy,
  Heart,
  Lock,
  Shield,
  Sparkles,
  Zap,
} from "../components/icons";
import { useWorkspace } from "../components/Providers";
import { BKASH_CONFIG, COIN_PACKS, ECONOMY } from "../lib/economy";
import { formatCoins } from "../lib/utils";
import BkashPaymentModal from "../components/BkashPaymentModal";

export default function StorePage() {
  const {
    coins,
    earnedCoins,
    purchasedCoins,
    hearts,
    buyHeart,
    payFineWithHeart,
    buyCoins,
    payFines,
    unpaidFineCount,
    totalOutstanding,
    isLocked,
    notify,
    requireAuth,
    paymentRequests,
    refreshWorkspace,
  } = useWorkspace();

  const [selectedBkashPack, setSelectedBkashPack] = useState(null);

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
              {formatCoins(earnedCoins ?? coins)} Earned · {formatCoins(purchasedCoins ?? 0)} Purchased
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
                  {formatCoins(totalOutstanding)} coins needed to fully clear fines (50 coins per missed task).
                  {(hearts ?? 0) > 0 ? ` You hold ${hearts} Heart${hearts === 1 ? "" : "s"} ready to waive fines!` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap shrink-0 items-center gap-2">
              {(hearts ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => payFineWithHeart()}
                  className="neu-button inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
                >
                  <Heart className="size-3.5 text-rose-400 fill-rose-400" />
                  <span>Use 1 Heart</span>
                </button>
              ) : null}
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

      {/* Wealth Store & Items */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
              Wealth Vault & Protection
            </p>
            <h2 className="mt-1 font-display text-2xl font-normal tracking-[-0.015em] text-ink">
              Store Items
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-accent">
            <Shield className="size-3 text-accent" />
            Permanent Wealth Storage
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Heart Item Card */}
          <article className="neu-deep relative flex flex-col justify-between rounded-3xl p-6 ring-1 ring-rose-500/30 shadow-[0_12px_32px_-12px_rgba(244,63,94,0.18)]">
            <span className="absolute -top-2.5 right-6 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm">
              <Heart className="size-2.5 fill-current" />
              {hearts ?? 0}/{ECONOMY.maxHearts || 3} Held
            </span>

            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="neu-inset-soft grid size-12 place-items-center rounded-2xl text-rose-400">
                  <Heart className="size-6 text-rose-500 fill-rose-500/20" />
                </span>
                <span className="rounded-xl bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-rose-300">
                  Insurance Vault
                </span>
              </div>

              <div className="mt-5">
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  Heart Protection
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Stores wealth permanently immune to weekly decay. Consuming 1 Heart waives 1 missed task fine (worth 50 coins) and maintains your streak solvency.
                </p>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Price</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                  {ECONOMY.heartCost || 80} <span className="text-xs font-normal text-muted">Coins</span>
                </p>
              </div>

              <button
                type="button"
                onClick={buyHeart}
                disabled={coins < (ECONOMY.heartCost || 80) || (hearts ?? 0) >= (ECONOMY.maxHearts || 3)}
                className={`neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  coins < (ECONOMY.heartCost || 80) || (hearts ?? 0) >= (ECONOMY.maxHearts || 3)
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-[1.02]"
                }`}
              >
                <Heart className="size-3.5 fill-current" />
                <span>
                  {(hearts ?? 0) >= (ECONOMY.maxHearts || 3)
                    ? "Max Capacity (3/3)"
                    : `Buy Heart (${ECONOMY.heartCost || 80}c)`}
                </span>
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Production Notice: Manual bKash Top-Up Now Live */}
      <div className="neu-inset-soft rounded-[24px] p-5 border border-rose-500/25 bg-rose-500/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="neu-button grid size-10 shrink-0 place-items-center rounded-2xl text-rose-400">
            <Coins className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                bKash Manual Top-Up Live
              </span>
              <span className="text-[10px] text-faint">
                {BKASH_CONFIG.number} (Personal)
              </span>
            </div>
            <h2 className="mt-1.5 text-sm font-semibold text-ink">
              Direct Coin Purchases via bKash Send Money
            </h2>
            <p className="mt-1 text-xs text-muted leading-relaxed max-w-2xl">
              Choose any coin package below to send money via bKash and submit your TrxID. Our management team verifies requests and credits purchased coins directly to your balance.
            </p>
          </div>
        </div>

        <span className="neu-soft shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-300 self-start sm:self-auto border border-rose-500/20">
          Official Treasury Active
        </span>
      </div>

      {/* Top-up Packages */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
              Instant Top-Up
            </p>
            <h2 className="mt-1 font-display text-2xl font-normal tracking-[-0.015em] text-ink">
              Coin Packages
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-accent">
            <Sparkles className="size-3 text-accent" />
            Purchased coins are 100% exempt from weekend decay
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
                  onClick={() => {
                    if (!requireAuth("purchase coins")) return;
                    setSelectedBkashPack(pack);
                  }}
                  className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#17130c] hover:scale-[1.02] transition-all"
                >
                  <Coins className="size-3.5" />
                  <span>Buy with bKash</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* My Submitted Top-Up Requests */}
      {paymentRequests && paymentRequests.length > 0 && (
        <section className="neu rounded-[28px] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
                Order History
              </p>
              <h2 className="mt-1 font-display text-xl font-normal text-ink">
                My bKash Payment Requests
              </h2>
            </div>
            <span className="text-xs text-muted">
              {paymentRequests.length} request{paymentRequests.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="divide-y divide-white/[0.05] overflow-x-auto">
            {paymentRequests.map((req) => (
              <div
                key={req.id || req._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{req.packLabel}</span>
                    <span className="text-faint">·</span>
                    <span className="text-accent font-medium">+{formatCoins(req.grantedCoins ?? req.requestedCoins)} coins</span>
                    <span className="text-faint">({req.tk} Tk)</span>
                  </div>
                  <p className="text-[11px] text-muted mt-0.5 font-mono">
                    TrxID: <span className="text-ink uppercase">{req.trxId}</span> · From: {req.bkashNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      req.status === "approved"
                        ? "bg-success/15 text-success border border-success/30"
                        : req.status === "rejected"
                          ? "bg-danger/15 text-danger border border-danger/30"
                          : "bg-warning/15 text-warning border border-warning/30"
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-[10px] text-faint">
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* bKash Payment Modal */}
      {selectedBkashPack && (
        <BkashPaymentModal
          open={Boolean(selectedBkashPack)}
          pack={selectedBkashPack}
          onClose={() => setSelectedBkashPack(null)}
          onSuccess={(req) => {
            notify(
              "Payment Request Submitted",
              `We received your request for ${req.packLabel} (TrxID: ${req.trxId}). Once verified, coins will be credited.`,
              "success",
            );
            refreshWorkspace?.();
          }}
        />
      )}
    </div>
  );
}
