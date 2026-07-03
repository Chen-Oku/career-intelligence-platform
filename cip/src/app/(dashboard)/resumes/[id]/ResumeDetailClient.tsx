"use client";
import { useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { useResume } from "@/hooks/useResumes";
import { useResumeDefaults } from "@/hooks/useProfile";
import { ResumePreview } from "@/components/document/ResumePreview";
import { ResumeEditor } from "@/components/document/ResumeEditor";
import { ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { useSession } from "next-auth/react";

export function ResumeDetailClient({ id }: { id: string }) {
  const t = useTranslations("resumes.detail");
  const { data: resume, isLoading, isError } = useResume(id);
  const { data: session } = useSession();
  const { data: defaults } = useResumeDefaults();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <div className="p-6 max-w-4xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !resume) notFound();

  const userName = defaults?.displayName?.trim() || session?.user?.name || t("defaultUserName");

  return (
    <div className={isEditing ? "p-6 max-w-6xl mx-auto pb-20" : "p-6 max-w-4xl mx-auto pb-20"}>
      {isEditing ? (
        <ResumeEditor resume={resume} userName={userName} onDone={() => setIsEditing(false)} />
      ) : (
        <ResumePreview resume={resume} userName={userName} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
}
