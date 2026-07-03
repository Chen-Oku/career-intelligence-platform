"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAiProviderStatus } from "@/hooks/useAiProviderStatus";
import { providerDisplayName } from "@/lib/aiProviderDisplay";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<string, string> = {
  "ai-core": "bg-emerald-500",
  gemini: "bg-blue-500",
  none: "bg-destructive",
};

/** Persistent indicator of which AI engine is currently serving completions — links to /settings. */
export function AiEngineBadge({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations("sidebar");
  const { data, isLoading } = useAiProviderStatus();

  const label = isLoading
    ? t("aiEngineChecking")
    : data?.source === "none"
      ? t("aiEngineUnavailable")
      : providerDisplayName(data?.provider ?? null);

  return (
    <Link
      href="/settings"
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        collapsed && "lg:justify-center lg:px-0",
      )}
      title={collapsed ? label : data?.model ?? undefined}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          isLoading ? "bg-muted-foreground/40" : DOT_COLOR[data?.source ?? "none"],
        )}
      />
      <span className={cn("truncate", collapsed && "lg:hidden")}>{label}</span>
    </Link>
  );
}
