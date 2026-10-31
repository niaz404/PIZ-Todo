"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";
import LoginView from "./LoginView";
import { useWorkspace } from "./Providers";
import { useSession } from "@/lib/auth-client";

const pageTitles = {
  "/": "Dashboard",
  "/tasks": "Todo",
  "/community": "Community",
  "/store": "Store",
  "/profile": "Profile",
};

const pageWidths = {
  "/": "max-w-6xl",
  "/tasks": "max-w-4xl",
  "/community": "max-w-6xl",
  "/store": "max-w-4xl",
  "/profile": "max-w-5xl",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingTasks } = useWorkspace();
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Visitor Guard: Unauthenticated visitors can ONLY view the /community page
  useEffect(() => {
    if (!isPending && !session?.user && pathname !== "/community") {
      router.replace("/community");
    }
  }, [isPending, session, pathname, router]);

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

  // Loading indicator while session resolves
  if (isPending || (!session?.user && pathname !== "/community")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-faint">
            Loading PIZ-Todo...
          </p>
        </div>
      </div>
    );
  }

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
