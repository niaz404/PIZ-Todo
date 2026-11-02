"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Coins, Flame, Menu } from "./icons";
import FinishedModeMenu from "./FinishedModeMenu";
import { formatCoins } from "../lib/utils";
import { useWorkspace } from "./Providers";
import { useSession } from "@/lib/auth-client";

export default function Header({ title, onMenuClick }) {
  const { coins, unpaidFineCount, isLocked, streak, setShowAuthModal } = useWorkspace();
  const { data: session } = useSession();
  const pathname = usePathname();
  const profileActive = pathname === "/profile";
  const todoActive = pathname === "/tasks" || pathname === "/task" || pathname === "/todo";

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 3)
    : "PIZ";

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-app/85 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.03),0_12px_28px_-20px_rgba(0,0,0,0.9)]">
      <div className="flex h-16 items-center gap-3 px-5 sm:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="neu-button grid size-9 shrink-0 place-items-center rounded-xl text-muted hover:text-ink lg:hidden"
        >
          <Menu className="size-[18px]" />
          <span className="sr-only">Open navigation</span>
        </button>

        <p className="truncate text-[10px] font-medium uppercase tracking-[0.24em] text-faint">
          {title}
        </p>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href="/store"
                aria-label={`Coin balance: ${formatCoins(coins)} coins — open store`}
                title="Coin balance — open store"
                className="neu-soft flex items-center gap-2 rounded-full px-3.5 py-2 text-xs transition-all duration-300 hover:-translate-y-px"
              >
                <Coins className="size-3.5 text-accent" />
                <span
                  key={coins}
                  className="animate-coin-pop font-medium tabular-nums text-ink"
                >
                  {formatCoins(coins)}
                </span>
              </Link>

              {unpaidFineCount > 0 ? (
                <Link
                  href="/store"
                  aria-label={`${unpaidFineCount} unpaid fine${
                    unpaidFineCount === 1 ? "" : "s"
                  } — open store`}
                  title={`${unpaidFineCount} unpaid fine${
                    unpaidFineCount === 1 ? "" : "s"
                  }${isLocked ? " · account timed out" : ""}`}
                  className={`hidden items-center gap-1.5 rounded-full px-3 py-2 text-[11px] tabular-nums transition-all duration-300 hover:-translate-y-px sm:flex ${
                    isLocked
                      ? "border border-danger/20 bg-danger/[0.08] text-danger"
                      : "neu-soft text-warning"
                  }`}
                >
                  <AlertTriangle className="size-3.5" />
                  {unpaidFineCount}
                </Link>
              ) : null}

              {todoActive ? <FinishedModeMenu /> : null}

              {/* Streak Day Badge beside Profile Pic */}
              <Link
                href="/"
                title={`Current Streak: ${streak} day${streak === 1 ? "" : "s"}`}
                className="neu-soft flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold tabular-nums text-ink transition-all duration-300 hover:-translate-y-px"
              >
                <Flame className="size-3.5 text-accent" />
                <span>{streak}d</span>
              </Link>

              {/* User Profile Avatar */}
              <Link
                href="/profile"
                aria-label="Open profile"
                title={user.name || "Account Profile"}
                aria-current={profileActive ? "page" : undefined}
                className={`grid size-9 place-items-center rounded-full text-[10px] font-semibold tracking-wide text-accent transition-all duration-300 overflow-hidden ${
                  profileActive
                    ? "neu-inset ring-2 ring-accent/35 ring-offset-4 ring-offset-app"
                    : "neu-soft hover:-translate-y-px hover:text-accent-strong"
                }`}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="size-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => (setShowAuthModal ? setShowAuthModal(true) : null)}
              className="neu-accent rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-px"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
