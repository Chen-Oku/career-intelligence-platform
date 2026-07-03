"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Award, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
} from "@/hooks/useCertifications";
import { CertificationForm } from "./CertificationForm";
import type { CreateCertificationInput } from "@/lib/validators/certification.schema";
import type { CertificationDTO } from "@/lib/types/certification";

export function CertificationsList() {
  const t = useTranslations("certifications");
  const { data: certifications, isLoading, isError } = useCertifications();
  const [editing, setEditing] = useState<CertificationDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (certification: CertificationDTO) => { setEditing(certification); setDialogOpen(true); };

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />{t("addCertification")}
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading && <ExperienceListSkeleton />}
        {isError && <p className="text-sm text-destructive">{t("loadError")}</p>}

        {certifications && certifications.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <Award className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t("emptyState.title")}</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t("emptyState.description")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{t("emptyState.action")}
            </Button>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <ul className="space-y-3">
            {certifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                certification={certification}
                onEdit={() => openEdit(certification)}
              />
            ))}
          </ul>
        )}
      </div>

      <CertificationDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}

function CertificationCard({
  certification,
  onEdit,
}: {
  certification: CertificationDTO;
  onEdit: () => void;
}) {
  const t = useTranslations("certifications");
  const { mutate: deleteCertification, isPending: isDeleting } = useDeleteCertification();

  const issued = certification.issueDate ? certification.issueDate.slice(0, 7) : null;
  const expires = certification.expiryDate ? certification.expiryDate.slice(0, 7) : null;

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{certification.name}</h3>
            {certification.isExpired && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-destructive border-destructive/40">
                {t("expired")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {certification.issuer}
            {issued && ` · ${t("issued")} ${issued}`}
            {expires && ` · ${t("expires")} ${expires}`}
          </p>
          {certification.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {certification.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="h-5 px-1.5 text-[10px]">{skill}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {certification.credentialUrl && (
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <a href={certification.credentialUrl} target="_blank" rel="noopener noreferrer" title={t("viewCredential")}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => deleteCertification(certification.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function CertificationDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CertificationDTO | null;
}) {
  const t = useTranslations("certifications.form");
  const { mutateAsync: create, isPending: isCreating } = useCreateCertification();
  const { mutateAsync: update, isPending: isUpdating } = useUpdateCertification();
  const isPending = isCreating || isUpdating;

  const defaultValues: Partial<CreateCertificationInput> & { skills?: string[] } = editing
    ? {
        name: editing.name,
        issuer: editing.issuer,
        issueDate: editing.issueDate ? new Date(editing.issueDate) : undefined,
        expiryDate: editing.expiryDate ? new Date(editing.expiryDate) : undefined,
        credentialId: editing.credentialId ?? "",
        credentialUrl: editing.credentialUrl ?? "",
        skills: editing.skills,
      }
    : { name: "", issuer: "", credentialId: "", credentialUrl: "", skills: [] };

  const handleSubmit = async (values: CreateCertificationInput) => {
    if (editing) await update({ id: editing.id, ...values });
    else await create(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <CertificationForm
          defaultValues={defaultValues}
          isLoading={isPending}
          submitLabel={editing ? t("saveChanges") : t("create")}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
