"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gear } from "./icons";
import { useWorkspace } from "./Providers";

const options = [
  {
    value: "section",
    label: "Show finished items in each section",
    description:
      "Completed tasks sit at the bottom of their day. Sections never disappear.",
  },
  {
    value: "together",
    label: "Show all finished items together at bottom",
    description:
      "Completed tasks move to one Finished list. Empty past days disappear.",
  },
];

export default function FinishedModeMenu() {
  const { finishedMode, setFinishedMode } = useWorkspace();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Finished task display settings"
        title="Finished task display"
        className={`grid size-9 place-items-center rounded-xl transition-all duration-300 ${
          open ? "neu-inset text-accent" : "neu-button text-muted hover:text-ink"
        }`}
      >
        <Gear className="size-4" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Finished task settings"
          className="neu absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-5rem))] rounded-2xl p-3"
        >
          <p className="px-1 pb-2 text-[9px] uppercase tracking-[0.2em] text-faint">
            Finished tasks
          </p>

          <div
            role="radiogroup"
            aria-label="How finished tasks are displayed"
            className="space-y-1"
          >
            {options.map((option) => {
              const selected = finishedMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setFinishedMode(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 ${
                    selected ? "bg-white/[0.05]" : "hover:bg-white/[0.035]"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                      selected
                        ? "border-accent bg-accent text-[#17130c]"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block text-[11px] font-medium ${
                        selected ? "text-ink" : "text-muted"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-faint">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
