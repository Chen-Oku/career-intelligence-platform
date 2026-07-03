"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createCertificationSchema, type CreateCertificationInput } from "@/lib/validators/certification.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

/** ISO date → value usable by <input type="date"> (or "" when absent). */
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

interface CertificationFormProps {
  defaultValues?: Partial<CreateCertificationInput> & { skills?: string[] };
  onSubmit: (data: CreateCertificationInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  /** Defaults to browser back (matches ProjectForm/ExperienceForm) — pass to override, e.g. closing a dialog instead. */
  onCancel?: () => void;
}

/**
 * CertificationForm — extracted from the CRUD dialog so CV-import review
 * can reuse the exact same fields, matching the ProjectForm/ExperienceForm
 * pattern (standalone form, defaultValues/onSubmit/isLoading/submitLabel).
 */
export function CertificationForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  onCancel,
}: CertificationFormProps) {
  const t = useTranslations("certifications.form");

  const form = useForm<CreateCertificationInput>({
    resolver: zodResolver(createCertificationSchema),
    defaultValues: {
      name: "", issuer: "", credentialId: "", credentialUrl: "", skills: [],
      ...defaultValues,
    },
  });

  const [skillsText, setSkillsText] = useState(defaultValues?.skills?.join(", ") ?? "");

  const handleSubmit = (values: CreateCertificationInput) =>
    onSubmit({
      ...values,
      skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    });

  return (
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
          <Button type="button" variant="outline" size="sm" onClick={onCancel ?? (() => window.history.back())}>
            {t("cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {submitLabel ?? t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
