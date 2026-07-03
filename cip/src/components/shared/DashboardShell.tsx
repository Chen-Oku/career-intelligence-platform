"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

const COLLAPSED_STORAGE_KEY = "cip-sidebar-collapsed";

/**
 * DashboardShell — client wrapper that owns the sidebar UI state so the
 * dashboard layout can stay a Server Component (it keeps the auth check).
 *
 * Two independent pieces of state:
 * - `collapsed` (desktop, ≥lg): sidebar shrinks to an icons-only rail.
 *   Persisted to localStorage so the choice survives reloads.
 * - `mobileOpen` (<lg): sidebar is hidden off-canvas and slides in as a
 *   drawer over a backdrop. Closes on navigation and on backdrop tap.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate the persisted desktop collapse preference after mount (localStorage
  // isn't available during SSR). Rendering the default first and correcting it
  // post-mount is the recommended way to sync a client-only value without a
  // hydration mismatch — hence the deliberate setState in this effect.
  useEffect(() => {
    if (localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing persisted client-only pref after mount
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  };

  // Any navigation closes the mobile drawer — syncing UI to the external
  // route state, which is exactly what this effect is for.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the drawer in response to a route change
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile top bar — only below lg, where the sidebar is a drawer. */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t("openMenu")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-primary" />
          <span className="text-sm font-semibold tracking-tight">CIP</span>
        </div>
      </header>

      {/* Backdrop behind the mobile drawer. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className="min-w-0 flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        {children}
      </main>

      {/* Mounted at the shell level so the chat and its transcript persist
          while navigating between dashboard sections. */}
      <AssistantWidget />
    </div>
  );
}
