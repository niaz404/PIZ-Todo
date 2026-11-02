import Link from "next/link";
import { ArrowRight, LayoutDashboard, ListChecks } from "./components/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="neu max-w-md w-full rounded-[32px] p-8 sm:p-10 border border-white/[0.06] shadow-2xl">
        <span className="neu-inset inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent rounded-full">
          404 · Page Not Found
        </span>
        <h1 className="mt-5 font-display text-3xl font-normal text-ink sm:text-4xl">
          Lost in Space
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          The page or route you are looking for does not exist or has been moved.
          Let&apos;s get you back to your tasks.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="neu-accent inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-semibold"
          >
            <LayoutDashboard className="size-3.5" />
            <span>Dashboard</span>
            <ArrowRight className="size-3" />
          </Link>

          <Link
            href="/tasks"
            className="neu-button inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-medium text-muted hover:text-ink transition-colors"
          >
            <ListChecks className="size-3.5 text-accent" />
            <span>Open Todo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

