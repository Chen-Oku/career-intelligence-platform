"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { resumeTypePresetKeys } from "@/hooks/useResumeTypePresets";
import type { CandidateResumeTypePreset } from "@/infrastructure/ai/gemini/ResumeTypePresetSuggesterService";

/**
 * ResumeTypePresetSuggestionDialog — reviews AI-proposed presets and adds
 * the confirmed ones through the normal POST /api/resume-type-presets (so
 * uniqueness/validation still apply). Mirrors SkillDetectionDialog's
 * checklist/apply shape, including its raw-fetch loop (not the create
 * mutation, which would toast once per item) — but every row starts
 * checked here, since these are explicit proposals the user asked for via
 * "Suggest with AI", not near-duplicate warnings requiring deliberate opt-in.
 */
export function ResumeTypePresetSuggestionDialog({
  open,
  onOpenChange,
  candidates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: CandidateResumeTypePreset[];
}) {
  const t = useTranslations("profile.resumeTypePresets.suggest");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [checked, setChecked] = useState<Record<number, boolean>>(
    () => Object.fromEntries(candidates.map((_, i) => [i, true])),
  );
  const [isAdding, setIsAdding] = useState(false);

  const selectedCount = candidates.filter((_, i) => checked[i]).length;

  const addSelected = async () => {
    setIsAdding(true);
    let added = 0;
    let failed = 0;

    for (const [i, candidate] of candidates.entries()) {
      if (!checked[i]) continue;
      const res = await fetch("/api/resume-type-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      });
      if (res.ok) added++;
      else failed++;
    }

    setIsAdding(false);
    queryClient.invalidateQueries({ queryKey: resumeTypePresetKeys.all });
    toast({
      title: t("resultToast", { added }),
      ...(failed > 0 ? { description: t("resultFailed", { failed }), variant: "destructive" as const } : {}),
    });
    if (failed === 0) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("dialogTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        )}

        {candidates.length > 0 && (
          <>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {candidates.map((candidate, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md border border-border px-3 py-2">
                  <Checkbox
                    className="mt-0.5"
                    checked={checked[i] ?? false}
                    onCheckedChange={(value) => setChecked((prev) => ({ ...prev, [i]: value === true }))}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{candidate.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{candidate.focus}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {t("selectedCount", { count: selectedCount, total: candidates.length })}
              </p>
              <Button size="sm" onClick={addSelected} disabled={selectedCount === 0 || isAdding}>
                {isAdding && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("addSelected", { count: selectedCount })}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
