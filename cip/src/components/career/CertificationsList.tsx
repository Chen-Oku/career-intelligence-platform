"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Award, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, ExperienceListSkeleton } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
} from "@/hooks/useCertifications";
import { createCertificationSchema, type CreateCertificationInput } from "@/lib/validators/certification.schema";
import type { CertificationDTO } from "@/lib/types/certification";

/** ISO date → value usable by <input type="date"> (or "" when absent). */
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

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
  const { mutate: create, isPending: isCreating } = useCreateCertification();
  const { mutate: update, isPending: isUpdating } = useUpdateCertification();
  const isPending = isCreating || isUpdating;

  const form = useForm<CreateCertificationInput>({
    resolver: zodResolver(createCertificationSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          issuer: editing.issuer,
          issueDate: editing.issueDate ? new Date(editing.issueDate) : undefined,
          expiryDate: editing.expiryDate ? new Date(editing.expiryDate) : undefined,
          credentialId: editing.credentialId ?? "",
          credentialUrl: editing.credentialUrl ?? "",
          skills: editing.skills,
        }
      : { name: "", issuer: "", credentialId: "", credentialUrl: "", skills: [] },
  });

  const [skillsText, setSkillsText] = useState(editing?.skills.join(", ") ?? "");

  const handleSubmit = (values: CreateCertificationInput) => {
    const payload = {
      ...values,
      skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    };
    const onSuccess = () => onOpenChange(false);
    if (editing) update({ id: editing.id, ...payload }, { onSuccess });
    else create(payload, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control} name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl><Input placeholder={t("namePlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="issuer"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("issuer")}</FormLabel>
                    <FormControl><Input placeholder={t("issuerPlaceholder")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("issueDate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInput(field.value.toISOString()) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expiryDate")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? toDateInput(field.value.toISOString()) : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("credentialId")}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control} name="credentialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("credentialUrl")}</FormLabel>
                    <FormControl><Input placeholder="https://" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("skills")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("skillsPlaceholder")}
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {editing ? t("saveChanges") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
