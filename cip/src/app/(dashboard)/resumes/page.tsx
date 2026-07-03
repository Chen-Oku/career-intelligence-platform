// ── src/app/(dashboard)/resumes/page.tsx ─────────────────────────────────────
"use client";
import Link from "next/link";
import { Sparkles, FileText, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { useResumes, useDeleteResume, useClearAllResumes } from "@/hooks/useResumes";
import { RESUME_TYPE_LABELS } from "@/lib/validators/resume.schema";

export default function ResumesPage() {
  const t = useTranslations("resumes.list");
  const { data: resumes, isLoading } = useResumes();
  const { mutate: deleteResume } = useDeleteResume();
  const { mutate: clearAll, isPending: isClearing } = useClearAllResumes();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("clearLabel")}
              count={resumes?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild>
              <Link href="/resumes/new"><Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("generateResume")}</Link>
            </Button>
          </div>
        }
      />

      {isLoading && <ExperienceListSkeleton />}

      {!isLoading && (resumes?.length ?? 0) === 0 && (
        <EmptyState
          icon={FileText}
          title={t("emptyState.title")}
          description={t("emptyState.description")}
          action={<Button size="sm" asChild><Link href="/resumes/new">{t("emptyState.action")}</Link></Button>}
        />
      )}

      {!isLoading && resumes && resumes.length > 0 && (
        <div className="mt-6 space-y-3">
          {resumes.map((resume) => (
            <div key={resume.id} className="group flex items-center gap-0 rounded-lg border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
              <div className="w-0.5 shrink-0 bg-primary" />
              <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/resumes/${resume.id}`} className="block">
                    <h3 className="text-sm font-semibold truncate hover:text-primary transition-colors">{resume.title}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono-data">
                    {resume.typeLabel ?? (RESUME_TYPE_LABELS[resume.type] ?? resume.type)}
                    {resume.targetRole && ` · ${resume.targetRole}`}
                    {" · "}
                    {new Date(resume.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/resumes/${resume.id}`}>{t("view")}</Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteResume(resume.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
