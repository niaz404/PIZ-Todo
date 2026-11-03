"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Flame,
  Heart,
  Lock,
  RotateCcw,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "../components/icons";
import { ECONOMY } from "../lib/economy";
import { formatCoins } from "../lib/utils";

const SECTIONS = [
  { id: "overview", label: "Economy Overview" },
  { id: "subtasks", label: "Subtasks System" },
  { id: "fines", label: "Missed Tasks & Fines" },
  { id: "cheat-prevention", label: "Integrity & Anti-Cheat" },
  { id: "hearts", label: "Heart Vault" },
  { id: "phoenix", label: "Phoenix Protocol" },
  { id: "faq", label: "Frequently Asked Questions" },
];

const FAQS = [
  {
    q: "Why is there a 150-coin daily reward cap on task completions?",
    a: "The 150-coin cap (equivalent to 6 completed tasks per day at +25 coins each) ensures that members focus on high-impact daily priorities rather than bot-farming or spamming hundreds of micro-tasks. You can still create and complete as many tasks as you need for organization—only the reward stops at 150 coins per day.",
  },
  {
    q: "Do subtasks cost coins to edit or delete?",
    a: "Never. Subtasks are 100% free to add, modify, reorder, check off, and delete. They serve as stepping stones for your main tasks. However, a parent task cannot be marked completed for coins until all its subtasks are finished.",
  },
  {
    q: "Why do editing and deleting tasks cost 2 and 5 coins?",
    a: "This provides deliberate psychological friction against cheating. In typical todo apps, users delete or rename difficult tasks to avoid acknowledging missed deadlines. The confirmation modal and modest coin fee encourage honest commitment.",
  },
  {
    q: "What happens if I miss my daily cutoff time?",
    a: "When the daily cutoff passes and a scheduled task remains uncompleted, an unpaid fine of 50 coins is generated. An alert banner appears across the app allowing you to either pay 50 coins or use 1 Heart to waive the fine.",
  },
  {
    q: "What is a Heart and why does it cost 80 coins?",
    a: "A Heart is a permanent wealth store and insurance policy. While earned coins are subject to weekend anti-hoarding decay, Hearts never decay. Each Heart can cancel 1 missed task fine (worth 50 coins). Storing up to 3 Hearts in your vault protects you from unforeseen emergencies.",
  },
  {
    q: "Will weekend anti-hoarding decay affect coins I purchased with real money?",
    a: "No. Purchased coins are strictly separated from earned coins in your database record and are 100% exempt from weekly weekend decay. The decay only affects active task-earned coins to motivate continuous real-world execution.",
  },
  {
    q: "What is the Phoenix Protocol and when can I use it?",
    a: "The Phoenix Protocol is a comeback engine for members who hit hard times and accumulated 3 or more unpaid fines. Available once every 30 days, it completely clears your debt, grants +25 starter coins, and sets a 3-day probation period so you can restart with zero baggage.",
  },
  {
    q: "Can I automate paying fines so my workflow is uninterrupted?",
    a: "Yes. By default, fine payments require manual confirmation. However, you can toggle 'Auto-Pay Fines' on your Profile page. When active, overdue fines are automatically settled at cutoff using available coins or Hearts.",
  },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (idx) => {
    setExpandedFaq((current) => (current === idx ? null : idx));
  };

  return (
    <div className="animate-page mx-auto w-full max-w-5xl space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.06] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <BookOpen className="size-3" />
            Official Documentation
          </div>
          <h1 className="mt-3 font-display text-4xl font-normal tracking-[-0.015em] text-ink sm:text-5xl">
            Economy & <span className="italic text-accent">Accountability Guide.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted leading-relaxed">
            Everything you need to know about PIZ-Todo tokenomics, anti-cheat mechanisms, subtask integrity, Heart vaults, and recovery protocols.
          </p>
        </div>

        <Link
          href="/tasks"
          className="neu-button inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-accent hover:text-accent-strong shrink-0"
        >
          <span>Open My Todos</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {/* Navigation Pills */}
      <nav className="flex flex-wrap items-center gap-2" aria-label="Guide sections">
        {SECTIONS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "neu-accent text-[#17130c]"
                  : "neu-soft text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Areas */}
      <div className="space-y-6">
        {/* SECTION 1: OVERVIEW */}
        {(activeTab === "overview" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Coins className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Core Tokenomics & Daily Rewards
                </h2>
                <p className="text-xs text-muted">
                  How coins are minted, capped, and accumulated responsibly.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Task Completion
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  +{ECONOMY.defaultTaskReward || 25}{" "}
                  <span className="text-sm font-normal text-faint">Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Granted immediately upon completing any parent task before your cutoff time.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Daily Reward Cap
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  {ECONOMY.dailyMaxTaskCoins || 150}{" "}
                  <span className="text-sm font-normal text-faint">Coins / Day</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Caps daily task rewards (6 tasks) to eliminate script farming while keeping your workflow clean.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Streak Milestone
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  +50 <span className="text-sm font-normal text-faint">Bonus Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Earned every 3 consecutive days you maintain flawless on-time task completion.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: SUBTASKS */}
        {(activeTab === "subtasks" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Check className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  The Subtask Architecture
                </h2>
                <p className="text-xs text-muted">
                  Stepping stones designed to empower granular planning with zero friction.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-muted leading-relaxed">
              <div className="neu-inset-soft rounded-2xl p-5 border border-white/[0.04]">
                <h3 className="font-semibold text-ink text-sm">100% Free & Unlimited</h3>
                <p className="mt-1">
                  Subtasks never incur edit or delete penalties. You can break down complex projects into 5, 10, or 20 individual steps without spending a single coin.
                </p>
              </div>

              <div className="neu-inset-soft rounded-2xl p-5 border border-white/[0.04]">
                <h3 className="font-semibold text-ink text-sm">Parent Completion Gate</h3>
                <p className="mt-1">
                  To prevent gaming the reward system, a parent task cannot be checked off for +25 coins until all of its child subtasks are marked 100% finished.
                </p>
              </div>

              <div className="neu-inset-soft rounded-2xl p-5 border border-white/[0.04]">
                <h3 className="font-semibold text-ink text-sm">Zero Fine Exposure for Subtasks</h3>
                <p className="mt-1">
                  Only parent tasks generate missed deadline fines. Subtasks remain strictly safe stepping stones that reflect your personal breakdown style.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: FINES & CUTOFF */}
        {(activeTab === "fines" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-warning">
                <Clock className="size-5 text-warning" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Missed Tasks & Fine Accountability
                </h2>
                <p className="text-xs text-muted">
                  Real discipline requires stakes. Incomplete tasks trigger automated accountability.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="neu-soft rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-warning font-semibold">
                  Missed Cutoff Fine
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  -50 <span className="text-sm font-normal text-faint">Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Generated at your chosen daily cutoff time for every task left open. Fines remain as unpaid alerts until settled.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Settlement Options
                </p>
                <div className="mt-3 space-y-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-accent" />
                    <span>Pay with 50 earned coins at Store or via banner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-rose-400" />
                    <span>Waive completely using 1 vaulted Heart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-ink" />
                    <span>Enable Auto-Pay in Profile for hands-free settling</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: ANTI-CHEAT */}
        {(activeTab === "cheat-prevention" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Shield className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Integrity & Anti-Cheat Friction
                </h2>
                <p className="text-xs text-muted">
                  Psychological barriers against impulsive task modifications.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Editing Parent Tasks</h3>
                  <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    -2 Coins
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  A warning modal will prompt you to confirm. Prevents rewriting difficult goals into trivial tasks right before the deadline.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Deleting Parent Tasks</h3>
                  <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    -5 Coins
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Requires two-step modal confirmation. Prevents deleting tasks to evade cutoff accountability.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: HEARTS */}
        {(activeTab === "hearts" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-rose-400">
                <Heart className="size-5 fill-rose-500 text-rose-500" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Heart Vault & Permanent Wealth
                </h2>
                <p className="text-xs text-muted">
                  Immune to anti-hoarding decay and acting as emergency insurance.
                </p>
              </div>
            </div>

            <div className="neu-inset-soft rounded-2xl p-6 border border-rose-500/20 bg-rose-500/[0.02] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-base font-semibold text-ink">1 Heart = 80 Coins</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Maximum Vault Capacity: 3 Hearts
                  </p>
                </div>
                <Link
                  href="/store"
                  className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#17130c] shrink-0"
                >
                  <Heart className="size-3.5 fill-current" />
                  <span>Acquire at Store</span>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted leading-relaxed">
                <div className="space-y-1">
                  <p className="font-semibold text-ink">Immune to Weekend Decay</p>
                  <p>
                    Every weekend, earned coins are subject to the anti-hoarding spin (5% - 20%). Hearts are 100% exempt from this decay, making them the safest asset in PIZ-Todo.
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-ink">Waives 1 Missed Fine</p>
                  <p>
                    Instead of losing 50 liquid coins when life gets in the way, redeem 1 Heart to instantly erase the fine and preserve your streak solvency.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: PHOENIX */}
        {(activeTab === "phoenix" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  The Phoenix Protocol (Comeback Engine)
                </h2>
                <p className="text-xs text-muted">
                  Life happens. A guaranteed path to redemption without abandoning your account.
                </p>
              </div>
            </div>

            <div className="neu-soft rounded-2xl p-6 border border-accent/20 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Protocol Activation Conditions</h3>
              <p className="text-xs text-muted leading-relaxed">
                If you have accumulated 3 or more unpaid fines and have not used the protocol in the past 30 days, you can trigger a Fresh Start from your Profile.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 1</p>
                  <p className="mt-1 text-xs font-semibold text-ink">All Fines Waived</p>
                  <p className="mt-0.5 text-[11px] text-faint">Outstanding debt cleared.</p>
                </div>

                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 2</p>
                  <p className="mt-1 text-xs font-semibold text-ink">+25 Starter Coins</p>
                  <p className="mt-0.5 text-[11px] text-faint">Balance set to 25 coins.</p>
                </div>

                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 3</p>
                  <p className="mt-1 text-xs font-semibold text-ink">3-Day Probation</p>
                  <p className="mt-0.5 text-[11px] text-faint">Re-establish momentum.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: FAQ */}
        {(activeTab === "faq" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-muted">
                  Quick answers to common questions about the economy.
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.04]">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="flex w-full items-center justify-between gap-4 text-left font-medium text-xs sm:text-sm text-ink hover:text-accent transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-accent" : "text-faint"
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-xs leading-relaxed text-muted animate-fade-in">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}