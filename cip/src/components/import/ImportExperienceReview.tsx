"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExperienceForm } from "@/components/career/ExperienceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { experienceKeys } from "@/hooks/useExperiences";
import { importedExperienceToFormValues } from "@/lib/types/cvImport";
import type { ImportedExperience } from "@/lib/types/cvImport";
import type { ExperienceDTO } from "@/lib/types/experience";
import type { CreateExperienceInput } from "@/lib/validators/experience.schema";

async function postExperience(input: CreateExperienceInput): Promise<ExperienceDTO> {
  const res = await fetch("/api/experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const { data } = await res.json();
  return data as ExperienceDTO;
}

/**
 * ImportExperienceReview — one editable ExperienceForm card per extracted item.
 *
 * Doesn't reuse useCreateExperience() directly — that hook navigates to
 * /experience on success, which would kick the user out of the review
 * screen after saving just the first item. Local mutation instead, same
 * invalidation, no navigation.
 */
export function ImportExperienceReview({ items }: { items: ImportedExperience[] }) {
  const t = useTranslations("import");
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: experienceKeys.all });
    },
    onError: (error: Error) => {
      toast({ title: t("experienceReview.saveErrorTitle"), description: error.message, variant: "destructive" });
    },
  });

  const pending = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !doneIndices.has(index));

  if (pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("experienceReview.allReviewed")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {pending.map(({ item, index }) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">
              {item.position} — {item.company}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDoneIndices((prev) => new Set(prev).add(index))}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {t("experienceReview.discard")}
            </Button>
          </CardHeader>
          <CardContent>
            <ExperienceForm
              defaultValues={importedExperienceToFormValues(item)}
              isLoading={isPending}
              submitLabel={t("experienceReview.submitLabel")}
              onSubmit={async (data) => {
                await mutateAsync(data);
                toast({ title: t("experienceReview.addedToast", { position: data.position }) });
                setDoneIndices((prev) => new Set(prev).add(index));
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
