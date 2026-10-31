"use client";

import { useState } from "react";
import { Coins, Flame, Users } from "./icons";
import { authClient } from "@/lib/auth-client";

export default function LoginView({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (err) {
      console.error("Sign in failed:", err);
      setError("Google authentication could not be completed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[500px] w-full items-center justify-center p-4">
      <div className="w-full max-w-md animate-page">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl">
            PIZ-Todo
          </h1>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-accent">
            Accountability & Task Economy
          </p>
        </div>

        {/* Main Card */}
        <div className="neu mt-7 rounded-[32px] p-7 sm:p-9 shadow-2xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-normal text-ink">
              Sign In
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Connect your Google account to create tasks, track daily consistency, and join the community ledger.
            </p>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-danger/25 bg-danger/[0.08] p-3 text-center text-xs text-danger">
              {error}
            </div>
          ) : null}

          {/* Google Sign In Button */}
          <div className="mt-7">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="neu-button group flex w-full items-center justify-center gap-3.5 rounded-2xl py-3.5 px-4 text-sm font-semibold text-ink transition-all hover:border-accent/40 hover:-translate-y-0.5"
            >
              <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>
          </div>

          {onClose ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted hover:text-ink"
              >
                Cancel and return to browsing
              </button>
            </div>
          ) : null}

          {/* Features Checklist */}
          <div className="mt-8 space-y-2.5 border-t border-white/[0.06] pt-6 text-xs text-muted">
            <div className="flex items-center gap-2.5">
              <Flame className="size-4 text-accent" />
              <span>Real-time accountability streaks</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="size-4 text-accent" />
              <span>Community leaderboard & peer checking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Coins className="size-4 text-accent" />
              <span>Task completion economy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
