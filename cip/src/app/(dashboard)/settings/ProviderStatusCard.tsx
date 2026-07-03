"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAiProviderStatus } from "@/hooks/useAiProviderStatus";
import { providerDisplayName } from "@/lib/aiProviderDisplay";
import { cn } from "@/lib/utils";

const DOT_COLOR: Record<string, string> = {
  "ai-core": "bg-emerald-500",
  gemini: "bg-blue-500",
  none: "bg-destructive",
};

export function ProviderStatusCard() {
  const t = useTranslations("settings.providerStatus");
  const { data, isLoading, isFetching, refetch } = useAiProviderStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("checking")}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT_COLOR[data?.source ?? "none"])} />
              <div>
                <p className="text-sm font-medium">
                  {data?.source === "none" ? t("unavailable") : providerDisplayName(data?.provider ?? null)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.source === "ai-core" && t("localBadge")}
                  {data?.source === "gemini" && t("cloudBadge")}
                  {data?.model && ` · ${t("model")}: ${data.model}`}
                </p>
              </div>
            </div>
            <Button
              type="button" variant="ghost" size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
              title={t("refresh")}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
            </Button>
          </div>
        )}
        {data?.source === "none" && (
          <p className="mt-3 text-xs text-muted-foreground">{t("unavailableHint")}</p>
        )}
      </CardContent>
    </Card>
  );
}
