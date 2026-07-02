// src/app/(dashboard)/resumes/new/page.tsx
"use client";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResumeGeneratorForm } from "@/components/document/ResumeGeneratorForm";

export default function NewResumePage() {
  const t = useTranslations("resumes.new");
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />
      {/* Suspense: ResumeGeneratorForm reads ?jobId= via useSearchParams */}
      <Suspense>
        <ResumeGeneratorForm />
      </Suspense>
    </div>
  );
}
