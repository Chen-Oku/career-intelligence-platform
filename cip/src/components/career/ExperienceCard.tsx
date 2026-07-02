"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, MapPin, Users, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMonthYear } from "@/lib/utils";
import { useDeleteExperience } from "@/hooks/useExperiences";
import type { ExperienceDTO } from "@/lib/types/experience";

const MAX_TECH_BADGES = 5;

interface ExperienceCardProps {
  experience: ExperienceDTO;
  /** Relative weight 0–1, used to set the accent bar opacity */
  durationWeight?: number;
}

/**
 * ExperienceCard — displays a single experience.
 *
 * Design signature: the left amber accent bar. Its opacity is proportional
 * to the role's duration relative to the user's longest role.
 * This encodes career weight visually without needing a chart.
 */
export function ExperienceCard({
  experience,
  durationWeight = 0.5,
}: ExperienceCardProps) {
  const t = useTranslations("experience");
  const { mutate: deleteExperience, isPending: isDeleting } =
    useDeleteExperience();
  const [expanded, setExpanded] = useState(false);

  const hasDetails = experience.responsibilities.length > 0 || experience.achievements.length > 0;
  const visibleTech = experience.technologies.slice(0, MAX_TECH_BADGES);
  const hiddenCount = experience.technologies.length - MAX_TECH_BADGES;

  const startLabel = formatMonthYear(experience.startDate);
  const endLabel = experience.isCurrent
    ? t("card.present")
    : experience.endDate
    ? formatMonthYear(experience.endDate)
    : "";

  return (
    <div className="group relative flex gap-0 rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      {/* Signature: amber accent bar — opacity = career weight */}
      <div
        className="w-0.5 shrink-0 bg-primary transition-opacity"
        style={{ opacity: 0.25 + durationWeight * 0.75 }}
        aria-hidden
      />

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold leading-tight truncate">
                {experience.company}
              </h3>
              {experience.isCurrent && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[10px] font-medium text-primary bg-primary/10 border-0"
                >
                  {t("card.current")}
                </Badge>
              )}
              {experience.hasLeadership && (
                <Award className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground leading-tight">
              {experience.position}
            </p>
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              asChild
            >
              <Link href={`/experience/${experience.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">{t("card.editAction")}</span>
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("card.deleteAction")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("card.deleteDialog.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.rich("card.deleteDialog.description", {
                      company: experience.company,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("card.deleteDialog.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteExperience(experience.id)}
                  >
                    {t("card.deleteDialog.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Metadata row */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <span className="font-mono-data text-muted-foreground">
            {startLabel} – {endLabel}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-mono-data text-muted-foreground">
            {experience.durationLabel}
          </span>
          {experience.location && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {experience.location}
              </span>
            </>
          )}
          {experience.teamSize && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {t("card.teamSize", { count: experience.teamSize })}
              </span>
            </>
          )}
        </div>

        {/* Tech badges */}
        {experience.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {visibleTech.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="h-5 px-2 text-[11px] font-normal"
              >
                {tech}
              </Badge>
            ))}
            {hiddenCount > 0 && (
              <Badge
                variant="outline"
                className="h-5 px-2 text-[11px] font-normal text-muted-foreground"
              >
                +{hiddenCount}
              </Badge>
            )}
          </div>
        )}

        {/* Responsibilities & achievements — collapsed by default */}
        {hasDetails && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? t("card.hideDetails") : t("card.showDetails")}
            </button>

            {expanded && (
              <div className="mt-2.5 space-y-3">
                {experience.responsibilities.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-1">
                      {t("card.responsibilities")}
                    </p>
                    <ul className="space-y-1">
                      {experience.responsibilities.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/90">
                          <span className="text-border shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {experience.achievements.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-1">
                      {t("card.achievements")}
                    </p>
                    <ul className="space-y-1">
                      {experience.achievements.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/90">
                          <Award className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
