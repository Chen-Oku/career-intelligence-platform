"use client";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useResume } from "@/hooks/useResumes";
import { ResumePreview } from "@/components/document/ResumePreview";
import { ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { useSession } from "next-auth/react";

export function ResumeDetailClient({ id }: { id: string }) {
  const t = useTranslations("resumes.detail");
  const { data: resume, isLoading, isError } = useResume(id);
  const { data: session } = useSession();

  if (isLoading) return <div className="p-6 max-w-4xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !resume) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20">
      <ResumePreview
        resume={resume}
        userName={session?.user?.name ?? t("defaultUserName")}
      />
    </div>
  );
}
