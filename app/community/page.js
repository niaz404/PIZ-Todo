"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Coins,
  Flame,
  Search,
  Trophy,
  Users,
  X,
} from "../components/icons";
import { useWorkspace } from "../components/Providers";

const COMMUNITY_TABS = [
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "progress", label: "Other People's Progress", icon: Users },
  { id: "economy", label: "Economy", icon: Coins },
];

export default function CommunityPage() {
  const { notify, requireAuth } = useWorkspace();
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [reactions, setReactions] = useState({});

  async function loadCommunity() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community");
      if (!res.ok) {
        throw new Error(`Failed to load community ledger (Status ${res.status})`);
      }
      const data = await res.json();
      setMembers(data.members || []);
      setCurrentUserId(data.currentUserId || null);
    } catch (err) {
      console.error("Failed to load community:", err);
      setError(err.message || "Failed to load community ledger");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunity();
  }, []);

  const handleSendReaction = (targetMember) => {
    if (!requireAuth("cheer community members")) return;

    const key = `${targetMember.id}-cheer`;
    setReactions((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));

    notify(
      `Cheered ${targetMember.name}! 🎉`,
      "Peer kudos sent for today's momentum.",
      "success",
    );
  };

  const filteredMembers = useMemo(() => {
    let result = [...members];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(q);
        const roleMatch = m.role?.toLowerCase().includes(q);
        return nameMatch || roleMatch;
      });
    }
    return result;
  }, [members, searchQuery]);

  return (
    <div className="animate-page mx-auto w-full max-w-5xl space-y-7">
      {/* Page Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-faint">
            Community Accountability
          </p>
          <h1 className="mt-2 font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
            Community <span className="italic text-accent">Ledger.</span>
          </h1>
          <p className="mt-1 text-xs text-muted">
            See real daily momentum and keep each other accountable.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="neu-inset-soft inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted">
            <Users className="size-3.5 text-accent" />
            <span className="font-semibold tabular-nums text-ink">{members.length}</span>{" "}
            Members
          </span>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav
        aria-label="Community navigation"
        className="flex items-center gap-2 border-b border-white/[0.06] pb-3"
      >
        {COMMUNITY_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "neu-inset neu-nav-active text-accent"
                  : "neu-nav text-muted hover:text-ink"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-accent" : "text-faint"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      {loading ? (
        <div className="neu flex items-center justify-center rounded-[28px] py-20 text-muted">
          <p className="animate-pulse text-xs tracking-wider uppercase">Loading community...</p>
        </div>
      ) : error ? (
        <div className="neu flex flex-col items-center justify-center rounded-[28px] py-16 text-center">
          <AlertTriangle className="size-8 text-warning" />
          <p className="mt-3 text-sm font-medium text-ink">{error}</p>
          <button
            type="button"
            onClick={loadCommunity}
            className="neu-button mt-4 rounded-xl px-4 py-2 text-xs font-semibold text-accent"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="neu-inset-soft flex items-center rounded-2xl px-4 py-2.5 text-xs">
                <Search className="size-4 shrink-0 text-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members by name..."
                  className="ml-2 w-full bg-transparent text-xs text-ink placeholder:text-faint focus:outline-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-faint hover:text-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Leaderboard List */}
              <div className="neu overflow-hidden rounded-[24px]">
                <div className="divide-y divide-white/[0.04]">
                  {filteredMembers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted">
                      No members found matching your search.
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const isTop1 = member.rank === 1;
                      const isTop2 = member.rank === 2;
                      const isTop3 = member.rank === 3;

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                            member.isYou ? "bg-accent/[0.04]" : ""
                          }`}
                        >
                          {/* Left: Rank & Avatar & Name */}
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span
                              className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                                isTop1
                                  ? "bg-accent text-[#17130c] shadow-sm"
                                  : isTop2
                                    ? "bg-[#c0c0c0] text-[#17130c]"
                                    : isTop3
                                      ? "bg-[#cd7f32] text-[#17130c]"
                                      : "neu-inset-soft text-faint"
                              }`}
                            >
                              {member.rank}
                            </span>

                            {member.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.image}
                                alt={member.name}
                                className="size-10 shrink-0 rounded-xl object-cover border border-accent/20"
                              />
                            ) : (
                              <span className="neu-inset-soft grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-accent">
                                {member.initials}
                              </span>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-ink">
                                  {member.name}
                                </p>
                                {member.isYou ? (
                                  <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[8px] font-semibold uppercase tracking-[0.1em] text-accent">
                                    You
                                  </span>
                                ) : null}
                              </div>
                              <p className="truncate text-[11px] text-muted">
                                {member.role || "Member"}
                              </p>
                            </div>
                          </div>

                          {/* Right: Streak & Today's Progress */}
                          <div className="flex items-center gap-4 shrink-0 sm:gap-6">
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-accent">
                                <Flame className="size-3.5 text-accent" />
                                {member.streak}d
                              </span>
                              <p className="text-[10px] text-faint">Streak</p>
                            </div>

                            <div className="hidden sm:block text-right min-w-[100px]">
                              <span className="text-xs font-medium tabular-nums text-ink">
                                {member.todayDone} / {member.todayTotal} Done
                              </span>
                              <div className="neu-track mt-1 h-1 w-full overflow-hidden rounded-full">
                                <span
                                  className={`block h-full rounded-full transition-all duration-500 ${
                                    member.todayProgress === 100 ? "bg-success" : "bg-accent"
                                  }`}
                                  style={{ width: `${member.todayProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OTHER PEOPLE'S PROGRESS */}
          {activeTab === "progress" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredMembers.map((member) => (
                  <article
                    key={member.id}
                    className={`neu flex flex-col justify-between rounded-[24px] p-5 transition-all duration-200 ${
                      member.isYou ? "ring-1 ring-accent/30" : ""
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.image}
                              alt={member.name}
                              className="size-11 shrink-0 rounded-2xl object-cover border border-accent/20"
                            />
                          ) : (
                            <span className="neu-inset-soft grid size-11 shrink-0 place-items-center rounded-2xl text-xs font-bold text-accent">
                              {member.initials}
                            </span>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-ink">
                                {member.name}
                              </p>
                              {member.isYou ? (
                                <span className="rounded bg-accent/20 px-1.5 py-0.2 text-[8px] font-semibold uppercase tracking-[0.1em] text-accent">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-xs text-muted">
                              {member.role || "Member"}
                            </p>
                          </div>
                        </div>

                        <span className="neu-inset-soft inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold tabular-nums text-accent">
                          <Flame className="size-3 text-accent" />
                          {member.streak}d
                        </span>
                      </div>

                      {/* Today's Checklist */}
                      <div className="mt-4 rounded-2xl border border-white/[0.04] bg-white/[0.015] p-3.5">
                        <div className="flex items-center justify-between text-[10px] text-faint">
                          <span className="uppercase tracking-[0.14em]">
                            Today&apos;s Focus
                          </span>
                          <span className="font-semibold tabular-nums text-ink">
                            {member.todayDone} / {member.todayTotal} Done
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1.5">
                          {member.todayTasks && member.todayTasks.length > 0 ? (
                            member.todayTasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span
                                  className={`grid size-4 shrink-0 place-items-center rounded-md ${
                                    task.done
                                      ? "bg-accent text-[#17130c]"
                                      : "border border-white/20 text-transparent"
                                  }`}
                                >
                                  <Check className="size-2.5" strokeWidth={3} />
                                </span>
                                <span
                                  className={`truncate ${
                                    task.done
                                      ? "text-muted line-through decoration-faint/50"
                                      : "text-ink"
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-faint">
                              No tasks logged for today yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cheer Button */}
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSendReaction(member)}
                        className="neu-button flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-muted hover:text-accent transition-colors"
                      >
                        <span>🎉 Cheer</span>
                        {reactions[`${member.id}-cheer`] ? (
                          <span className="rounded-md bg-accent/20 px-1.5 py-0.2 text-[9px] font-bold text-accent">
                            +{reactions[`${member.id}-cheer`]}
                          </span>
                        ) : null}
                      </button>

                      <span className="text-[10px] text-faint">
                        {member.todayProgress}% Completed Today
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ECONOMY */}
          {activeTab === "economy" && (
            <div className="neu rounded-[32px] p-8 sm:p-10 text-center space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Coins className="size-8" />
              </div>
              <span className="inline-block rounded-full bg-accent/20 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">
                Feature Coming Soon
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink">
                Community Economy & Staking
              </h2>
              <p className="mx-auto max-w-lg text-xs leading-relaxed text-muted">
                Peer accountability staking, task bounties, and member coin transfers will be enabled in the upcoming release.
                Currently, coin balances are strictly tied to real personal task completion to preserve accountability and database security.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("leaderboard")}
                  className="neu-accent inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
                >
                  <Trophy className="size-4" />
                  View Leaderboard
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
