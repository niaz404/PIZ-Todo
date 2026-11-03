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
import { BKASH_CONFIG, ECONOMY } from "../lib/economy";
import { formatCoins } from "../lib/utils";

const SECTIONS = [
  { id: "overview", label: "⚡ 60-Sec Overview" },
  { id: "subtasks", label: "🎯 Subtasks Magic" },
  { id: "fines", label: "⏰ Missed Tasks & Fines" },
  { id: "cheat-prevention", label: "🛡️ Anti-Cheat Friction" },
  { id: "hearts", label: "💖 Heart Vault" },
  { id: "storage", label: "🧹 Storage & 3-Day Purge" },
  { id: "phoenix", label: "🔥 Phoenix Protocol" },
  { id: "faq", label: "❓ Interactive FAQ" },
];

const FAQS = [
  {
    q: "Why is there a 60-coin daily reward cap on task completions?",
    a: "Quality over spam! At +15 coins per finished task, 60 coins equals 4 meaningful, completed priorities every single day. You can still add and organize 20 or 50 tasks and subtasks for your schedule—only the coin reward stops at 60 so nobody can write a script to farm infinite coins.",
  },
  {
    q: "Do subtasks cost coins to create, edit, or delete?",
    a: "Zero. Nada. Free! Subtasks are your personal stepping stones. Break a complex task into 3, 5, or 10 subtasks with total peace of mind. The only rule: you cannot claim the +15 coin reward on the parent task until all child subtasks are checked off.",
  },
  {
    q: "Why does editing or deleting a task cost 2 and 5 coins?",
    a: "We’ve all been there: 10 minutes before the deadline, you're tempted to rename 'Finish 20-page thesis' to 'Breathe air' or delete it to escape accountability. The 2-coin and 5-coin friction modals make you stop, think, and stay committed to your word.",
  },
  {
    q: "What happens if I miss my daily cutoff time?",
    a: "At your cutoff time (default: 6:00 AM), any open task triggers a 45-coin fine. A persistent banner reminds you to settle it. One missed task wipes out 3 completed tasks, keeping stakes genuinely high!",
  },
  {
    q: "Why would I buy a Heart for 75 coins when a fine is 45 coins?",
    a: "Because Hearts are permanent wealth insurance! Every weekend, active earned coins undergo anti-hoarding decay (5% - 20%). Hearts NEVER decay. Vaulting up to 3 Hearts locks your wealth safely and gives you instant emergency shields when life gets crazy.",
  },
  {
    q: "Are coins bought with real money via bKash safe from weekly decay?",
    a: "100% exempt! Purchased coins live in a separate protected vault. When you spend coins, the system always uses your earned coins first. Purchased coins stay untouched and immune to weekly decay.",
  },
  {
    q: "What is the 3-day finished task cleanup?",
    a: "To keep our free database blazing fast, finished tasks automatically retire 3 days after completion. But your dashboard stats, lifetime completed counter, monthly heatmap, and streaks are pre-calculated and stored permanently on your account forever!",
  },
  {
    q: "What if I get sick or fall into deep debt? Am I stuck forever?",
    a: "Never. The Phoenix Protocol is our comeback engine. If you accumulate 3+ unpaid fines and haven't used the protocol in the past 30 days, one click wipes all your debt, grants +20 starter coins, and sets a 3-day probation so you can start fresh.",
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
            Official Manual & Economy Lore
          </div>
          <h1 className="mt-3 font-display text-4xl font-normal tracking-[-0.015em] text-ink sm:text-5xl">
            How PIZ-Todo <span className="italic text-accent">Actually Works.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-muted leading-relaxed">
            Where to-do lists meet real-world discipline, tight tokenomics, and thoughtful accountability. Read the rules, play fair, and build unshakeable consistency.
          </p>
        </div>

        <Link
          href="/tasks"
          className="neu-button inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-accent hover:text-accent-strong shrink-0"
        >
          <span>Jump into Tasks</span>
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
                  The Golden Rules in 60 Seconds
                </h2>
                <p className="text-xs text-muted">
                  The economy is intentionally disciplined: keeping promises pays; breaking them hurts.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Task Completed on Time
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  +{ECONOMY.defaultTaskReward || 15}{" "}
                  <span className="text-sm font-normal text-faint">Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Earned for finishing your daily parent task before the cutoff time.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  Daily Reward Cap
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  {ECONOMY.dailyMaxTaskCoins || 60}{" "}
                  <span className="text-sm font-normal text-faint">Coins / Day</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Caps rewards to 4 core tasks per day. You can still create unlimited tasks for scheduling!
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  3-Day Streak Bonus
                </p>
                <p className="mt-2 text-3xl font-bold text-accent">
                  +{ECONOMY.streakRewardBonus || 30}{" "}
                  <span className="text-sm font-normal text-faint">Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Every 3 consecutive days you maintain momentum, a +30 coin milestone reward is auto-credited.
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
                  The Subtask Superpower
                </h2>
                <p className="text-xs text-muted">
                  Break big mountains into pebbles with zero friction.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm text-muted leading-relaxed">
              <div className="neu-inset-soft rounded-2xl p-5 border border-white/[0.04] space-y-2">
                <h3 className="font-semibold text-ink text-sm">100% Free & Unlimited Forever</h3>
                <p>
                  Subtasks never cost coins. Add 3, 5, or 15 subtasks to any task. Edit, reorder, check off, or delete subtasks without any confirmation fee.
                </p>
              </div>

              <div className="neu-inset-soft rounded-2xl p-5 border border-white/[0.04] space-y-2">
                <h3 className="font-semibold text-ink text-sm">Parent Completion Gate</h3>
                <p>
                  You cannot claim the +15 coin reward on a parent task until ALL of its subtasks are checked off. This stops you from taking credit before the work is done.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: FINES */}
        {(activeTab === "fines" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-warning">
                <Clock className="size-5 text-warning" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Missed Tasks & Cutoff Fines
                </h2>
                <p className="text-xs text-muted">
                  Promises require stakes. Missing deadlines triggers real accountability.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="neu-soft rounded-2xl p-5 border border-warning/20 bg-warning/[0.03]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-warning font-semibold">
                  Missed Task Fine
                </p>
                <p className="mt-2 text-3xl font-bold text-ink">
                  -{ECONOMY.finePerMissedTask || 45}{" "}
                  <span className="text-sm font-normal text-faint">Coins</span>
                </p>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  When your cutoff hour arrives (default: 6:00 AM), every uncompleted task generates an unpaid fine of 45 coins. Missing 1 task wipes out 3 completed tasks!
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-accent/20 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-accent font-semibold">
                  How to Settle Fines
                </p>
                <div className="space-y-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-accent" />
                    <span><strong>Pay with Coins:</strong> Settle via the persistent top banner or Fine Desk in Store.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-rose-400" />
                    <span><strong>Use 1 Heart:</strong> Instantly cancel 1 fine without spending coins.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-ink" />
                    <span><strong>Auto-Pay:</strong> Toggle on in Profile to clear fines automatically at rollover.</span>
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
                  Psychological barriers stopping you from cheating yourself.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Editing Parent Tasks</h3>
                  <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    -{ECONOMY.taskEditCost || 2} Coins
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Requires two-step modal confirmation. Prevents changing your difficult workout or study goal into something trivial right before cutoff.
                </p>
              </div>

              <div className="neu-soft rounded-2xl p-5 border border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Deleting Parent Tasks</h3>
                  <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    -{ECONOMY.taskDeleteCost || 5} Coins
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted leading-relaxed">
                  Requires two-step modal confirmation. Prevents deleting tasks at 5:59 AM to evade the 45-coin missed task fine.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: HEARTS & BKASH */}
        {(activeTab === "hearts" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-rose-400">
                <Heart className="size-5 fill-rose-500 text-rose-500" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  Heart Vault & bKash Top-Up
                </h2>
                <p className="text-xs text-muted">
                  Permanent wealth storage and emergency solvency.
                </p>
              </div>
            </div>

            <div className="neu-inset-soft rounded-2xl p-6 border border-rose-500/20 bg-rose-500/[0.02] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-base font-semibold text-ink">1 Heart = {ECONOMY.heartCost || 75} Coins</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Hold up to 3 Hearts in your vault · Immune to weekly decay
                  </p>
                </div>
                <Link
                  href="/store"
                  className="neu-accent inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-[#17130c] shrink-0"
                >
                  <Heart className="size-3.5 fill-current" />
                  <span>Visit Store Vault</span>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted leading-relaxed">
                <div>
                  <p className="font-semibold text-ink">The Anti-Hoarding Weekend Wheel</p>
                  <p className="mt-1">
                    Every weekend, users spin a wheel for a 5% to 20% decay on <strong>earned coins</strong>. Storing coins in Hearts protects your wealth from this decay forever!
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-ink">Official bKash Top-Up ({BKASH_CONFIG.number})</p>
                  <p className="mt-1">
                    Purchasing coin packs with real money via bKash gives you coins that are <strong>100% exempt from weekly decay</strong>. Spends earned coins first, keeping paid coins as a safe cushion.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: 3-DAY STORAGE PURGE */}
        {(activeTab === "storage" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-normal text-ink">
                  3-Day Storage Auto-Purge & Permanent Stats
                </h2>
                <p className="text-xs text-muted">
                  How we keep database storage lean without losing a single piece of your progress.
                </p>
              </div>
            </div>

            <div className="neu-soft rounded-2xl p-5 border border-white/[0.04] space-y-3 text-xs sm:text-sm text-muted leading-relaxed">
              <p>
                To run smoothly on a free cloud database, PIZ-Todo automatically deletes completed task objects from the database after <strong>3 days</strong>.
              </p>
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="font-semibold text-ink text-xs">Pre-Aggregated Stats</p>
                  <p className="mt-1 text-[11px]">When you finish a task, your lifetime counter, streak, and monthly heatmap date are permanently stored in your user record.</p>
                </div>
                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="font-semibold text-ink text-xs">3-Day View Window</p>
                  <p className="mt-1 text-[11px]">Recent finished tasks remain visible in your Todo list for 3 days so you can celebrate recent wins.</p>
                </div>
                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="font-semibold text-ink text-xs">Zero Dashboard Loss</p>
                  <p className="mt-1 text-[11px]">When the old tasks are purged from DB storage, your streak, badges, and heatmap remain 100% untouched forever!</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: PHOENIX PROTOCOL */}
        {(activeTab === "phoenix" || activeTab === "all") && (
          <section className="neu rounded-[28px] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="neu-inset-soft grid size-10 place-items-center rounded-2xl text-accent">
                <Flame className="size-5 text-accent" />
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
                If you accumulated 3 or more unpaid fines and haven’t used the protocol in the past 30 days, trigger a Fresh Start from your Profile.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 1</p>
                  <p className="mt-1 text-xs font-semibold text-ink">Debt Cleared</p>
                  <p className="mt-0.5 text-[11px] text-faint">All backlogged fines are fully waived.</p>
                </div>

                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 2</p>
                  <p className="mt-1 text-xs font-semibold text-ink">+{ECONOMY.phoenixStarterCoins || 20} Starter Coins</p>
                  <p className="mt-0.5 text-[11px] text-faint">Immediate liquid balance to restart.</p>
                </div>

                <div className="neu-inset-soft rounded-xl p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-accent font-semibold">Step 3</p>
                  <p className="mt-1 text-xs font-semibold text-ink">3-Day Probation</p>
                  <p className="mt-0.5 text-[11px] text-faint">Re-establish your daily momentum safely.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 8: FAQ */}
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
