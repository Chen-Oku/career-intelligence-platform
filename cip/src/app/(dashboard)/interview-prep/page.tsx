"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save, ClipboardCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FeedbackPanel } from "@/components/intelligence/FeedbackPanel";
import {
  useInterviewPrepAnswers,
  useGenerateInterviewPrep,
  useSaveInterviewPrep,
  useEvaluateInterviewPrep,
} from "@/hooks/useInterviewPrep";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

const MAX_LENGTH = 2000;

const TYPES: { type: InterviewPrepType; requiresGuidance: boolean }[] = [
  { type: "tellMeAboutYourself", requiresGuidance: false },
  { type: "weakness", requiresGuidance: true },
  { type: "salaryExpectations", requiresGuidance: true },
  { type: "leadershipStory", requiresGuidance: false },
  { type: "conflictStory", requiresGuidance: false },
  { type: "teamworkStory", requiresGuidance: false },
];

export default function InterviewPrepPage() {
  const t = useTranslations("interviewPrep");
  const { data: answers, isLoading } = useInterviewPrepAnswers();

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      {isLoading ? (
        <ExperienceListSkeleton />
      ) : (
        <div className="mt-6 space-y-6">
          {TYPES.map(({ type, requiresGuidance }) => (
            <InterviewPrepCard
              key={type}
              type={type}
              requiresGuidance={requiresGuidance}
              savedText={answers?.find((a) => a.type === type)?.content ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewPrepCard({
  type, requiresGuidance, savedText,
}: { type: InterviewPrepType; requiresGuidance: boolean; savedText: string }) {
  const t = useTranslations("interviewPrep");
  const locale = useLocale();
  const [text, setText] = useState(savedText);
  const [guidanceText, setGuidanceText] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [prevSavedText, setPrevSavedText] = useState(savedText);

  const { mutateAsync: generate, isPending: isGenerating } = useGenerateInterviewPrep();
  const { mutate: save, isPending: isSaving } = useSaveInterviewPrep();
  const { mutateAsync: evaluate, isPending: isEvaluating } = useEvaluateInterviewPrep();

  // Sync once the saved value loads from the server — don't clobber in-progress edits on refetch.
  if (savedText !== prevSavedText) {
    setPrevSavedText(savedText);
    setText(savedText);
  }

  const guidanceQuestion = t(`types.${type}.guidance`);
  const trimmedGuidance = guidanceText.trim();
  const canGenerate = !requiresGuidance || trimmedGuidance.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const guidedAnswers = trimmedGuidance ? [{ question: guidanceQuestion, answer: trimmedGuidance }] : undefined;
    const result = await generate({ type, language: locale, guidedAnswers });
    if (result) {
      setText(result.text);
      setFeedback(null);
    }
  };

  const handleEvaluate = async () => {
    if (!text.trim()) return;
    const result = await evaluate({ type, draftText: text, language: locale });
    setFeedback(result ?? null);
  };

  const handleSave = () => save({ type, text });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`types.${type}.title`)}</CardTitle>
        <CardDescription>{t(`types.${type}.description`)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          className="min-h-[120px] text-sm resize-y"
        />
        <p className={`text-xs text-right ${text.length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
          {text.length} / {MAX_LENGTH}
        </p>

        <div className="space-y-1.5 rounded-md border bg-muted/30 p-3">
          <Label className="text-xs text-muted-foreground">
            {guidanceQuestion}
            {requiresGuidance && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            value={guidanceText}
            onChange={(e) => setGuidanceText(e.target.value)}
            className="min-h-[60px] text-sm resize-y bg-background"
          />
          {requiresGuidance && !canGenerate && (
            <p className="text-xs text-muted-foreground">{t("guidanceRequiredHint")}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isGenerating || !canGenerate} onClick={handleGenerate}>
            {isGenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {t("generateWithAi")}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!text.trim() || isEvaluating} onClick={handleEvaluate}>
            {isEvaluating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />}
            {t("evaluateWithAi")}
          </Button>
          <Button type="button" size="sm" disabled={!text.trim() || text.length > MAX_LENGTH || isSaving} onClick={handleSave} className="ml-auto">
            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {t("save")}
          </Button>
        </div>
        {feedback && <FeedbackPanel feedback={feedback} />}
      </CardContent>
    </Card>
  );
}
