"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

/** FeedbackPanel — renders AI coaching feedback (score, strengths, improvements, rewrite). */
export function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  const t = useTranslations("common.feedbackPanel");
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="font-mono-data text-sm font-semibold">{feedback.score}/100</span>
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full", feedback.score >= 70 ? "bg-emerald-500" : feedback.score >= 40 ? "bg-amber-500" : "bg-rose-500")}
            style={{ width: `${feedback.score}%` }}
          />
        </div>
      </div>

      {feedback.strengths.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">{t("strengths")}</p>
          <ul className="space-y-1">
            {feedback.strengths.map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2">
                <span className="text-emerald-500 shrink-0">+</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.improvements.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 mb-1">{t("improve")}</p>
          <ul className="space-y-1">
            {feedback.improvements.map((s, i) => (
              <li key={i} className="text-sm text-foreground/90 flex gap-2">
                <span className="text-amber-500 shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.rewrittenSuggestion && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{t("rewrittenSuggestion")}</p>
          <p className="text-sm text-foreground/90 leading-relaxed italic">{feedback.rewrittenSuggestion}</p>
        </div>
      )}
    </div>
  );
}
