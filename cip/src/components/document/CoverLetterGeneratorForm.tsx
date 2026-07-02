"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJobAnalyses } from "@/hooks/useJobAnalyzer";
import { useGenerateCoverLetter } from "@/hooks/useCoverLetters";

export function CoverLetterGeneratorForm() {
  const t = useTranslations("coverLetters.new");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: analyses, isLoading: isLoadingAnalyses } = useJobAnalyses();
  const { mutate: generate, isPending } = useGenerateCoverLetter();

  const [jobDescriptionId, setJobDescriptionId] = useState(searchParams.get("jobId") ?? "");
  const [extraNotes, setExtraNotes] = useState("");

  const handleSubmit = () => {
    if (!jobDescriptionId) return;
    generate({ jobDescriptionId, language: locale, extraNotes: extraNotes.trim() || undefined });
  };

  if (!isLoadingAnalyses && (analyses?.length ?? 0) === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">{t("noAnalyses")}</p>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="space-y-2">
        <Label>{t("jobLabel")}</Label>
        <Select value={jobDescriptionId} onValueChange={setJobDescriptionId} disabled={isLoadingAnalyses}>
          <SelectTrigger>
            <SelectValue placeholder={t("jobPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {analyses?.map((analysis) => (
              <SelectItem key={analysis.id} value={analysis.id}>
                {analysis.company} — {analysis.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("extraNotesLabel")}</Label>
        <Textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          placeholder={t("extraNotesPlaceholder")}
          className="min-h-[100px] text-sm resize-y"
        />
      </div>

      <Button type="button" disabled={!jobDescriptionId || isPending} onClick={handleSubmit}>
        {isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
        {isPending ? t("generating") : t("generate")}
      </Button>
    </div>
  );
}
