"use client";

import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { ExperienceCard } from "@/components/career/ExperienceCard";
import { useExperiences, useClearAllExperiences } from "@/hooks/useExperiences";

export default function ExperiencePage() {
  const t = useTranslations("experience");
  const { data: experiences, isLoading, isError } = useExperiences();
  const { mutate: clearAll, isPending: isClearing } = useClearAllExperiences();

  // Compute max duration so cards can show relative weight
  const maxDuration = Math.max(
    ...(experiences?.map((e) => e.durationInMonths) ?? [1]),
    1,
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("listPage.title")}
        description={t("listPage.description")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("listPage.clearLabel")}
              count={experiences?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild>
              <Link href="/experience/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("listPage.addExperience")}
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading && <ExperienceListSkeleton />}

      {isError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {t("listPage.loadError")}
          </p>
        </div>
      )}

      {!isLoading && !isError && experiences?.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title={t("listPage.emptyState.title")}
          description={t("listPage.emptyState.description")}
          action={
            <Button size="sm" asChild>
              <Link href="/experience/new">{t("listPage.emptyState.action")}</Link>
            </Button>
          }
        />
      )}

      {!isLoading && experiences && experiences.length > 0 && (
        <div className="mt-6 space-y-3">
          {experiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              durationWeight={experience.durationInMonths / maxDuration}
            />
          ))}
          <p className="pt-2 text-center font-mono-data text-xs text-muted-foreground">
            {t("listPage.summary", {
              count: experiences.length,
              months: experiences.reduce((sum, e) => sum + e.durationInMonths, 0),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
