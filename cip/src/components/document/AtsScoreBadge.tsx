import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AtsScoreBadgeProps {
  score?: number;
  tips?: string[];
}

/**
 * AtsScoreBadge — compact pill for the resume preview's action bar.
 * Same 70/50 emerald/amber/rose thresholds as job-analyzer's ScorePill —
 * the ring (MatchScoreRing) is right for a dedicated result view but too
 * large for this bar.
 */
export function AtsScoreBadge({ score, tips }: AtsScoreBadgeProps) {
  const t = useTranslations("resumes.preview");
  if (score === undefined) return null;

  const color = score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-rose-600 bg-rose-50 border-rose-200";

  const title = tips && tips.length > 0 ? `${t("atsScore")}: ${tips.join(" · ")}` : t("atsScore");

  return (
    <span
      title={title}
      className={cn("inline-flex items-center border rounded-full px-2 py-0.5 font-mono-data text-xs font-semibold", color)}
    >
      {t("atsScoreLabel", { score })}
    </span>
  );
}
