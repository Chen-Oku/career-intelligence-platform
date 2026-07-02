"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProjectForm } from "@/components/career/ProjectForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { projectKeys } from "@/hooks/useProjects";
import { importedProjectToFormValues } from "@/lib/types/cvImport";
import type { ImportedProject } from "@/lib/types/cvImport";
import type { ProjectDTO } from "@/lib/types/project";
import type { CreateProjectInput } from "@/lib/validators/project.schema";

async function postProject(input: CreateProjectInput): Promise<ProjectDTO> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const { data } = await res.json();
  return data as ProjectDTO;
}

/** ImportProjectReview — same pattern as ImportExperienceReview, for Projects. */
export function ImportProjectReview({ items }: { items: ImportedProject[] }) {
  const t = useTranslations("import");
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error: Error) => {
      toast({ title: t("projectReview.saveErrorTitle"), description: error.message, variant: "destructive" });
    },
  });

  const pending = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !doneIndices.has(index));

  if (pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("projectReview.allReviewed")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {pending.map(({ item, index }) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">{item.name}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDoneIndices((prev) => new Set(prev).add(index))}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {t("projectReview.discard")}
            </Button>
          </CardHeader>
          <CardContent>
            <ProjectForm
              defaultValues={importedProjectToFormValues(item)}
              isLoading={isPending}
              submitLabel={t("projectReview.submitLabel")}
              onSubmit={async (data) => {
                await mutateAsync(data);
                toast({ title: t("projectReview.addedToast", { name: data.name }) });
                setDoneIndices((prev) => new Set(prev).add(index));
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
