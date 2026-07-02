"use client";

import { useState } from "react";
import { Plus, ScanSearch, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { SkillChip } from "./SkillChip";
import { AddSkillDialog } from "./AddSkillDialog";
import { SkillDetectionDialog } from "./SkillDetectionDialog";
import { useSkills, useClearAllSkills } from "@/hooks/useSkills";
import { groupSkillsByCategory, splitSoftSkillGroups, LEVEL_COLORS } from "@/lib/types/skill";
import { cn } from "@/lib/utils";
import type { SkillDTO } from "@/lib/types/skill";
import type { SkillLevel } from "@/domain/career/entities/Skill";

/**
 * SkillsDatabase — the main skills view.
 *
 * UX decision: No separate create/edit pages.
 * Skills are short, structured data — a dialog is faster and less
 * disruptive than navigating away to a full page.
 *
 * The view groups by category and shows a level legend so the user
 * can audit their profile at a glance before generating a resume.
 */
export function SkillsDatabase() {
  const t = useTranslations("skills");
  const { data: skills, isLoading, isError } = useSkills();
  const { mutate: clearAll, isPending: isClearing } = useClearAllSkills();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillDTO | null>(null);
  const [detectOpen, setDetectOpen] = useState(false);

  const grouped = skills ? groupSkillsByCategory(skills) : [];
  const { technicalGroups, softGroup } = splitSoftSkillGroups(grouped);
  const totalCount = skills?.length ?? 0;

  const handleEdit = (skill: SkillDTO) => {
    setEditSkill(skill);
    setDialogOpen(true);
  };

  const handleOpenAdd = () => {
    setEditSkill(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditSkill(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("clearLabel")}
              count={totalCount}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" variant="outline" onClick={() => setDetectOpen(true)}>
              <ScanSearch className="mr-1.5 h-3.5 w-3.5" />
              {t("detect.button")}
            </Button>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("addSkill")}
            </Button>
          </div>
        }
      />

      <SkillDetectionDialog open={detectOpen} onOpenChange={setDetectOpen} />

      {/* Level legend */}
      {!isLoading && totalCount > 0 && (
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <span className="text-xs text-muted-foreground">{t("levelLegend")}</span>
          {(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as SkillLevel[]).map((level) => (
            <span key={level} className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", LEVEL_COLORS[level].dot)} />
              <span className="text-xs text-muted-foreground">{t(`level.${level}`)}</span>
            </span>
          ))}
        </div>
      )}

      {isLoading && <ExperienceListSkeleton />}

      {isError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t("loadError")}</p>
        </div>
      )}

      {!isLoading && !isError && totalCount === 0 && (
        <EmptyState
          icon={Zap}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
          action={
            <Button size="sm" onClick={handleOpenAdd}>{t("emptyState.action")}</Button>
          }
        />
      )}

      {/* Technical & other categories */}
      {!isLoading && technicalGroups.length > 0 && (
        <div className="mt-6 space-y-6">
          {technicalGroups.map(({ category, skills: categorySkills }) => (
            <CategorySection
              key={category}
              label={t(`category.${category}`)}
              skills={categorySkills}
              onEdit={handleEdit}
              onAdd={() => { setEditSkill(null); setDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      {/* Soft skills & strengths — separate section, no level rating */}
      {!isLoading && softGroup && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 mb-3">
            {t("softSkillsSection")}
          </h2>
          <CategorySection
            label={t(`category.${softGroup.category}`)}
            skills={softGroup.skills}
            onEdit={handleEdit}
            onAdd={() => { setEditSkill(null); setDialogOpen(true); }}
            showLabel={false}
          />
        </div>
      )}

      {/* Footer stats */}
      {!isLoading && grouped.length > 0 && (
        <p className="pt-6 text-center font-mono-data text-xs text-muted-foreground">
          {t("footerStats", { count: totalCount, categoryCount: grouped.length })}
        </p>
      )}

      {/* Dialog — shared for add and edit */}
      <AddSkillDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editSkill={editSkill}
      />
    </div>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────

function CategorySection({
  label,
  skills,
  onEdit,
  onAdd,
  showLabel = true,
}: {
  label: string;
  skills: SkillDTO[];
  onEdit: (skill: SkillDTO) => void;
  onAdd: () => void;
  showLabel?: boolean;
}) {
  const t = useTranslations("skills");

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        {showLabel && (
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </h3>
        )}
        <span className="font-mono-data text-xs text-muted-foreground/60">
          {skills.length}
        </span>
        <div className="flex-1 h-px bg-border" />
        <button
          onClick={onAdd}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label={t("addSkillToCategory", { label })}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <SkillChip key={skill.id} skill={skill} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
