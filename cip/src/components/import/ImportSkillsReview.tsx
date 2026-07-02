"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { skillKeys } from "@/hooks/useSkills";
import { SKILL_LEVELS } from "@/lib/validators/skill.schema";
import { LEVEL_LABELS } from "@/lib/types/skill";
import type { ImportedSkills } from "@/lib/types/cvImport";
import type { SkillDTO } from "@/lib/types/skill";
import type { SkillLevel } from "@/domain/career/entities/Skill";
import type { CreateSkillInput } from "@/lib/validators/skill.schema";

interface SkillDraft {
  name: string;
  category: "TECHNICAL" | "SOFT";
  level?: SkillLevel;
  included: boolean;
}

async function postSkill(input: CreateSkillInput): Promise<SkillDTO> {
  const res = await fetch("/api/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed: ${res.status}`);
  return body.data as SkillDTO;
}

/**
 * ImportSkillsReview — checklist of extracted skill names.
 *
 * Doesn't reuse AddSkillDialog — that's a modal built for adding one skill
 * at a time. A flat checklist is the right shape for confirming a batch.
 * Technical skills get a level select (default Intermediate); soft skills
 * don't — they aren't rated by proficiency level.
 */
export function ImportSkillsReview({ skills }: { skills: ImportedSkills }) {
  const t = useTranslations("import");
  const [drafts, setDrafts] = useState<SkillDraft[]>(() => [
    ...skills.technical.map((name) => ({ name, category: "TECHNICAL" as const, level: "INTERMEDIATE" as SkillLevel, included: true })),
    ...skills.soft.map((name) => ({ name, category: "SOFT" as const, included: true })),
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const technical = drafts.filter((d) => d.category === "TECHNICAL");
  const soft = drafts.filter((d) => d.category === "SOFT");
  const includedCount = drafts.filter((d) => d.included).length;

  if (drafts.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{t("skillsReview.noneExtracted")}</p>;
  }

  const updateDraft = (index: number, patch: Partial<SkillDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    let added = 0;
    let skipped = 0;

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      if (!draft.included) continue;

      try {
        await postSkill({
          name: draft.name,
          category: draft.category,
          level: draft.level,
          isPublic: true,
          tags: [],
        });
        added++;
      } catch {
        skipped++;
        // Duplicate name is expected and not worth surfacing per-item —
        // any other failure still counts as "skipped" for this batch.
      } finally {
        updateDraft(i, { included: false });
      }
    }

    queryClient.invalidateQueries({ queryKey: skillKeys.all });
    setIsSaving(false);

    if (added > 0) toast({ title: t("skillsReview.addedToast", { count: added }) });
    if (skipped > 0) toast({ title: t("skillsReview.skippedToast", { count: skipped }), description: t("skillsReview.skippedDescription") });
  };

  return (
    <div className="space-y-6">
      {technical.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {t("skillsReview.technicalSkills")}
          </h3>
          <div className="space-y-2">
            {drafts.map((draft, index) =>
              draft.category === "TECHNICAL" ? (
                <div key={index} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Checkbox
                    checked={draft.included}
                    onCheckedChange={(checked) => updateDraft(index, { included: !!checked })}
                  />
                  <span className="flex-1 text-sm">{draft.name}</span>
                  <Select
                    value={draft.level}
                    onValueChange={(value) => updateDraft(index, { level: value as SkillLevel })}
                    disabled={!draft.included}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder={t("skillsReview.levelPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{LEVEL_LABELS[level]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {soft.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            {t("skillsReview.softSkills")}
          </h3>
          <div className="space-y-2">
            {drafts.map((draft, index) =>
              draft.category === "SOFT" ? (
                <div key={index} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <Checkbox
                    checked={draft.included}
                    onCheckedChange={(checked) => updateDraft(index, { included: !!checked })}
                  />
                  <span className="flex-1 text-sm">{draft.name}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={isSaving || includedCount === 0} className="w-full">
        {isSaving ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("skillsReview.adding")}</>
        ) : (
          t("skillsReview.addSelected", { count: includedCount })
        )}
      </Button>
    </div>
  );
}
