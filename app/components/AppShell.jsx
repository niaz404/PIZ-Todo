"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import GlobalFineBanner from "./GlobalFineBanner";
import { useWorkspace } from "./Providers";

const pageTitles = {
  "/": "Dashboard",
  "/tasks": "Todo",
  "/task": "Todo",
  "/todo": "Todo",
  "/community": "Community",
  "/store": "Store",
  "/guide": "Guide & Docs",
  "/manage": "Management Desk",
  "/profile": "Profile",
};

const pageWidths = {
  "/": "max-w-6xl",
  "/tasks": "max-w-4xl",
  "/task": "max-w-4xl",
  "/todo": "max-w-4xl",
  "/community": "max-w-6xl",
  "/store": "max-w-4xl",
  "/guide": "max-w-5xl",
  "/manage": "max-w-6xl",
  "/profile": "max-w-5xl",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { pendingTasks } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar
          pendingTasks={pendingTasks}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            title={pageTitles[pathname] ?? "PIZ-Todo"}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <GlobalFineBanner />

          <main className="flex-1 px-5 pb-12 pt-8 sm:px-8 lg:px-12 lg:pt-12">
            <div key={pathname}>{children}</div>

            <footer
              className={`mx-auto mt-16 flex w-full ${
                pageWidths[pathname] ?? "max-w-6xl"
              } flex-col gap-2 border-t border-white/[0.07] pt-6 text-[9px] uppercase tracking-[0.18em] text-faint/90 sm:flex-row sm:items-center sm:justify-between`}
            >
              <span>PIZ-Todo</span>
              <span>2026</span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
