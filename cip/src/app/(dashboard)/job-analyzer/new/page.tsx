"use client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { JobAnalyzerForm } from "@/components/intelligence/JobAnalyzerForm";

export default function NewJobAnalysisPage() {
  const t = useTranslations("jobAnalyzer");
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title={t("new.pageTitle")}
        description={t("new.pageDescription")}
      />
      <JobAnalyzerForm />
    </div>
  );
}
