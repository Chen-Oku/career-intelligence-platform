"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createResumeTypePresetSchema, type CreateResumeTypePresetInput } from "@/lib/validators/resumeTypePreset.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ResumeTypePresetFormProps {
  defaultValues?: Partial<CreateResumeTypePresetInput> & { prioritizeKeywords?: string[] };
  onSubmit: (data: CreateResumeTypePresetInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ResumeTypePresetForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  onCancel,
}: ResumeTypePresetFormProps) {
  const t = useTranslations("profile.resumeTypePresets.form");

  const form = useForm<CreateResumeTypePresetInput>({
    resolver: zodResolver(createResumeTypePresetSchema),
    defaultValues: {
      name: "", focus: "", vocabulary: "", prioritizeKeywords: [], defaultTitle: "",
      ...defaultValues,
    },
  });

  const [keywordsText, setKeywordsText] = useState(defaultValues?.prioritizeKeywords?.join(", ") ?? "");

  const handleSubmit = (values: CreateResumeTypePresetInput) =>
    onSubmit({
      ...values,
      prioritizeKeywords: keywordsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control} name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl><Input placeholder={t("namePlaceholder")} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control} name="focus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("focus")}</FormLabel>
              <FormControl><Textarea rows={3} placeholder={t("focusPlaceholder")} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control} name="vocabulary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("vocabulary")}</FormLabel>
              <FormControl><Input placeholder={t("vocabularyPlaceholder")} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>{t("prioritizeKeywords")}</FormLabel>
          <FormControl>
            <Input
              placeholder={t("prioritizeKeywordsPlaceholder")}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
            />
          </FormControl>
        </FormItem>
        <FormField
          control={form.control} name="defaultTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("defaultTitle")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
