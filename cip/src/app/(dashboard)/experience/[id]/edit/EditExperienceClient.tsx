"use client";

import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ExperienceForm } from "@/components/career/ExperienceForm";
import { useExperience, useUpdateExperience } from "@/hooks/useExperiences";
import { dtoToFormValues } from "@/lib/types/experience";
import type { CreateExperienceInput } from "@/lib/validators/experience.schema";

export function EditExperienceClient({ id }: { id: string }) {
  const t = useTranslations("experience");
  const { data: experience, isLoading, isError } = useExperience(id);
  const { mutateAsync: updateExperience, isPending } = useUpdateExperience(id);

  const handleSubmit = async (data: CreateExperienceInput) => {
    try {
      await updateExperience(data);
      // Navigation to /experience happens inside useUpdateExperience on success
    } catch {
      // Already surfaced via toast in useUpdateExperience's onError.
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <ExperienceListSkeleton />
      </div>
    );
  }

  if (isError || !experience) {
    notFound();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("editPage.title", { company: experience.company })}
        description={experience.position}
      />
      <ExperienceForm
        defaultValues={dtoToFormValues(experience)}
        onSubmit={handleSubmit}
        isLoading={isPending}
        submitLabel={t("editPage.submitLabel")}
      />
    </div>
  );
}
