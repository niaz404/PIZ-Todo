"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  LayoutDashboard,
  ListChecks,
  Settings,
  Store,
  User,
  Users,
  X,
} from "./icons";
import { mockNavItems } from "../data/mockData";
import { useSession, authClient } from "@/lib/auth-client";

const navIcons = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  community: Users,
  store: Store,
  profile: User,
  settings: Settings,
};

export default function Sidebar({ pendingTasks, open, onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const navItems = mockNavItems;

  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.origin,
    });
  };

  const navigation = (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onClose} className="flex items-center px-1">
        <span className="font-display text-2xl font-normal tracking-tight text-ink">
          PIZ-Todo
        </span>
      </Link>

      <nav aria-label="Main navigation" className="mt-8 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = navIcons[item.icon] ?? Gift;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                active
                  ? "neu-inset neu-nav-active text-ink"
                  : "neu-nav text-muted hover:text-ink"
              }`}
            >
              <Icon
                className={`size-[17px] transition-colors duration-300 ${
                  active
                    ? "text-accent"
                    : "text-faint group-hover:text-muted"
                }`}
              />
              <span>{item.label}</span>
              {item.href === "/tasks" && pendingTasks > 0 ? (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[9px] tabular-nums ${
                    active
                      ? "text-accent"
                      : "neu-inset-soft text-faint"
                  }`}
                >
                  {pendingTasks}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!isAuthenticated && (
        <div className="pt-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleSignIn}
            className="neu-accent flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs font-semibold shadow-sm"
          >
            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24">
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
            <span>Sign in to Join</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-white/[0.06] bg-transparent px-5 py-6 shadow-[1px_0_0_rgba(255,255,255,0.02),12px_0_32px_-24px_rgba(0,0,0,0.8)] lg:flex lg:flex-col">
        {navigation}
      </aside>

      <div
        inert={!open}
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div
          onClick={onClose}
          className={`absolute inset-0 bg-[#0c0e12]/65 backdrop-blur-[2px] transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-white/[0.06] bg-[#1c2027] px-5 py-6 shadow-[24px_0_56px_-28px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="neu-button absolute right-4 top-5 grid size-8 place-items-center rounded-xl text-muted hover:text-ink"
          >
            <X className="size-4" />
            <span className="sr-only">Close navigation</span>
          </button>
          {navigation}
        </div>
      </div>
    </>
  );
}
