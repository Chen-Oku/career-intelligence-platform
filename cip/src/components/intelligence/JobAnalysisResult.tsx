"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, CheckCircle2, XCircle, Trash2, FileText, Mail, Sparkles, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MatchScoreRing } from "./MatchScoreRing";
import { FeedbackPanel } from "./FeedbackPanel";
import { useDeleteJobAnalysis, useEvaluateAnswer, useRegenerateAnswer } from "@/hooks/useJobAnalyzer";
import { cn } from "@/lib/utils";
import type { JobDescriptionDTO, InterviewQuestion } from "@/lib/types/job";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

const Q_TYPE_COLORS = {
  BEHAVIORAL:   "bg-purple-50 text-purple-700 border-purple-200",
  TECHNICAL:    "bg-blue-50 text-blue-700 border-blue-200",
  SITUATIONAL:  "bg-teal-50 text-teal-700 border-teal-200",
};

/**
 * JobAnalysisResult — rich analysis display.
 *
 * Information hierarchy:
 * 1. Match score (most important signal — is this worth applying?)
 * 2. Skill gap (what to address immediately)
 * 3. Interview prep (actionable, time-sensitive)
 * 4. Resume tips (how to tailor before applying)
 * 5. Hiring insights (context for cover letter / interview mindset)
 */
export function JobAnalysisResult({ analysis }: { analysis: JobDescriptionDTO }) {
  const t = useTranslations("jobAnalyzer");
  const { mutate: deleteAnalysis, isPending: isDeleting } = useDeleteJobAnalysis();
  const data = analysis.analyzedData;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">{data.extractedRole || analysis.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {analysis.company}
            {data.yearsRequired && ` ${t("result.yearsRequired", { years: data.yearsRequired })}`}
            <span className="font-mono-data ml-2">
              · {new Date(analysis.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </p>
          {data.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.keywords.slice(0, 8).map((kw) => (
                <Badge key={kw} variant="outline" className="h-5 px-2 text-[11px] text-muted-foreground">{kw}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/resumes/new?jobId=${analysis.id}`}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />{t("result.generateTailoredResume")}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cover-letters/new?jobId=${analysis.id}`}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />{t("result.generateCoverLetter")}
            </Link>
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteAnalysis(analysis.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── Score + Skills grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-start">
        <MatchScoreRing score={analysis.matchScore ?? 0} size={140} />

        <div className="space-y-4">
          {/* Matched */}
          {data.matchedSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {t("result.youHave", { count: data.matchedSkills.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.matchedSkills.map((s) => (
                  <Badge key={s} className="h-6 px-2.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                    {s}
                  </Badge>
                ))}
                {data.matchedNiceToHave.length > 0 && data.matchedNiceToHave.map((s) => (
                  <Badge key={s} className="h-6 px-2.5 text-xs bg-emerald-50/50 text-emerald-600 border border-emerald-100">
                    {s} ✓
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {data.missingSkills.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  {t("result.gapsToClose", { count: data.missingSkills.length })}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.missingSkills.map((s) => (
                  <Badge key={s} className="h-6 px-2.5 text-xs bg-rose-50 text-rose-600 border border-rose-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Interview Questions ─────────────────────────────────── */}
      {data.interviewQuestions.length > 0 && (
        <ResultSection
          icon="🎤"
          title={t("result.interviewQuestions")}
          count={data.interviewQuestions.length}
          action={
            <Button asChild size="sm" className="ml-auto">
              <Link href={`/job-analyzer/${analysis.id}/interview`}>{t("result.startMockInterview")}</Link>
            </Button>
          }
        >
          <div className="space-y-2">
            {data.interviewQuestions.map((q, i) => (
              <QuestionAccordion key={i} question={q} index={i + 1} jobId={analysis.id} questionIndex={i} />
            ))}
          </div>
        </ResultSection>
      )}

      {/* ── Resume Tips ─────────────────────────────────────────── */}
      {data.resumeTips.length > 0 && (
        <ResultSection icon="✏️" title={t("result.resumeTips")} count={data.resumeTips.length}>
          <ul className="space-y-2">
            {data.resumeTips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-mono-data text-muted-foreground shrink-0 pt-0.5">{i + 1}.</span>
                <span className="text-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </ResultSection>
      )}

      {/* ── Hiring Insights ─────────────────────────────────────── */}
      {data.hiringInsights.length > 0 && (
        <ResultSection icon="💡" title={t("result.hiringInsights")} count={data.hiringInsights.length}>
          <div className="space-y-3">
            {data.hiringInsights.map((insight, i) => (
              <div key={i} className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200/60 px-4 py-3">
                <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {/* ── Responsibilities ──────────────────────────────────────── */}
      {data.responsibilities.length > 0 && (
        <ResultSection icon="📋" title={t("result.whatYoullDo")}>
          <ul className="space-y-1.5">
            {data.responsibilities.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-border">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </ResultSection>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultSection({
  icon, title, count, action, children,
}: {
  icon: string;
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden>{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {count !== undefined && (
          <span className="font-mono-data text-xs text-muted-foreground">({count})</span>
        )}
        <div className="flex-1 h-px bg-border" />
        {action}
      </div>
      {children}
    </div>
  );
}

function QuestionAccordion({
  question, index, jobId, questionIndex,
}: { question: InterviewQuestion; index: number; jobId: string; questionIndex: number }) {
  const t = useTranslations("jobAnalyzer");
  const [open, setOpen] = useState(false);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [suggestedAnswer, setSuggestedAnswer] = useState(question.suggestedAnswer);
  const { mutateAsync: evaluateAnswer, isPending: isEvaluating } = useEvaluateAnswer();
  const { mutateAsync: regenerateAnswer, isPending: isRegenerating } = useRegenerateAnswer();
  const typeColor = Q_TYPE_COLORS[question.type] ?? Q_TYPE_COLORS.BEHAVIORAL;
  const typeLabel = t(`questionTypes.${question.type.toLowerCase()}`);

  const handleGetFeedback = async () => {
    if (!draftAnswer.trim()) return;
    const result = await evaluateAnswer({ question: question.question, userAnswer: draftAnswer });
    setFeedback(result ?? null);
  };

  const handleRegenerateAnswer = async () => {
    const result = await regenerateAnswer({ jobId, questionIndex });
    if (result) setSuggestedAnswer(result.suggestedAnswer);
  };

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card overflow-hidden transition-shadow",
      open && "shadow-sm",
    )}>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="font-mono-data text-xs text-muted-foreground shrink-0 pt-0.5">{index}.</span>
          <span className="text-sm font-medium leading-snug">{question.question}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("h-5 px-1.5 text-[10px] font-medium border", typeColor)}>
            {typeLabel}
          </Badge>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/50 space-y-3">
          {question.storyHint && (
            <div className="flex items-start gap-2 mt-3 rounded-md bg-primary/5 border border-primary/15 px-3 py-2.5">
              <span className="text-primary text-sm shrink-0">→</span>
              <p className="text-sm text-primary leading-relaxed">{question.storyHint}</p>
            </div>
          )}

          {/* Suggested answer — grounded only in the candidate's real data */}
          <div className={cn("mt-3 rounded-md border px-3 py-2.5", suggestedAnswer ? "bg-emerald-50/50 border-emerald-200/60" : "bg-muted/50 border-border")}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {suggestedAnswer ? t("result.suggestedAnswer") : t("result.noMatchingStory")}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                disabled={isRegenerating}
                onClick={handleRegenerateAnswer}
              >
                {isRegenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                {t("result.generateAnotherAnswer")}
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {suggestedAnswer ?? t("result.noMatchingStoryDetail")}
            </p>
          </div>

          {/* Write your own answer + get feedback */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {t("result.practiceOwnAnswer")}
            </p>
            <Textarea
              value={draftAnswer}
              onChange={(e) => setDraftAnswer(e.target.value)}
              placeholder={t("result.answerPlaceholder")}
              className="min-h-[90px] text-sm resize-y"
            />
            <Button
              type="button"
              size="sm"
              className="mt-2"
              disabled={!draftAnswer.trim() || isEvaluating}
              onClick={handleGetFeedback}
            >
              {isEvaluating ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("result.evaluating")}</>
              ) : (
                t("result.getFeedback")
              )}
            </Button>
          </div>

          {feedback && <FeedbackPanel feedback={feedback} />}
        </div>
      )}
    </div>
  );
}
