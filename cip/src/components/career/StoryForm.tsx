"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createStorySchema, CreateStoryInput, STORY_CATEGORIES } from "@/lib/validators/story.schema";
import { STORY_CATEGORY_LABELS } from "@/lib/types/story";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface StoryFormProps {
  defaultValues?: Partial<CreateStoryInput>;
  onSubmit: (data: CreateStoryInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * StoryForm — presents the STAR fields as a narrative flow.
 *
 * The prompts guide the user to write in a way the AI can use directly.
 * "Set the scene without solving anything yet" tells the user what
 * belongs in Situation vs. Action. Good prompts = better AI outputs.
 */
export function StoryForm({ defaultValues, onSubmit, isLoading, submitLabel }: StoryFormProps) {
  const t = useTranslations("stories");
  const form = useForm<CreateStoryInput>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      title: "", category: "PROBLEM_SOLVING",
      situation: "", task: "", action: "", result: "",
      impact: "", skills: [], keywords: [],
      ...defaultValues,
    },
  });

  const STAR = [
    {
      name: "situation" as const,
      label: t("form.situationLabel"),
      prompt: t("form.situationPrompt"),
      placeholder: t("form.situationPlaceholder"),
      minH: "min-h-[100px]",
    },
    {
      name: "task" as const,
      label: t("form.taskLabel"),
      prompt: t("form.taskPrompt"),
      placeholder: t("form.taskPlaceholder"),
      minH: "min-h-[80px]",
    },
    {
      name: "action" as const,
      label: t("form.actionLabel"),
      prompt: t("form.actionPrompt"),
      placeholder: t("form.actionPlaceholder"),
      minH: "min-h-[120px]",
    },
    {
      name: "result" as const,
      label: t("form.resultLabel"),
      prompt: t("form.resultPrompt"),
      placeholder: t("form.resultPlaceholder"),
      minH: "min-h-[80px]",
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">

        {/* ── Section 1: Header ──────────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{t("form.detailsSection.title")}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("form.detailsSection.description")}
            </p>
          </div>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control} name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("form.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.titlePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control} name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.categoryLabel")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STORY_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{STORY_CATEGORY_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section 2: STAR ────────────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{t("form.starSection.title")}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("form.starSection.description")}
            </p>
          </div>
          <Separator className="mb-4" />
          <div className="space-y-5">
            {STAR.map(({ name, label, prompt, placeholder, minH }) => (
              <FormField
                key={name} control={form.control} name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">{label}</FormLabel>
                    <FormDescription>{prompt}</FormDescription>
                    <FormControl>
                      <Textarea placeholder={placeholder} className={`${minH} resize-y text-sm`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Section 3: Context ─────────────────────────────────────── */}
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold">{t("form.contextSection.title")}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("form.contextSection.description")}
            </p>
          </div>
          <Separator className="mb-4" />
          <div className="space-y-4">
            <FormField
              control={form.control} name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.impactLabel")} <span className="text-muted-foreground font-normal">{t("form.impactOptional")}</span></FormLabel>
                  <FormDescription>{t("form.impactDescription")}</FormDescription>
                  <FormControl>
                    <Input placeholder={t("form.impactPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="skills" render={() => (
                <FormItem>
                  <FormLabel>{t("form.skillsLabel")}</FormLabel>
                  <FormControl>
                    <Controller control={form.control} name="skills"
                      render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder={t("form.skillsPlaceholder")} max={15} />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="keywords" render={() => (
                <FormItem>
                  <FormLabel>{t("form.keywordsLabel")}</FormLabel>
                  <FormDescription className="text-xs">{t("form.keywordsDescription")}</FormDescription>
                  <FormControl>
                    <Controller control={form.control} name="keywords"
                      render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder={t("form.keywordsPlaceholder")} max={20} />}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading}>{t("form.cancel")}</Button>
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.saving")}</> : (submitLabel ?? t("form.defaultSubmitLabel"))}
          </Button>
        </div>
      </form>
    </Form>
  );
}
