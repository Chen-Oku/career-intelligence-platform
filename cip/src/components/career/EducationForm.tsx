"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createEducationSchema, CreateEducationInput } from "@/lib/validators/education.schema";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface EducationFormProps {
  defaultValues?: Partial<CreateEducationInput>;
  onSubmit: (data: CreateEducationInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  /** Defaults to browser back (matches ProjectForm/ExperienceForm) — pass to override, e.g. closing a dialog instead. */
  onCancel?: () => void;
}

export function EducationForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  onCancel,
}: EducationFormProps) {
  const t = useTranslations("education");
  const form = useForm<CreateEducationInput>({
    resolver: zodResolver(createEducationSchema),
    defaultValues: {
      institution: "",
      degree: "",
      field: "",
      isOngoing: false,
      skills: [],
      ...defaultValues,
    },
  });

  const isOngoing = form.watch("isOngoing");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">
        <Section title={t("form.overview.title")}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="institution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.institutionLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.institutionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.degreeLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.degreePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fieldLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.fieldPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Section>

        <Section title={t("form.period.title")}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.startDateLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value as unknown as string) ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.endDateLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isOngoing}
                        {...field}
                        value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value as unknown as string) ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isOngoing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">{t("form.isOngoingLabel")}</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </Section>

        <Section title={t("form.skills.title")} description={t("form.skills.description")}>
          <FormField
            control={form.control}
            name="skills"
            render={() => (
              <FormItem>
                <FormControl>
                  <Controller
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <TagInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder={t("form.skillsPlaceholder")}
                        max={20}
                      />
                    )}
                  />
                </FormControl>
                <FormDescription>{t("form.skillsHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" onClick={onCancel ?? (() => window.history.back())} disabled={isLoading}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.saving")}</> : (submitLabel ?? t("form.save"))}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <Separator className="mb-4" />
      {children}
    </div>
  );
}
