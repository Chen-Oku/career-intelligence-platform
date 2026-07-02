"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSkillCandidates, skillKeys } from "@/hooks/useSkills";
import { SKILL_CATEGORIES, SKILL_LEVELS } from "@/lib/validators/skill.schema";
import type { SkillCandidate } from "@/application/career/DetectSkillCandidates";

interface RowState {
  checked: boolean;
  category: (typeof SKILL_CATEGORIES)[number];
  level: (typeof SKILL_LEVELS)[number];
}

interface CandidateRow extends RowState {
  candidate: SkillCandidate;
}

const defaultRowState = (candidate: SkillCandidate): RowState => ({
  // Near-duplicates start unchecked — adding them should be deliberate.
  checked: !candidate.similarTo,
  category: "TECHNICAL",
  level: "INTERMEDIATE",
});

/**
 * SkillDetectionDialog — reviews skill mentions found in Experience/Project/
 * Story data that aren't in the Skill table, and adds the confirmed ones
 * through the normal POST /api/skills (so uniqueness checks still apply).
 *
 * Candidates similar to an existing skill ("React" vs "React.js") start
 * unchecked with a warning — adding them is possible but deliberate.
 */
export function SkillDetectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("skills");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: candidates, isLoading } = useSkillCandidates(open);

  // Rows are derived from the query result each render; only the user's
  // per-candidate edits (keyed by name) are held as state.
  const [overrides, setOverrides] = useState<Record<string, Partial<RowState>>>({});
  const [isAdding, setIsAdding] = useState(false);

  const rows: CandidateRow[] = (candidates ?? []).map((candidate) => ({
    candidate,
    ...defaultRowState(candidate),
    ...overrides[candidate.name],
  }));

  const selectedCount = rows.filter((r) => r.checked).length;

  const updateRow = (name: string, patch: Partial<RowState>) => {
    setOverrides((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
  };

  const addSelected = async () => {
    setIsAdding(true);
    let added = 0;
    let failed = 0;

    for (const row of rows.filter((r) => r.checked)) {
      const payload = {
        name: row.candidate.name,
        category: row.category,
        ...(row.category === "SOFT" ? {} : { level: row.level }),
        isPublic: true,
        tags: [],
      };
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) added++;
      else failed++;
    }

    setIsAdding(false);
    queryClient.invalidateQueries({ queryKey: skillKeys.all });
    queryClient.invalidateQueries({ queryKey: skillKeys.candidates });
    toast({
      title: t("detect.resultToast", { added }),
      ...(failed > 0 ? { description: t("detect.resultFailed", { failed }), variant: "destructive" as const } : {}),
    });
    if (failed === 0) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-primary" />
            {t("detect.title")}
          </DialogTitle>
          <DialogDescription>{t("detect.description")}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("detect.scanning")}
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("detect.empty")}</p>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <>
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((row) => (
                <div
                  key={row.candidate.name}
                  className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                >
                  <Checkbox
                    checked={row.checked}
                    onCheckedChange={(checked) => updateRow(row.candidate.name, { checked: checked === true })}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.candidate.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.candidate.sources.join(" · ")}
                    </p>
                    {row.candidate.similarTo && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        {t("detect.similarTo", { name: row.candidate.similarTo })}
                      </p>
                    )}
                  </div>
                  <Select
                    value={row.category}
                    onValueChange={(value) => updateRow(row.candidate.name, { category: value as RowState["category"] })}
                  >
                    <SelectTrigger className="h-8 w-[130px] shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="text-xs">
                          {t(`category.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={row.level}
                    onValueChange={(value) => updateRow(row.candidate.name, { level: value as RowState["level"] })}
                    disabled={row.category === "SOFT"}
                  >
                    <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_LEVELS.map((level) => (
                        <SelectItem key={level} value={level} className="text-xs">
                          {t(`level.${level}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground">
                {t("detect.selectedCount", { count: selectedCount, total: rows.length })}
              </p>
              <Button size="sm" onClick={addSelected} disabled={selectedCount === 0 || isAdding}>
                {isAdding && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t("detect.addSelected", { count: selectedCount })}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
