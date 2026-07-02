// ─── src/app/(dashboard)/projects/page.tsx ────────────────────────────────────
"use client";

import Link from "next/link";
import { Plus, FolderOpen, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { ProjectCard } from "@/components/career/ProjectCard";
import { useProjects, useClearAllProjects } from "@/hooks/useProjects";

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const { data: projects, isLoading, isError } = useProjects();
  const { mutate: clearAll, isPending: isClearing } = useClearAllProjects();

  const highlighted = projects?.filter((p) => p.isHighlighted) ?? [];
  const rest = projects?.filter((p) => !p.isHighlighted) ?? [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("list.pageTitle")}
        description={t("list.pageDescription")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("clearLabel")}
              count={projects?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild>
              <Link href="/projects/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("list.addProject")}
              </Link>
            </Button>
          </div>
        }
      />

      {isLoading && <ExperienceListSkeleton />}

      {isError && (
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t("list.loadError")}</p>
        </div>
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={t("list.emptyState.title")}
          description={t("list.emptyState.description")}
          action={
            <Button size="sm" asChild>
              <Link href="/projects/new">{t("list.emptyState.action")}</Link>
            </Button>
          }
        />
      )}

      {!isLoading && projects && projects.length > 0 && (
        <div className="mt-6 space-y-6">
          {highlighted.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("list.featured")}
                </span>
              </div>
              <div className="space-y-3">
                {highlighted.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {highlighted.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("list.allProjects")}
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {rest.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
          <p className="pt-2 text-center font-mono-data text-xs text-muted-foreground">
            {t("list.count", { count: projects.length })}
            {highlighted.length > 0 && ` · ${t("list.featuredCount", { count: highlighted.length })}`}
          </p>
        </div>
      )}
    </div>
  );
}
