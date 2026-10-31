"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Flame,
  Trophy,
  Users,
} from "./icons";
import { mockUser } from "../data/mockData";
import { TEAM_PEERS } from "../lib/economy";

const statusMeta = {
  "on-fire": {
    label: "On fire",
    className: "border-accent/15 bg-accent/10 text-accent",
  },
  steady: {
    label: "Steady",
    className: "border-success/15 bg-success/10 text-success",
  },
  "at-risk": {
    label: "At risk",
    className: "border-warning/15 bg-warning/10 text-warning",
  },
  locked: {
    label: "Timed out",
    className: "border-danger/20 bg-danger/10 text-danger",
  },
};

function currentUserStatus({ isLocked, unpaidFineCount, streak, rate }) {
  if (isLocked || unpaidFineCount >= 4) return "locked";
  if (unpaidFineCount > 0 || rate < 55) return "at-risk";
  if (streak >= 7 && rate >= 75) return "on-fire";
  return "steady";
}

function fallbackPraise(peer) {
  if (peer.isYou) {
    return "You are the quiet engine of this leaderboard. Keep the streak warm.";
  }
  return `${peer.name} is stacking consistent days. The graph likes what it sees.`;
}

function fallbackRoast(peer) {
  if (peer.isYou) {
    return "Your own account is drifting. The dashboard is not judging you. The fines are.";
  }
  return `${peer.name} has been busy... just not with the list. The fines are doing the remembering.`;
}

export default function TeamPulse({
  weekTotals,
  streak,
  unpaidFineCount,
  isLocked,
  socialFocus = "mixed",
}) {
  const totalWeek = weekTotals.completed + weekTotals.missed;
  const rate = totalWeek
    ? Math.round((weekTotals.completed / totalWeek) * 100)
    : 0;
  const currentPeer = {
    id: "you",
    name: mockUser.name,
    initials: mockUser.initials,
    role: "You",
    completed: weekTotals.completed,
    streak,
    fines: unpaidFineCount,
    status: currentUserStatus({
      isLocked,
      unpaidFineCount,
      streak,
      rate,
    }),
    isYou: true,
    praise:
      streak >= 7
        ? `You are on a ${streak}-day streak with ${weekTotals.completed} tasks this week. Quietly excellent.`
        : fallbackPraise({ isYou: true }),
    roast: fallbackRoast({ isYou: true }),
  };

  const allPeers = [...TEAM_PEERS, currentPeer].sort(
    (a, b) => b.completed - a.completed,
  );
  const maxCompleted = Math.max(
    1,
    ...allPeers.map((peer) => Number(peer.completed) || 0),
  );
  const top = allPeers[0];
  const bottom = allPeers[allPeers.length - 1];
  const showPraise = socialFocus !== "roast";
  const showRoast = socialFocus !== "praise";

  return (
    <section className="neu rounded-[28px] p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
            Team pulse
          </p>
          <h2 className="mt-2 font-display text-xl font-normal tracking-[-0.01em] text-ink">
            Progress, with witnesses.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="neu-inset-soft inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-faint">
            <Users className="size-3" />
            {allPeers.length} people
          </span>
          <Link
            href="/community"
            className="text-[9px] uppercase tracking-[0.14em] text-faint transition-colors hover:text-accent"
          >
            Community
          </Link>
        </div>
      </header>

      <div className="mt-4 space-y-2">
        {showPraise ? (
          <article className="relative overflow-hidden rounded-2xl border border-accent/15 bg-[linear-gradient(135deg,rgb(220_199_154_/_0.12),rgb(220_199_154_/_0.02))] p-3.5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <Trophy className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-accent/80">
                  Congratulations · #{allPeers.indexOf(top) + 1}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {top.praise ?? fallbackPraise(top)}
                </p>
              </div>
            </div>
          </article>
        ) : null}

        {showRoast ? (
          <article className="relative overflow-hidden rounded-2xl border border-danger/15 bg-[linear-gradient(135deg,rgb(223_152_152_/_0.11),rgb(223_152_152_/_0.02))] p-3.5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                <AlertTriangle className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-danger/80">
                  Needs a nudge · #{allPeers.indexOf(bottom) + 1}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {bottom.roast ?? fallbackRoast(bottom)}
                </p>
              </div>
            </div>
          </article>
        ) : null}
      </div>

      <div className="mt-4 divide-y divide-white/[0.055]">
        {allPeers.map((peer, index) => {
          const meta = statusMeta[peer.status] ?? statusMeta.steady;
          const width = Math.max(
            5,
            Math.round(((Number(peer.completed) || 0) / maxCompleted) * 100),
          );

          return (
            <div
              key={peer.id}
              className={`flex items-center gap-3 py-2.5 ${
                peer.isYou ? "rounded-xl bg-white/[0.025] px-2" : ""
              }`}
            >
              <span className="w-3 shrink-0 text-[9px] tabular-nums text-faint/70">
                {index + 1}
              </span>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-[9px] font-semibold ${
                  peer.status === "locked"
                    ? "bg-danger/10 text-danger"
                    : peer.status === "on-fire"
                      ? "bg-accent/15 text-accent"
                      : "neu-inset-soft text-muted"
                } ${peer.isYou ? "ring-1 ring-accent/30" : ""}`}
              >
                {peer.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[11px] font-medium text-ink">
                    {peer.name}
                  </p>
                  {peer.isYou ? (
                    <span className="rounded bg-accent/10 px-1 py-0.5 text-[7px] uppercase tracking-[0.12em] text-accent">
                      You
                    </span>
                  ) : null}
                  {peer.status === "on-fire" ? (
                    <Flame className="size-2.5 text-accent/80" />
                  ) : null}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/25">
                    <span
                      className={`block h-full rounded-full ${
                        peer.status === "locked"
                          ? "bg-danger/60"
                          : peer.status === "at-risk"
                            ? "bg-warning/60"
                            : "bg-accent/70"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[8px] tabular-nums text-faint">
                    {peer.completed} done
                  </span>
                </div>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-[9px] tabular-nums text-muted">
                  {peer.streak}d streak
                </p>
                <p className="text-[8px] tabular-nums text-faint">
                  {peer.fines} fine{peer.fines === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[8px] uppercase tracking-[0.1em] ${meta.className}`}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[9px] uppercase tracking-[0.14em] text-faint/70">
        Playful team roasts · simulated people, real-ish feelings
      </p>
    </section>
  );
}
