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

  const navigation = (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onClose} className="flex items-center px-1">
        <span className="font-display text-2xl font-normal tracking-tight text-ink">
          PIZ-Todo
        </span>
      </Link>

      <nav aria-label="Main navigation" className="mt-8 space-y-1.5">
        {mockNavItems.map((item) => {
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
