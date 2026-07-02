"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { InterviewSessionRecap } from "@/components/intelligence/InterviewSessionRecap";
import { useInterviewSession } from "@/hooks/useInterviewSessions";

export function SessionRecapClient({ jobId, sessionId }: { jobId: string; sessionId: string }) {
  const t = useTranslations("interview");
  const { data: session, isLoading, isError } = useInterviewSession(sessionId);

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !session) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader title={t("recap.pageTitle")} />
      <div className="mt-6">
        <InterviewSessionRecap role={session.role} questions={session.questions} completedAt={session.createdAt} readOnly />
      </div>
      <div className="mt-6">
        <Button variant="outline" asChild>
          <Link href={`/job-analyzer/${jobId}/interview`}>{t("recap.backToMockInterview")}</Link>
        </Button>
      </div>
    </div>
  );
}
