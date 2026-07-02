"use client";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { JobAnalysisResult } from "@/components/intelligence/JobAnalysisResult";
import { useJobAnalysis } from "@/hooks/useJobAnalyzer";

export function JobAnalysisDetailClient({ id }: { id: string }) {
  const t = useTranslations("jobAnalyzer");
  const { data: analysis, isLoading, isError } = useJobAnalysis(id);

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !analysis) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader
        title={t("detail.pageTitle")}
        description={t("detail.pageDescription")}
      />
      <div className="mt-6">
        <JobAnalysisResult analysis={analysis} />
      </div>
    </div>
  );
}
