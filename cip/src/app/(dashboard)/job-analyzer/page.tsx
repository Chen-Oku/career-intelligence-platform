// ── src/app/(dashboard)/job-analyzer/page.tsx ────────────────────────────────
"use client";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ClearSectionButton } from "@/components/shared/ClearSectionButton";
import { useJobAnalyses, useDeleteJobAnalysis, useClearAllJobAnalyses } from "@/hooks/useJobAnalyzer";
import { cn } from "@/lib/utils";

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 70 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : score >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-rose-600 bg-rose-50 border-rose-200";
  return (
    <span className={cn("inline-flex items-center border rounded-full px-2 py-0.5 font-mono-data text-xs font-semibold", color)}>
      {score}%
    </span>
  );
}

export default function JobAnalyzerPage() {
  const t = useTranslations("jobAnalyzer");
  const { data: jobs, isLoading } = useJobAnalyses();
  const { mutate: deleteJob } = useDeleteJobAnalysis();
  const { mutate: clearAll, isPending: isClearing } = useClearAllJobAnalyses();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("list.pageTitle")}
        description={t("list.pageDescription")}
        action={
          <div className="flex items-center gap-2">
            <ClearSectionButton
              itemLabel={t("list.clearItemLabel")}
              count={jobs?.length ?? 0}
              onConfirm={() => clearAll()}
              isPending={isClearing}
            />
            <Button size="sm" asChild>
              <Link href="/job-analyzer/new"><Plus className="mr-1.5 h-3.5 w-3.5" />{t("list.newAnalysis")}</Link>
            </Button>
          </div>
        }
      />

      {isLoading && <ExperienceListSkeleton />}

      {!isLoading && (jobs?.length ?? 0) === 0 && (
        <EmptyState
          icon={Search}
          title={t("list.emptyTitle")}
          description={t("list.emptyDescription")}
          action={<Button size="sm" asChild><Link href="/job-analyzer/new">{t("list.analyzeFirstJob")}</Link></Button>}
        />
      )}

      {!isLoading && jobs && jobs.length > 0 && (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="group flex gap-0 rounded-lg border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
              <div className={cn("w-0.5 shrink-0", (job.matchScore ?? 0) >= 70 ? "bg-emerald-500" : (job.matchScore ?? 0) >= 50 ? "bg-primary" : "bg-rose-400")} />
              <div className="flex flex-1 items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link href={`/job-analyzer/${job.id}`} className="block">
                    <h3 className="text-sm font-semibold truncate hover:text-primary transition-colors">{job.title}</h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{job.company}</span>
                    <ScorePill score={job.matchScore} />
                    {job.missingSkills.length > 0 && (
                      <span className="text-xs text-muted-foreground">{t("list.gaps", { count: job.missingSkills.length })}</span>
                    )}
                    <span className="font-mono-data text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="sm" asChild><Link href={`/job-analyzer/${job.id}`}>{t("list.view")}</Link></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteJob(job.id)}>
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
