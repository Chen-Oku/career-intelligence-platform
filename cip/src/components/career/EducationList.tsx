"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useEducation, useCreateEducation, useUpdateEducation, useDeleteEducation,
} from "@/hooks/useEducation";
import { EducationForm } from "./EducationForm";
import type { CreateEducationInput } from "@/lib/validators/education.schema";
import type { EducationDTO } from "@/lib/types/education";

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");
const toDateOnly = (iso?: string) => (iso ? iso.slice(0, 7) : null);

export function EducationList() {
  const t = useTranslations("education");
  const { data: education, isLoading, isError } = useEducation();
  const [editing, setEditing] = useState<EducationDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (entry: EducationDTO) => { setEditing(entry); setDialogOpen(true); };

  return (
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />{t("addEducation")}
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading && <ExperienceListSkeleton />}
        {isError && <p className="text-sm text-destructive">{t("loadError")}</p>}

        {education && education.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">{t("emptyState.title")}</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t("emptyState.description")}</p>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{t("emptyState.action")}
            </Button>
          </div>
        )}

        {education && education.length > 0 && (
          <ul className="space-y-3">
            {education.map((entry) => (
              <EducationCard key={entry.id} entry={entry} onEdit={() => openEdit(entry)} />
            ))}
          </ul>
        )}
      </div>

      <EducationDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}

function EducationCard({ entry, onEdit }: { entry: EducationDTO; onEdit: () => void }) {
  const t = useTranslations("education");
  const { mutate: deleteEducation, isPending: isDeleting } = useDeleteEducation();

  const start = toDateOnly(entry.startDate);
  const end = entry.isOngoing ? t("ongoing") : toDateOnly(entry.endDate);

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{entry.institution}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {entry.degree}{entry.field ? ` · ${entry.field}` : ""}
          </p>
          {(start || end) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {start}{start && end ? " – " : ""}{end}
            </p>
          )}
          {entry.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="h-5 px-1.5 text-[10px]">{skill}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => deleteEducation(entry.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function EducationDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: EducationDTO | null;
}) {
  const t = useTranslations("education.form");
  const { mutateAsync: create, isPending: isCreating } = useCreateEducation();
  const { mutateAsync: update, isPending: isUpdating } = useUpdateEducation();
  const isPending = isCreating || isUpdating;

  const defaultValues: Partial<CreateEducationInput> | undefined = editing
    ? {
        institution: editing.institution,
        degree: editing.degree,
        field: editing.field ?? "",
        startDate: editing.startDate ? new Date(toDateInput(editing.startDate)) : undefined,
        endDate: editing.endDate ? new Date(toDateInput(editing.endDate)) : undefined,
        isOngoing: editing.isOngoing,
        skills: editing.skills,
      }
    : undefined;

  const handleSubmit = async (values: CreateEducationInput) => {
    if (editing) await update({ id: editing.id, ...values });
    else await create(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <EducationForm
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
