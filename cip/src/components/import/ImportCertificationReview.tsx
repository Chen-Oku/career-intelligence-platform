"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { CertificationForm } from "@/components/career/CertificationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { certificationKeys } from "@/hooks/useCertifications";
import { importedCertificationToFormValues } from "@/lib/types/cvImport";
import type { ImportedCertification } from "@/lib/types/cvImport";
import type { CertificationDTO } from "@/lib/types/certification";
import type { CreateCertificationInput } from "@/lib/validators/certification.schema";

async function postCertification(input: CreateCertificationInput): Promise<CertificationDTO> {
  const res = await fetch("/api/certifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const { data } = await res.json();
  return data as CertificationDTO;
}

/** ImportCertificationReview — same pattern as ImportProjectReview, for Certifications. */
export function ImportCertificationReview({ items }: { items: ImportedCertification[] }) {
  const t = useTranslations("import");
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: postCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificationKeys.all });
    },
    onError: (error: Error) => {
      toast({ title: t("certificationReview.saveErrorTitle"), description: error.message, variant: "destructive" });
    },
  });

  const pending = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !doneIndices.has(index));

  if (pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {t("certificationReview.allReviewed")}
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
              {t("certificationReview.discard")}
            </Button>
          </CardHeader>
          <CardContent>
            <CertificationForm
              defaultValues={importedCertificationToFormValues(item)}
              isLoading={isPending}
              submitLabel={t("certificationReview.submitLabel")}
              onSubmit={async (data) => {
                await mutateAsync(data);
                toast({ title: t("certificationReview.addedToast", { name: data.name }) });
                setDoneIndices((prev) => new Set(prev).add(index));
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
