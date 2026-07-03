"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { EducationForm } from "@/components/career/EducationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { educationKeys } from "@/hooks/useEducation";
import { importedEducationToFormValues } from "@/lib/types/cvImport";
import type { ImportedEducation } from "@/lib/types/cvImport";
import type { EducationDTO } from "@/lib/types/education";
import type { CreateEducationInput } from "@/lib/validators/education.schema";

async function postEducation(input: CreateEducationInput): Promise<EducationDTO> {
  const res = await fetch("/api/education", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const { data } = await res.json();
  return data as EducationDTO;
}

/** ImportEducationReview — same pattern as ImportProjectReview, for Education. */
export function ImportEducationReview({ items }: { items: ImportedEducation[] }) {
  const t = useTranslations("import");
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postEducation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationKeys.all });
    },
    onError: (error: Error) => {
      toast({ title: t("educationReview.saveErrorTitle"), description: error.message, variant: "destructive" });
    },
  });

  const pending = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !doneIndices.has(index));

  if (pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("educationReview.allReviewed")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {pending.map(({ item, index }) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">{item.institution}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDoneIndices((prev) => new Set(prev).add(index))}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              {t("educationReview.discard")}
            </Button>
          </CardHeader>
          <CardContent>
            <EducationForm
              defaultValues={importedEducationToFormValues(item)}
              isLoading={isPending}
              submitLabel={t("educationReview.submitLabel")}
              onSubmit={async (data) => {
                await mutateAsync(data);
                toast({ title: t("educationReview.addedToast", { institution: data.institution }) });
                setDoneIndices((prev) => new Set(prev).add(index));
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
