"use client";

import { useState } from "react";
import { Sparkles, Loader2, Save, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackPanel } from "@/components/intelligence/FeedbackPanel";
import {
  useProfileTexts,
  useGenerateProfileText,
  useSaveProfileText,
  useEvaluateProfileText,
  type ProfileTextField,
} from "@/hooks/useProfile";
import { VoiceGuideCard } from "./VoiceGuideCard";
import { ResumeDefaultsCard } from "./ResumeDefaultsCard";
import { AiSettingsCard } from "./AiSettingsCard";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

const GUIDED_QUESTION_SETS = {
  shared: ["origin", "teamRole", "curiosity", "lookingFor"],
  strengths: ["teammateFeedback", "crossDomain", "teamStuck", "hiddenSkill"],
} as const;

type GuidedQuestionSet = keyof typeof GUIDED_QUESTION_SETS;

export function ProfileClient() {
  const t = useTranslations("profile");
  const { data, isLoading } = useProfileTexts();

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      {isLoading ? (
        <ExperienceListSkeleton />
      ) : (
        <div className="mt-6 space-y-6">
          <VoiceGuideCard savedText={data?.voiceGuide ?? ""} />
          <ProfileFieldCard
            field="aboutMe"
            title={t("aboutMe.title")}
            description={t("aboutMe.description")}
            savedText={data?.aboutMe ?? ""}
            maxLength={2000}
            guidedQuestionSet="shared"
          />
          <ProfileFieldCard
            field="elevatorPitch"
            title={t("elevatorPitch.title")}
            description={t("elevatorPitch.description")}
            savedText={data?.elevatorPitch ?? ""}
            maxLength={1500}
            guidedQuestionSet="shared"
          />
          <ProfileFieldCard
            field="strengths"
            title={t("strengths.title")}
            description={t("strengths.description")}
            savedText={data?.strengths ?? ""}
            maxLength={2000}
            guidedQuestionSet="strengths"
          />
          <ResumeDefaultsCard />
          <AiSettingsCard savedKey={data?.geminiApiKey ?? ""} />
        </div>
      )}
    </div>
  );
}

function ProfileFieldCard({
  field, title, description, savedText, maxLength, guidedQuestionSet,
}: {
  field: ProfileTextField;
  title: string;
  description: string;
  savedText: string;
  maxLength: number;
  guidedQuestionSet: GuidedQuestionSet;
}) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const guidedQuestionKeys = GUIDED_QUESTION_SETS[guidedQuestionSet];
  const [text, setText] = useState(savedText);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [prevSavedText, setPrevSavedText] = useState(savedText);
  const [showGuidedQuestions, setShowGuidedQuestions] = useState(false);
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(guidedQuestionKeys.map(() => ""));

  const { mutateAsync: generate, isPending: isGenerating } = useGenerateProfileText();
  const { mutate: save, isPending: isSaving } = useSaveProfileText();
  const { mutateAsync: evaluate, isPending: isEvaluating } = useEvaluateProfileText();

  // Sync once the saved value loads from the server — don't clobber in-progress edits on refetch.
  if (savedText !== prevSavedText) {
    setPrevSavedText(savedText);
    setText(savedText);
  }

  const handleGenerate = async () => {
    const filledAnswers = guidedQuestionKeys
      .map((key, i) => ({ question: t(`guidedQuestions.${guidedQuestionSet}.${key}`), answer: guidedAnswers[i].trim() }))
      .filter((qa) => qa.answer.length > 0);

    const result = await generate({
      field,
      language: locale,
      guidedAnswers: filledAnswers.length > 0 ? filledAnswers : undefined,
    });
    if (result) {
      setText(result.text);
      setFeedback(null);
    }
  };

  const handleEvaluate = async () => {
    if (!text.trim()) return;
    const result = await evaluate({ field, draftText: text, language: locale });
    setFeedback(result ?? null);
  };

  const handleSave = () => save({ field, text });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder", { title: title.toLowerCase() })}
          className="min-h-[120px] text-sm resize-y"
        />
        <p className={`text-xs text-right ${text.length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
          {text.length} / {maxLength}
        </p>

        <div className="rounded-md border bg-muted/30">
          <button
            type="button"
            onClick={() => setShowGuidedQuestions((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            {t("guidedQuestions.toggle")}
            {showGuidedQuestions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showGuidedQuestions && (
            <div className="space-y-3 px-3 pb-3">
              <p className="text-xs text-muted-foreground">{t("guidedQuestions.hint")}</p>
              {guidedQuestionKeys.map((key, i) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t(`guidedQuestions.${guidedQuestionSet}.${key}`)}</label>
                  <Textarea
                    value={guidedAnswers[i]}
                    onChange={(e) =>
                      setGuidedAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))
                    }
                    className="min-h-[60px] text-sm resize-y"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isGenerating} onClick={handleGenerate}>
            {isGenerating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {t("generateWithAi")}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!text.trim() || isEvaluating} onClick={handleEvaluate}>
            {isEvaluating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />}
            {t("evaluateWithAi")}
          </Button>
          <Button type="button" size="sm" disabled={!text.trim() || text.length > maxLength || isSaving} onClick={handleSave} className="ml-auto">
            {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {t("save")}
          </Button>
        </div>
        {feedback && <FeedbackPanel feedback={feedback} />}
      </CardContent>
    </Card>
  );
}
