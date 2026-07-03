"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FeedbackPanel } from "@/components/intelligence/FeedbackPanel";
import { InterviewSessionRecap } from "@/components/intelligence/InterviewSessionRecap";
import { useJobAnalysis, useEvaluateAnswer, useRegenerateAnswer } from "@/hooks/useJobAnalyzer";
import { useInterviewSessions, useCreateInterviewSession } from "@/hooks/useInterviewSessions";
import { deriveSessionType } from "@/lib/types/interviewSession";
import { cn } from "@/lib/utils";
import type { InterviewSessionQuestion } from "@/lib/types/interviewSession";

const Q_TYPE_COLORS = {
  BEHAVIORAL: "bg-purple-50 text-purple-700 border-purple-200",
  TECHNICAL: "bg-blue-50 text-blue-700 border-blue-200",
  SITUATIONAL: "bg-teal-50 text-teal-700 border-teal-200",
};

type Screen = "start" | "question" | "end";

export function InterviewSimulatorClient({ jobId }: { jobId: string }) {
  const t = useTranslations("interview");
  const { data: analysis, isLoading } = useJobAnalysis(jobId);
  const { data: pastSessions } = useInterviewSessions(jobId);
  const { mutateAsync: evaluateAnswer, isPending: isEvaluating } = useEvaluateAnswer();
  const { mutateAsync: regenerateAnswer, isPending: isRegenerating } = useRegenerateAnswer();
  const { mutate: createSession } = useCreateInterviewSession(jobId);

  const [screen, setScreen] = useState<Screen>("start");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewSessionQuestion[]>([]);
  const hasSavedRef = useRef(false);

  const questions = analysis?.analyzedData.interviewQuestions ?? [];

  useEffect(() => {
    if (screen === "end" && !hasSavedRef.current && analysis) {
      hasSavedRef.current = true;
      createSession({
        jobDescriptionId: jobId,
        role: analysis.analyzedData.extractedRole,
        questions: answers,
        language: analysis.language as "en" | "es",
        sessionType: deriveSessionType(answers),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><ExperienceListSkeleton /></div>;
  if (!analysis) return null;

  const current = answers[currentIndex];

  const updateCurrent = (patch: Partial<InterviewSessionQuestion>) => {
    setAnswers((prev) => prev.map((a, i) => (i === currentIndex ? { ...a, ...patch } : a)));
  };

  const handleBegin = () => {
    setAnswers(
      questions.map((q) => ({
        question: q.question,
        type: q.type,
        storyHint: q.storyHint ?? null,
        suggestedAnswer: q.suggestedAnswer ?? null,
        finalAnswer: "",
        answeredVia: "skipped",
        feedback: null,
      })),
    );
    setCurrentIndex(0);
    hasSavedRef.current = false;
    setScreen("question");
  };

  const handleUseSuggestion = () => {
    updateCurrent({ finalAnswer: current.suggestedAnswer ?? "", answeredVia: "ai-suggested" });
  };

  const handleRegenerate = async () => {
    const result = await regenerateAnswer({ jobId, questionIndex: currentIndex });
    if (result) updateCurrent({ suggestedAnswer: result.suggestedAnswer });
  };

  const handleGetFeedback = async () => {
    if (!current.finalAnswer.trim()) return;
    const result = await evaluateAnswer({ question: current.question, userAnswer: current.finalAnswer });
    if (result) updateCurrent({ feedback: result });
  };

  if (screen === "start") {
    return (
      <div className="p-6 max-w-3xl mx-auto pb-20">
        <PageHeader
          title={t("pageTitle")}
          description={t("start.description", { count: questions.length, role: analysis.analyzedData.extractedRole })}
        />
        <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("start.intro", { count: questions.length })}
          </p>
          <Button className="mt-5" onClick={handleBegin} disabled={questions.length === 0}>
            {t("start.begin")}
          </Button>
        </div>

        {pastSessions && pastSessions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3">{t("start.pastSessions")}</h3>
            <div className="space-y-2">
              {pastSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/job-analyzer/${jobId}/interview/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm hover:bg-accent transition-colors"
                >
                  <span>{new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-muted-foreground font-mono-data text-xs">{t("start.questionsCount", { count: s.questions.length })}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "end") {
    return (
      <div className="p-6 max-w-3xl mx-auto pb-20">
        <PageHeader title={t("pageTitle")} description={t("end.description")} />
        <div className="mt-6">
          <InterviewSessionRecap role={analysis.analyzedData.extractedRole} questions={answers} readOnly={false} />
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/job-analyzer/${jobId}`}>{t("end.backToAnalysis")}</Link>
          </Button>
          <Button onClick={handleBegin}>{t("end.practiceAgain")}</Button>
        </div>
      </div>
    );
  }

  // screen === "question"
  const typeColor = Q_TYPE_COLORS[current.type] ?? Q_TYPE_COLORS.BEHAVIORAL;
  const typeLabel = t(`questionTypes.${current.type.toLowerCase()}`);

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader title={t("pageTitle")} description={analysis.analyzedData.extractedRole} />

      {/* Progress */}
      <div className="mt-5 flex items-center gap-2">
        <span className="font-mono-data text-xs text-muted-foreground shrink-0">
          {t("question.progress", { current: currentIndex + 1, total: questions.length })}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug">{current.question}</p>
          <Badge className={cn("h-5 px-1.5 text-[10px] font-medium border shrink-0", typeColor)}>
            {typeLabel}
          </Badge>
        </div>

        {current.storyHint && (
          <div className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/15 px-3 py-2.5">
            <span className="text-primary text-sm shrink-0">→</span>
            <p className="text-sm text-primary leading-relaxed">{current.storyHint}</p>
          </div>
        )}

        {/* Suggested answer */}
        <div className={cn("rounded-md border px-3 py-2.5", current.suggestedAnswer ? "bg-emerald-50/50 border-emerald-200/60" : "bg-muted/50 border-border")}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {current.suggestedAnswer ? t("question.suggestedAnswer") : t("question.noMatchingStory")}
              </span>
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground" disabled={isRegenerating} onClick={handleRegenerate}>
              {isRegenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
              {t("question.generateAnotherAnswer")}
            </Button>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {current.suggestedAnswer ?? t("question.noMatchingStoryDetail")}
          </p>
          {current.suggestedAnswer && (
            <Button
              type="button" size="sm" variant={current.answeredVia === "ai-suggested" ? "default" : "outline"}
              className="mt-2.5 h-7 text-xs" onClick={handleUseSuggestion}
            >
              {current.answeredVia === "ai-suggested" && <CheckCircle2 className="mr-1.5 h-3 w-3" />}
              {t("question.useAsMyAnswer")}
            </Button>
          )}
        </div>

        {/* Write your own */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t("question.orWriteYourOwn")}
          </p>
          <Textarea
            value={current.answeredVia === "own-draft" ? current.finalAnswer : ""}
            onChange={(e) => updateCurrent({ finalAnswer: e.target.value, answeredVia: "own-draft", feedback: null })}
            placeholder={t("question.answerPlaceholder")}
            className="min-h-[90px] text-sm resize-y"
          />
          <Button
            type="button" size="sm" className="mt-2"
            disabled={current.answeredVia !== "own-draft" || !current.finalAnswer.trim() || isEvaluating}
            onClick={handleGetFeedback}
          >
            {isEvaluating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("question.evaluating")}</> : t("question.getFeedback")}
          </Button>
        </div>

        {current.feedback && <FeedbackPanel feedback={current.feedback} />}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />{t("question.previous")}
        </Button>
        <Button onClick={() => (currentIndex + 1 < questions.length ? setCurrentIndex((i) => i + 1) : setScreen("end"))}>
          {currentIndex + 1 < questions.length ? <>{t("question.next")}<ChevronRight className="ml-1.5 h-3.5 w-3.5" /></> : t("question.finish")}
        </Button>
      </div>
    </div>
  );
}
