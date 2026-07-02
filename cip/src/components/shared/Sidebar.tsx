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
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

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
];

export function Sidebar() {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-primary" />
          <span className="text-sm font-semibold tracking-tight">CIP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.groupKey ?? "top"} className={cn(groupIndex > 0 && "mt-5")}>
            {group.groupKey && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                      <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed select-none">
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                        <span className="ml-auto text-[10px] font-mono uppercase tracking-wide opacity-60">
                          {t("comingSoon")}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.labelKey)}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />
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

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-[11px] bg-primary/15 text-primary font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium leading-none">
              {session?.user?.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground mt-0.5">
              {session?.user?.email}
            </p>
          </div>
          <LanguageSwitcher />
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
