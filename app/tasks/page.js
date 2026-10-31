"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Coins,
  Lock,
} from "../components/icons";
import TodoTaskRow from "../components/TodoTaskRow";
import { useWorkspace } from "../components/Providers";
import { ECONOMY } from "../lib/economy";
import {
  formatCoins,
  formatFullDate,
  formatSectionDate,
  formatShortDate,
} from "../lib/utils";

const COLLAPSED_STORAGE_KEY = "linkup.todo.collapsed.v1";

export default function TodoPage() {
  const {
    days,
    todayDay,
    completedTasks,
    availableTodayCoins,
    finishedMode,
    isLocked,
    unpaidFineCount,
    totalOutstanding,
    maxUnpaidFines,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
  } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const addInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCollapsedSections(
            new Set(parsed.filter((key) => typeof key === "string")),
          );
        }
      } catch {
        // Ignore malformed or unavailable storage.
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isTyping) return;

      const settingsOpen = Boolean(
        document.querySelector(
          '[role="dialog"][aria-label="Finished task settings"]',
        ),
      );
      const navigationOpen =
        document
          .querySelector('[role="dialog"][aria-label="Navigation"]')
          ?.closest("[inert]") === null;
      if (settingsOpen || navigationOpen) return;

      if (event.key === "/" || event.key.toLowerCase() === "n") {
        event.preventDefault();
        addInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleAdd = (event) => {
    event.preventDefault();
    if (isLocked || !draft.trim()) return;
    addTask(draft);
    setDraft("");
  };

  const toggleSection = (key) => {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);

      try {
        window.localStorage.setItem(
          COLLAPSED_STORAGE_KEY,
          JSON.stringify([...next]),
        );
      } catch {
        // Ignore unavailable storage.
      }

      return next;
    });
  };

  const todayKey = todayDay.date;
  const hasAnyTasks = days.some((day) => day.tasks.length > 0);

  const sections = days
    .filter(
      (day) =>
        day.tasks.length > 0 || (day.date === todayKey && hasAnyTasks),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day) => ({
      day,
      openTasks: day.tasks.filter((task) => !task.done),
      doneTasks: day.tasks.filter((task) => task.done),
    }))
    .filter((section) =>
      finishedMode === "section"
        ? true
        : section.openTasks.length > 0 || section.day.date === todayKey,
    );

  const showFinishedSection =
    finishedMode === "together" && completedTasks.length > 0;
  const isEmpty = sections.length === 0 && !showFinishedSection;
  const finishedCollapsed = collapsedSections.has("finished");

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="sr-only">Todo</h1>

      <div className="animate-page">
        <form
          onSubmit={handleAdd}
          className="neu rounded-[24px] p-2.5 sm:p-3"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="neu-inset relative min-w-0 flex-1 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="new-task"
                  className="text-[9px] uppercase tracking-[0.18em] text-faint"
                >
                  Add to today
                </label>
                <kbd
                  aria-hidden="true"
                  className="hidden rounded border border-white/[0.08] bg-white/[0.02] px-1.5 py-0.5 text-[8px] font-medium leading-none text-faint/80 sm:inline-block"
                >
                  /
                </kbd>
              </div>
              <input
                ref={addInputRef}
                id="new-task"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    setDraft("");
                    event.currentTarget.blur();
                  }
                }}
                placeholder="What needs doing today?"
                aria-label="New task for today"
                aria-keyshortcuts="/"
                className="peer mt-0.5 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent transition duration-200 peer-focus:ring-accent/40"
              />
            </div>

            <button
              type="submit"
              disabled={!draft.trim()}
              className="neu-accent shrink-0 rounded-xl px-4 py-2.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add task
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-4">
          {sections.map(({ day, openTasks, doneTasks }) => {
            const isToday = day.date === todayKey;
            const isCollapsed =
              !isToday && collapsedSections.has(day.date);
            const sectionBody = (
              <>
                {isToday && openTasks.length === 0 && doneTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.07] px-3 py-4 text-center text-[11px] text-faint">
                    Nothing planned for today yet. Add a task above.
                  </p>
                ) : null}

                {isToday &&
                openTasks.length === 0 &&
                finishedMode === "together" &&
                doneTasks.length > 0 ? (
                  <p className="rounded-xl border border-dashed border-white/[0.07] px-3 py-4 text-center text-[11px] text-faint">
                    All done for today. Finished tasks are below.
                  </p>
                ) : null}

                {openTasks.map((task) => (
                  <TodoTaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                  />
                ))}

                {finishedMode === "section" && doneTasks.length > 0 ? (
                  <div
                    className={`flex items-center gap-3 px-2 pb-1 ${
                      openTasks.length > 0 ? "pt-3" : "pt-1"
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-[0.18em] text-faint">
                      Finished
                    </span>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[10px] tabular-nums text-faint">
                      {doneTasks.length}
                    </span>
                  </div>
                ) : null}

                {finishedMode === "section"
                  ? doneTasks.map((task) => (
                      <TodoTaskRow
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                      />
                    ))
                  : null}
              </>
            );

            return (
              <section key={day.id} className="neu rounded-[28px] p-3 sm:p-5">
                <header className="flex flex-wrap items-end justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-faint">
                      {isToday ? "Current day" : "Day"}
                    </p>
                    <h2
                      className={`mt-1 font-display font-normal tracking-[-0.01em] text-ink ${
                        isToday ? "text-xl" : "text-[17px] sm:text-xl"
                      }`}
                    >
                      {isToday ? "Today" : formatSectionDate(day.date)}
                    </h2>
                    {isToday ? (
                      <p className="mt-1 text-[10px] text-faint">
                        {formatFullDate(day.date)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-[10px] tabular-nums text-faint">
                      <span>{openTasks.length} open</span>
                      {finishedMode === "section" ? (
                        <>
                          <span className="size-0.5 rounded-full bg-faint/50" />
                          <span>{doneTasks.length} finished</span>
                        </>
                      ) : null}
                    </div>

                    {!isToday ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(day.date)}
                        aria-expanded={!isCollapsed}
                        aria-controls={`section-${day.id}`}
                        aria-label={`${
                          isCollapsed ? "Expand" : "Collapse"
                        } ${formatSectionDate(day.date)}`}
                        title={isCollapsed ? "Expand day" : "Collapse day"}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink"
                      >
                        <ChevronDown
                          className={`size-4 transition-transform duration-300 ${
                            isCollapsed ? "-rotate-90" : ""
                          }`}
                        />
                      </button>
                    ) : null}
                  </div>
                </header>

                {isToday ? (
                  <div className="mt-4 space-y-2">{sectionBody}</div>
                ) : (
                  <div
                    id={`section-${day.id}`}
                    inert={isCollapsed}
                    aria-hidden={isCollapsed}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                      isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2 pt-4">{sectionBody}</div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {showFinishedSection ? (
            <section className="neu rounded-[28px] p-3 sm:p-5">
              <header className="flex flex-wrap items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-faint">
                    Archive
                  </p>
                  <h2 className="mt-1 font-display text-xl font-normal tracking-[-0.01em] text-ink">
                    Finished tasks
                  </h2>
                  <p className="mt-1 text-[10px] text-faint">
                    Everything completed, newest first.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="neu-inset-soft rounded-full px-2.5 py-1 text-[10px] tabular-nums text-faint">
                    {completedTasks.length} done
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSection("finished")}
                    aria-expanded={!finishedCollapsed}
                    aria-controls="finished-tasks-section"
                    aria-label={`${
                      finishedCollapsed ? "Expand" : "Collapse"
                    } finished tasks`}
                    title={
                      finishedCollapsed
                        ? "Expand finished tasks"
                        : "Collapse finished tasks"
                    }
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-faint transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink"
                  >
                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${
                        finishedCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
              </header>

              <div
                id="finished-tasks-section"
                inert={finishedCollapsed}
                aria-hidden={finishedCollapsed}
                className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                  finishedCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-2 pt-4">
                    {completedTasks.map((task) => (
                      <TodoTaskRow
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                        dateLabel={formatShortDate(task.date)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {isEmpty ? (
            <section className="neu rounded-[28px] px-5 py-10 text-center">
              <span className="neu-inset mx-auto grid size-12 place-items-center rounded-2xl text-accent">
                <Check className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-xl font-normal text-ink">
                Nothing on the list yet.
              </h2>
              <p className="mt-2 text-xs text-muted">
                Add your first task above — it lands in Today.
              </p>
            </section>
          ) : null}
        </div>

        <p className="mt-5 px-1 text-[9px] uppercase tracking-[0.18em] text-faint/80">
          {formatCoins(availableTodayCoins)} coins waiting in today&apos;s open
          tasks
        </p>
      </div>
    </div>
  );
}
