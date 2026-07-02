"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectForm } from "@/components/career/ProjectForm";
import { useCreateProject } from "@/hooks/useProjects";
import type { CreateProjectInput } from "@/lib/validators/project.schema";

export default function NewProjectPage() {
  const t = useTranslations("projects");
  const { mutateAsync: createProject, isPending } = useCreateProject();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("new.pageTitle")}
        description={t("new.pageDescription")}
      />
      <ProjectForm
        onSubmit={async (data: CreateProjectInput) => { await createProject(data); }}
        isLoading={isPending}
      />
    </div>
  );
}
