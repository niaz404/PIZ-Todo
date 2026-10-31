"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Coins,
  Flame,
  LogOut,
  Pencil,
  RotateCcw,
  Shield,
  Sparkles,
  User,
  X,
} from "../components/icons";
import { useWorkspace } from "../components/Providers";
import { formatCoins } from "../lib/utils";
import { authClient, useSession, signOut } from "@/lib/auth-client";

const AVATAR_STYLES = [
  { id: "adventurer", label: "Adventurer", desc: "Expressive hero" },
  { id: "bottts", label: "Robots", desc: "Tech cyborg" },
  { id: "lorelei", label: "Lorelei", desc: "Artistic portrait" },
  { id: "thumbs", label: "Thumbs", desc: "Playful character" },
  { id: "notionists", label: "Notionist", desc: "Minimalist ink" },
  { id: "identicon", label: "Identicon", desc: "Geometric pattern" },
];

const RANDOM_SEEDS = [
  "Nova", "Cosmo", "Atlas", "Pixel", "Echo", "Orion", "Shadow", "Phoenix",
  "Zenith", "Blaze", "Vortex", "Apex", "Titan", "Solar", "Cyber", "Quantum"
];

export default function ProfilePage() {
  const {
    coins,
    streak,
    unpaidFineCount,
    isLocked,
    notify,
    completedTasks,
    days,
    requireAuth,
  } = useWorkspace();
  const { data: session } = useSession();

  // Profile data from backend
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  // Avatar Studio state
  const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("adventurer");
  const [avatarSeed, setAvatarSeed] = useState("Alex");
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Load user data from /api/workspace
  async function loadProfile() {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfileData(data.user);
          setEditName(data.user.name || "");
          setEditBio(data.user.bio || "");
          if (data.user.name) {
            setAvatarSeed(data.user.name.split(" ")[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const sessionUser = session?.user;
  const displayName = profileData?.name || sessionUser?.name || "Visitor";
  const displayEmail = profileData?.email || sessionUser?.email || "visitor@piz-todo.app";
  const displayImage = profileData?.image || sessionUser?.image;
  const oauthImage = profileData?.oauthImage || (sessionUser?.image && !sessionUser.image.includes("api.dicebear.com") ? sessionUser.image : null);
  const displayBio = profileData?.bio || "Maintaining consistency and stacking coins.";
  const bestStreak = profileData?.bestStreak || streak;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  // Live avatar preview URL
  const previewAvatarUrl = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${encodeURIComponent(
    avatarSeed.trim() || "piz"
  )}`;

  // Save profile name / bio
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!requireAuth("edit profile details")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          payload: {
            name: editName.trim() || displayName,
            bio: editBio.trim() || displayBio,
          },
        }),
      });

      if (!res.ok) throw new Error("Could not update profile");
      const data = await res.json();
      if (data.user) {
        setProfileData((prev) => ({ ...prev, ...data.user }));
      }
      setIsEditingName(false);
      notify("Profile updated", "Your account display name has been saved.", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      notify("Update failed", "Could not save profile changes.", "danger");
    } finally {
      setSaving(false);
    }
  };

  // Save seed-based avatar
  const handleSaveAvatar = async () => {
    if (!requireAuth("save avatar")) return;

    setSavingAvatar(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          payload: {
            image: previewAvatarUrl,
          },
        }),
      });

      if (!res.ok) throw new Error("Could not update avatar");
      const data = await res.json();
      if (data.user) {
        setProfileData((prev) => ({ ...prev, image: data.user.image }));
      }
      setIsAvatarStudioOpen(false);
      notify("Avatar updated", "Your new seed avatar is now active across the app.", "success");
    } catch (err) {
      console.error("Avatar save error:", err);
      notify("Save failed", "Could not save custom avatar.", "danger");
    } finally {
      setSavingAvatar(false);
    }
  };

  // Revert back to Google OAuth avatar
  const handleRevertToOAuth = async () => {
    if (!requireAuth("restore Google photo")) return;

    setSavingAvatar(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-profile",
          payload: {
            resetToOAuth: true,
          },
        }),
      });

      if (!res.ok) throw new Error("Could not restore photo");
      const data = await res.json();
      if (data.user) {
        setProfileData((prev) => ({ ...prev, image: data.user.image }));
      }
      setIsAvatarStudioOpen(false);
      notify("Photo restored", "Switched back to your Google account photo.", "success");
    } catch (err) {
      console.error("Revert error:", err);
      notify("Restore failed", "Could not restore Google photo.", "danger");
    } finally {
      setSavingAvatar(false);
    }
  };

  // Randomize seed
  const handleRandomizeSeed = () => {
    const randomWord = RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)];
    const randomNum = Math.floor(Math.random() * 900) + 100;
    setAvatarSeed(`${randomWord}${randomNum}`);
  };

  // Google OAuth sign in
  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin + "/profile",
      });
    } catch (err) {
      console.error("Google sign in error:", err);
      notify("Sign in failed", "Could not initiate Google authentication.", "danger");
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const accountStanding = isLocked
    ? "Timed Out (4+ Fines)"
    : unpaidFineCount > 0
      ? `At Risk (${unpaidFineCount} unpaid fines)`
      : "Clean Record (Good Standing)";

  const standingTone = isLocked
    ? "text-danger"
    : unpaidFineCount > 0
      ? "text-warning"
      : "text-success";

  return (
    <div className="animate-page mx-auto w-full max-w-4xl space-y-8">
      {/* Page Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-faint">
            Account Management
          </p>
          <h1 className="mt-2 font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
            Profile & <span className="italic text-accent">Identity.</span>
          </h1>
          <p className="mt-1 text-xs text-muted">
            Manage your personal identity, seed-based avatar, and consistency statistics.
          </p>
        </div>

        {sessionUser && (
          <span className="neu-inset-soft inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-success self-start sm:self-auto">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            Connected via Google
          </span>
        )}
      </header>

      {/* Visitor Banner if not authenticated */}
      {!sessionUser && (
        <div className="neu flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px] p-5 border border-accent/20 bg-accent/[0.03]">
          <div>
            <h2 className="text-sm font-semibold text-ink">You are currently browsing as a visitor</h2>
            <p className="mt-0.5 text-xs text-muted">
              Connect your Google account to edit your profile, generate a custom avatar, and save your streak.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="neu-accent inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shrink-0"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <section className="neu rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Avatar and Primary Details */}
          <div className="flex items-start gap-5">
            <div className="relative group">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt={displayName}
                  className="size-20 rounded-2xl border-2 border-accent/30 object-cover shadow-md transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="neu-inset grid size-20 place-items-center rounded-2xl text-xl font-bold tracking-wide text-accent ring-1 ring-accent/20">
                  {initials}
                </div>
              )}

              {/* Change Avatar Button */}
              <button
                type="button"
                onClick={() => setIsAvatarStudioOpen(true)}
                className="neu-button absolute -bottom-2 -right-2 grid size-7 place-items-center rounded-lg text-accent hover:text-ink transition-transform hover:scale-110 shadow-lg"
                title="Customize seed avatar"
              >
                <Sparkles className="size-3.5" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              {!isEditingName ? (
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-normal text-ink truncate">
                      {displayName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="neu-button grid size-7 place-items-center rounded-lg text-muted hover:text-accent transition-colors"
                      title="Edit display name"
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{displayEmail}</p>
                  <p className="text-xs text-faint mt-2 italic">
                    &ldquo;{displayBio}&rdquo;
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3 max-w-md">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.14em] text-faint">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="neu-inset-soft mt-1 w-full rounded-xl px-3 py-2 text-xs text-ink placeholder:text-faint focus:outline-none"
                      placeholder="Your Name"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.14em] text-faint">
                      Bio / Tagline
                    </label>
                    <input
                      type="text"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="neu-inset-soft mt-1 w-full rounded-xl px-3 py-2 text-xs text-ink placeholder:text-faint focus:outline-none"
                      placeholder="Accountability tagline..."
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="neu-accent rounded-xl px-3.5 py-1.5 text-xs font-semibold"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="neu-button rounded-xl px-3 py-1.5 text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex sm:flex-col items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => setIsAvatarStudioOpen(true)}
              className="neu-button inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-accent hover:text-ink transition-colors"
            >
              <Sparkles className="size-3.5" />
              <span>Change Avatar</span>
            </button>

            {sessionUser && (
              <button
                type="button"
                onClick={handleSignOut}
                className="neu-button inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Lifetime Stats Strip */}
        <div className="mt-8 border-t border-white/[0.06] pt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="neu-inset-soft rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-faint">
              Coin Balance
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-bold tabular-nums text-accent">
              <Coins className="size-4" />
              {formatCoins(coins)}
            </p>
            <p className="mt-0.5 text-[10px] text-faint">1 Coin = 1 Tk</p>
          </div>

          <div className="neu-inset-soft rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-faint">
              Active Streak
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-bold tabular-nums text-ink">
              <Flame className="size-4 text-accent" />
              {streak}d
            </p>
            <p className="mt-0.5 text-[10px] text-faint">Best: {bestStreak}d</p>
          </div>

          <div className="neu-inset-soft rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-faint">
              Account Standing
            </p>
            <p className={`mt-1 text-sm font-semibold truncate ${standingTone}`}>
              {unpaidFineCount === 0 ? "Good Record" : `${unpaidFineCount} Fines`}
            </p>
            <p className="mt-0.5 text-[10px] text-faint">Max 4 before lock</p>
          </div>

          <div className="neu-inset-soft rounded-2xl p-4">
            <p className="text-[9px] uppercase tracking-[0.16em] text-faint">
              Completed Tasks
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-bold tabular-nums text-ink">
              <Check className="size-4 text-accent" />
              {completedTasks.length}
            </p>
            <p className="mt-0.5 text-[10px] text-faint">Lifetime finished</p>
          </div>
        </div>
      </section>

      {/* SEED-BASED AVATAR STUDIO MODAL */}
      {isAvatarStudioOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in p-4 sm:p-6"
        >
          <div
            onClick={() => setIsAvatarStudioOpen(false)}
            className="fixed inset-0"
          />
          <div className="flex min-h-full items-center justify-center">
            <div className="neu relative z-10 w-full max-w-md my-auto rounded-[28px] p-6 sm:p-7 shadow-2xl">
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={() => setIsAvatarStudioOpen(false)}
                className="neu-button absolute right-4 top-4 grid size-8 place-items-center rounded-xl text-muted hover:text-ink transition-colors"
              >
                <X className="size-4" />
              </button>

              <div className="text-center pt-2 px-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">
                  Avatar Generator
                </p>
                <h2 className="font-display text-2xl font-normal text-ink mt-1">
                  Customize Your Avatar
                </h2>
                <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                  Pick a style and type any seed name to generate a custom profile picture.
                </p>
              </div>

            {/* Live Preview Display */}
            <div className="mt-4 flex flex-col items-center justify-center">
              <div className="neu-inset p-2.5 rounded-2xl ring-1 ring-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewAvatarUrl}
                  alt="Live Preview"
                  className="size-20 rounded-xl object-cover bg-panel-2 shadow-inner"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-faint">
                Preview: <span className="font-mono text-accent">{selectedStyle} / {avatarSeed || "piz"}</span>
              </p>
            </div>

            {/* Step 1: Choose Style */}
            <div className="mt-4">
              <label className="text-[9px] uppercase tracking-[0.16em] text-faint font-medium">
                1. Select Style
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {AVATAR_STYLES.map((style) => {
                  const active = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex flex-col items-start rounded-xl p-2 text-left transition-all ${
                        active
                          ? "neu-inset text-accent ring-1 ring-accent/30"
                          : "neu-button text-muted hover:text-ink"
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{style.label}</span>
                      <span className="text-[8.5px] text-faint truncate w-full">{style.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Seed Input & Randomizer */}
            <div className="mt-3.5">
              <label className="text-[9px] uppercase tracking-[0.16em] text-faint font-medium">
                2. Seed String
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="e.g. Hero, Galaxy, Rocket..."
                  className="neu-inset-soft flex-1 rounded-xl px-3 py-2 text-xs text-ink placeholder:text-faint focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleRandomizeSeed}
                  className="neu-button inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-accent hover:text-ink transition-colors shrink-0"
                  title="Generate random seed"
                >
                  <Sparkles className="size-3.5" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* Actions: Save & Revert */}
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={savingAvatar}
                className="neu-accent w-full sm:flex-1 py-2 rounded-xl text-xs font-semibold shadow-md"
              >
                {savingAvatar ? "Saving..." : "Save Avatar"}
              </button>

              {oauthImage && (
                <button
                  type="button"
                  onClick={handleRevertToOAuth}
                  disabled={savingAvatar}
                  className="neu-button w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted hover:text-accent transition-colors"
                  title="Restore original Google profile photo"
                >
                  <RotateCcw className="size-3" />
                  <span>Restore Google Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAvatarStudioOpen(false)}
                className="neu-button w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
