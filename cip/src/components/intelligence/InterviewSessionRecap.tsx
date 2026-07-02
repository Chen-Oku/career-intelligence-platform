"use client";

import { Sparkles, PenLine, SkipForward } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { FeedbackPanel } from "./FeedbackPanel";
import type { InterviewSessionQuestion } from "@/lib/types/interviewSession";

const Q_TYPE_COLORS = {
  BEHAVIORAL: "bg-purple-50 text-purple-700 border-purple-200",
  TECHNICAL: "bg-blue-50 text-blue-700 border-blue-200",
  SITUATIONAL: "bg-teal-50 text-teal-700 border-teal-200",
};

interface InterviewSessionRecapProps {
  role: string;
  questions: InterviewSessionQuestion[];
  completedAt?: string;
  readOnly: boolean;
}

export function InterviewSessionRecap({ role, questions, completedAt, readOnly }: InterviewSessionRecapProps) {
  const t = useTranslations("interview");
  const ANSWERED_VIA_LABEL = {
    "ai-suggested": { label: t("recap.answeredVia.aiSuggested"), icon: Sparkles },
    "own-draft": { label: t("recap.answeredVia.ownDraft"), icon: PenLine },
    "skipped": { label: t("recap.answeredVia.skipped"), icon: SkipForward },
  };
  const answered = questions.filter((q) => q.answeredVia !== "skipped").length;
  const scored = questions.filter((q) => q.feedback !== null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, q) => sum + (q.feedback?.score ?? 0), 0) / scored.length)
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold">
          {readOnly ? t("recap.sessionRecapTitle") : t("recap.interviewCompleteTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("recap.summary", { role, answered, total: questions.length })}
          {avgScore !== null && t("recap.averageScoreSuffix", { score: avgScore })}
          {completedAt && ` · ${new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const via = ANSWERED_VIA_LABEL[q.answeredVia];
          const ViaIcon = via.icon;
          const typeLabel = t(`questionTypes.${q.type.toLowerCase()}`);
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono-data text-xs text-muted-foreground shrink-0 pt-0.5">{i + 1}.</span>
                  <span className="text-sm font-medium leading-snug">{q.question}</span>
                </div>
                <Badge className={`h-5 px-1.5 text-[10px] font-medium border shrink-0 ${Q_TYPE_COLORS[q.type] ?? Q_TYPE_COLORS.BEHAVIORAL}`}>
                  {typeLabel}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ViaIcon className="h-3 w-3" />
                {via.label}
              </div>

              {q.answeredVia !== "skipped" && (
                <p className="text-sm text-foreground/90 leading-relaxed pl-1 border-l-2 border-border ml-1">
                  {q.finalAnswer || <span className="text-muted-foreground italic">{t("recap.noAnswerRecorded")}</span>}
                </p>
              )}

              {q.feedback && <FeedbackPanel feedback={q.feedback} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
