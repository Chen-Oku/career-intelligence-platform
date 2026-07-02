"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LEVEL_COLORS } from "@/lib/types/skill";
import { useDeleteSkill } from "@/hooks/useSkills";
import type { SkillDTO } from "@/lib/types/skill";

interface SkillChipProps {
  skill: SkillDTO;
  onEdit: (skill: SkillDTO) => void;
}

/**
 * SkillChip — displays a single skill with level indicator.
 *
 * Design decisions:
 * - Color-coded by level (muted → blue → amber → green)
 * - Dot indicator encodes level at a glance without text clutter
 * - Edit/delete actions on hover only — keeps the list scannable
 * - No confirmation for delete — skills are fast to re-add,
 *   and the undo toast pattern would add complexity for minimal gain
 */
const NO_LEVEL_COLORS = { bg: "bg-secondary", text: "text-secondary-foreground", dot: "bg-secondary-foreground/40" };

export function SkillChip({ skill, onEdit }: SkillChipProps) {
  const t = useTranslations("skills");
  const [isHovered, setIsHovered] = useState(false);
  const { mutate: deleteSkill, isPending } = useDeleteSkill();
  const colors = skill.level ? LEVEL_COLORS[skill.level] : NO_LEVEL_COLORS;

  return (
    <div
      className={cn(
        "group inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all",
        "border border-transparent",
        colors.bg,
        colors.text,
        "hover:border-current/20",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Level dot — only for skills with a rated level */}
      {skill.level && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot)} aria-hidden />
      )}

      {/* Name */}
      <span className="font-medium leading-none">{skill.name}</span>

      {/* Level label — visible on hover */}
      {skill.level && (
        <span
          className={cn(
            "font-mono-data text-[10px] opacity-0 transition-opacity",
            isHovered && "opacity-60",
          )}
        >
          {t(`level.${skill.level}`)}
        </span>
      )}

      {/* Years — if set. Always rendered (opacity-only toggle) so hovering never
          changes the chip's width — width changes in a flex-wrap row push the chip
          to the next line, moving it out from under the cursor. */}
      {skill.yearsOfExp && (
        <span
          className={cn(
            "font-mono-data text-[10px] opacity-50 transition-opacity",
            isHovered && "opacity-0",
          )}
        >
          {t("chip.years", { years: skill.yearsOfExp })}
        </span>
      )}

      {/* Actions — always rendered, visibility toggled on hover (see note above) */}
      <span
        className={cn(
          "flex items-center gap-0.5 ml-0.5 transition-opacity",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <button
          type="button"
          onClick={() => onEdit(skill)}
          className="rounded p-0.5 hover:bg-black/10 transition-colors"
          aria-label={t("chip.editAction", { name: skill.name })}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => deleteSkill(skill.id)}
          disabled={isPending}
          className="rounded p-0.5 hover:bg-black/10 transition-colors disabled:opacity-40"
          aria-label={t("chip.removeAction", { name: skill.name })}
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}
