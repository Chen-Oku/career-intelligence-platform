"use client";

import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { ProjectForm } from "@/components/career/ProjectForm";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { projectDTOToFormValues } from "@/lib/types/project";
import type { CreateProjectInput } from "@/lib/validators/project.schema";

export function EditProjectClient({ id }: { id: string }) {
  const t = useTranslations("projects");
  const { data: project, isLoading, isError } = useProject(id);
  const { mutateAsync: updateProject, isPending } = useUpdateProject(id);

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><ExperienceListSkeleton /></div>;
  if (isError || !project) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title={t("edit.pageTitle", { name: project.name })} description={project.myRole} />
      <ProjectForm
        defaultValues={projectDTOToFormValues(project)}
        onSubmit={async (data: CreateProjectInput) => { await updateProject(data); }}
        isLoading={isPending}
        submitLabel={t("edit.submitLabel")}
      />
    </div>
  );
}
