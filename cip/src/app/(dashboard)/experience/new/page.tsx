"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExperienceForm } from "@/components/career/ExperienceForm";
import { useCreateExperience } from "@/hooks/useExperiences";
import type { CreateExperienceInput } from "@/lib/validators/experience.schema";

export default function NewExperiencePage() {
  const t = useTranslations("experience");
  const { mutateAsync: createExperience, isPending } = useCreateExperience();

  const handleSubmit = async (data: CreateExperienceInput) => {
    try {
      await createExperience(data);
      // Navigation to /experience happens inside useCreateExperience on success
    } catch {
      // Already surfaced via toast in useCreateExperience's onError.
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("newPage.title")}
        description={t("newPage.description")}
      />
      <ExperienceForm
        onSubmit={handleSubmit}
        isLoading={isPending}
        submitLabel={t("newPage.submitLabel")}
      />
    </div>
  );
}
