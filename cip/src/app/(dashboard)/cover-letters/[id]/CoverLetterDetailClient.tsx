"use client";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCoverLetter } from "@/hooks/useCoverLetters";
import { useResumeDefaults } from "@/hooks/useProfile";
import { CoverLetterPreview } from "@/components/document/CoverLetterPreview";
import { ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { useSession } from "next-auth/react";

export function CoverLetterDetailClient({ id }: { id: string }) {
  const t = useTranslations("coverLetters.detail");
  const { data: coverLetter, isLoading, isError } = useCoverLetter(id);
  const { data: session } = useSession();
  const { data: defaults } = useResumeDefaults();

  if (isLoading) return <div className="p-6 max-w-4xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !coverLetter) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <CoverLetterPreview
        coverLetter={coverLetter}
        userName={defaults?.displayName?.trim() || session?.user?.name || t("defaultUserName")}
      />
    </div>
  );
}
