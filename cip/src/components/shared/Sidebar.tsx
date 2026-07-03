"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Briefcase,
  FolderOpen,
  Zap,
  BookOpen,
  FileText,
  Mail,
  MessageCircleQuestion,
  Search,
  Upload,
  User,
  Award,
  GraduationCap,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { AiEngineBadge } from "@/components/shared/AiEngineBadge";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

interface NavGroup {
  /** Group heading key in sidebar.json, or null for the ungrouped top item(s). */
  groupKey: string | null;
  items: NavItem[];
}

/**
 * Navigation mirrors the platform's workflow as numbered steps:
 * 1. feed your knowledge base → 2. generate documents → 3. target & prepare.
 * The dashboard uses the same grouping — keep them in sync.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: null,
    items: [{ href: "/", labelKey: "dashboard", icon: LayoutDashboard }],
  },
  {
    groupKey: "groupBuild",
    items: [
      { href: "/import", labelKey: "importCv", icon: Upload },
      { href: "/experience", labelKey: "experience", icon: Briefcase },
      { href: "/projects", labelKey: "projects", icon: FolderOpen },
      { href: "/skills", labelKey: "skills", icon: Zap },
      { href: "/certifications", labelKey: "certifications", icon: Award },
      { href: "/education", labelKey: "education", icon: GraduationCap },
      { href: "/stories", labelKey: "storyBank", icon: BookOpen },
      { href: "/profile", labelKey: "profile", icon: User },
    ],
  },
  {
    groupKey: "groupGenerate",
    items: [
      { href: "/resumes", labelKey: "resumes", icon: FileText },
      { href: "/cover-letters", labelKey: "coverLetters", icon: Mail },
    ],
  },
  {
    groupKey: "groupApply",
    items: [
      { href: "/job-analyzer", labelKey: "jobAnalyzer", icon: Search },
      { href: "/interview-prep", labelKey: "interviewPrep", icon: MessageCircleQuestion },
    ],
  },
  {
    groupKey: null,
    items: [{ href: "/settings", labelKey: "settings", icon: Settings }],
  },
];

interface SidebarProps {
  /** Desktop (≥lg): render as an icons-only rail. */
  collapsed: boolean;
  /** Toggle the desktop collapsed state. */
  onToggleCollapsed: () => void;
  /** Mobile (<lg): whether the off-canvas drawer is open. */
  mobileOpen: boolean;
  /** Close the mobile drawer. */
  onCloseMobile: () => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const { data: session } = useSession();

  // `collapsed` only applies on desktop (≥lg). On mobile the sidebar is a
  // full-width drawer, so labels must always show there — hence the collapsed
  // visuals are gated behind `lg:` and the drawer is never collapsed.
  const hideOnCollapse = collapsed ? "lg:hidden" : "";

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <aside
      className={cn(
        "z-50 flex h-screen flex-col border-r border-border bg-card transition-[width,transform] duration-200 ease-in-out",
        // Mobile (<lg): fixed off-canvas drawer, full sidebar width.
        "fixed inset-y-0 left-0 w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop (≥lg): part of the flex flow; width follows collapsed state.
        "lg:static lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-60",
      )}
    >
      {/* Logo + mobile close */}
      <div
        className={cn(
          "flex h-14 items-center justify-between border-b border-border px-5",
          collapsed && "lg:px-0 lg:justify-center",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 shrink-0 rounded bg-primary" />
          <span className={cn("text-sm font-semibold tracking-tight", hideOnCollapse)}>
            CIP
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t("closeMenu")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.groupKey ?? `ungrouped-${groupIndex}`} className={cn(groupIndex > 0 && "mt-5")}>
            {group.groupKey && (
              <p
                className={cn(
                  "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70",
                  hideOnCollapse,
                )}
              >
                {t(group.groupKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    {item.comingSoon ? (
                      <div
                        title={collapsed ? t(item.labelKey) : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed select-none",
                          collapsed && "lg:justify-center lg:px-2",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className={hideOnCollapse}>{t(item.labelKey)}</span>
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-mono uppercase tracking-wide opacity-60",
                            hideOnCollapse,
                          )}
                        >
                          {t("comingSoon")}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        title={collapsed ? t(item.labelKey) : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          collapsed && "lg:justify-center lg:px-2",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className={hideOnCollapse}>{t(item.labelKey)}</span>
                        {isActive && (
                          <ChevronRight
                            className={cn("ml-auto h-3.5 w-3.5 opacity-60", hideOnCollapse)}
                          />
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only. */}
      <div className="hidden border-t border-border p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? t("expand") : t("collapse")}
          aria-label={collapsed ? t("expand") : t("collapse")}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-2",
          )}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 shrink-0" />
              <span>{t("collapse")}</span>
            </>
          )}
        </button>
      </div>

      {/* Active AI engine */}
      <div className="border-t border-border px-3 py-2">
        <AiEngineBadge collapsed={collapsed} />
      </div>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-2",
            collapsed && "lg:flex-col lg:gap-2 lg:px-0",
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[11px] bg-primary/15 text-primary font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex-1 min-w-0", hideOnCollapse)}>
            <p className="truncate text-xs font-medium leading-none">
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground mt-0.5">
              {session?.user?.email}
            </p>
          </div>
          <div className={cn("shrink-0", hideOnCollapse)}>
            <LanguageSwitcher />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={t("signOut")}
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
