"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  Flame,
  Shield,
  Zap,
} from "./components/icons";
import {
  CoinFlowChart,
  GithubStreakHeatmap,
} from "./components/EconomyCharts";
import { useWorkspace } from "./components/Providers";
import { formatCoins } from "./lib/utils";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const {
    coins,
    unpaidFineCount,
    totalOutstanding,
    dailyHistory,
    monthHistory,
    monthTotals,
    streak,
    monthlyStreak,
  } = useWorkspace();
  const { data: session } = useSession();

  const [monthStats, setMonthStats] = useState({
    streak: streak || 0,
    tasks: 0,
    monthName: "This month",
  });

  const netMonth = monthTotals.earned - monthTotals.fined - monthTotals.spent;
  const firstName = session?.user?.name
    ? session.user.name.split(" ")[0]
    : "there";

  return (
    <div className="animate-page mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-faint">
            Dashboard
          </p>
          <h1 className="mt-2.5 font-display text-4xl font-normal leading-[1.05] tracking-[-0.015em] text-ink sm:text-5xl">
            Hello, <span className="italic text-accent">{firstName}.</span>
          </h1>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
            Your monthly task economy, active streak, and consistency at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/tasks"
            className="neu-accent inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
          >
            Open todo
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/store"
            className="neu-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium text-muted hover:text-ink"
          >
            <Coins className="size-3.5 text-accent" />
            Store & Fines
          </Link>
        </div>
      </header>

      {/* 4 Monthly KPI Cards */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Coin balance */}
        <KpiCard
          eyebrow="Coin balance"
          value={formatCoins(coins)}
          suffix="coins"
          detail={`≈ ${formatCoins(coins)} Tk equivalent (1 Coin = 1 Tk)`}
          icon={Coins}
          tone="gold"
        />

        {/* 2. Monthly Streak */}
        <KpiCard
          eyebrow="Monthly streak"
          value={`${monthStats.streak ?? streak}`}
          suffix="days"
          detail={`Active consecutive streak in ${monthStats.monthName}`}
          icon={Flame}
          tone="gold"
        />

        {/* 3. Total fines owed */}
        <KpiCard
          eyebrow="Fines owed"
          value={`${unpaidFineCount}`}
          suffix="unpaid"
          detail={
            unpaidFineCount > 0
              ? `${formatCoins(totalOutstanding)} coins total outstanding`
              : "Clean record · no active fines"
          }
          icon={unpaidFineCount > 0 ? AlertTriangle : Shield}
          tone={unpaidFineCount > 0 ? "danger" : "success"}
        />

        {/* 4. Earning of this month */}
        <KpiCard
          eyebrow="Earning of this month"
          value={`+${formatCoins(monthTotals.earned)}`}
          suffix="coins"
          detail={`${monthTotals.completed} tasks finished in ${monthStats.monthName}`}
          icon={Zap}
          tone="success"
        />
      </section>

      {/* Unified Monthly Streak & Coin Velocity Matrix */}
      <section className="neu w-full rounded-[28px] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-8">
          {/* Left: GitHub Contribution Heatmap for Current Month */}
          <div className="w-full lg:w-fit shrink-0">
            <GithubStreakHeatmap
              history={dailyHistory}
              monthHistory={monthHistory}
              streak={monthlyStreak ?? streak}
              onMonthStats={setMonthStats}
            />
          </div>

          {/* Desktop Vertical Divider */}
          <div className="hidden lg:block w-px bg-white/[0.06] self-stretch" />

          {/* Right: Monthly Coin Velocity Graph & Flow Metrics */}
          <div className="flex-1 min-w-0 flex flex-col justify-between pt-6 lg:pt-0 border-t lg:border-t-0 border-white/[0.06]">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
                  Monthly coin flow · {monthStats.monthName}
                </p>
                <h3 className="mt-1 font-display text-xl font-normal tracking-[-0.015em] text-ink">
                  Earned vs. Burned
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-faint">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-accent" />
                  Earned
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-danger" />
                  Fined + Spent
                </span>
              </div>
            </div>

            {/* Interactive Smooth Curve Flow Chart */}
            <div className="my-auto w-full py-2">
              <CoinFlowChart history={monthHistory} height={200} />
            </div>

            {/* Bottom 3 Monthly Flow Indicators */}
            <div className="grid grid-cols-3 gap-2.5 border-t border-white/[0.05] pt-3">
              <FlowStat
                label="Month earned"
                value={`+${formatCoins(monthTotals.earned)}`}
                tone="gold"
              />
              <FlowStat
                label="Month fined"
                value={`-${formatCoins(monthTotals.fined)}`}
                tone={monthTotals.fined > 0 ? "danger" : "success"}
              />
              <FlowStat
                label="Net this month"
                value={formatSignedCoins(netMonth)}
                tone={netMonth >= 0 ? "success" : "danger"}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatSignedCoins(value) {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${formatCoins(Math.abs(rounded))}`;
}

function KpiCard({ eyebrow, value, suffix, detail, icon: Icon, tone = "gold" }) {
  const tones = {
    gold: {
      icon: "bg-accent/10 text-accent",
      orb: "bg-accent/10",
    },
    success: {
      icon: "bg-success/10 text-success",
      orb: "bg-success/10",
    },
    danger: {
      icon: "bg-danger/10 text-danger",
      orb: "bg-danger/10",
    },
    warning: {
      icon: "bg-warning/10 text-warning",
      orb: "bg-warning/10",
    },
  };
  const palette = tones[tone] ?? tones.gold;

  return (
    <article className="neu relative overflow-hidden rounded-[24px] p-4 sm:p-5">
      <span
        aria-hidden="true"
        className={`absolute -right-7 -top-8 size-24 rounded-full blur-2xl ${palette.orb}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums tracking-[-0.04em] text-ink">
            {value}
            <span className="ml-1 text-[10px] font-normal tracking-normal text-faint">
              {suffix}
            </span>
          </p>
        </div>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${palette.icon}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="relative mt-3 text-[10px] leading-relaxed text-muted">
        {detail}
      </p>
    </article>
  );
}

function FlowStat({ label, value, tone = "gold" }) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "success"
        ? "text-success"
        : "text-accent";

  return (
    <div className="neu-inset-soft rounded-xl px-3.5 py-3">
      <p className="text-[9px] uppercase tracking-[0.16em] text-faint">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}
