// src/app/(dashboard)/cover-letters/new/page.tsx
"use client";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { CoverLetterGeneratorForm } from "@/components/document/CoverLetterGeneratorForm";

export default function NewCoverLetterPage() {
  const t = useTranslations("coverLetters.new");
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />
      <CoverLetterGeneratorForm />
    </div>
  );
}
