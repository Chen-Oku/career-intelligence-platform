"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createProjectSchema, CreateProjectInput } from "@/lib/validators/project.schema";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface ProjectFormProps {
  defaultValues?: Partial<CreateProjectInput>;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: ProjectFormProps) {
  const t = useTranslations("projects");
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      technologies: [],
      myRole: "",
      challenges: "",
      results: "",
      lessonsLearned: "",
      isHighlighted: false,
      isPublic: false,
      tags: [],
      externalUrl: "",
      githubUrl: "",
      order: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-6">

        {/* ── Section 1: Overview ──────────────────────────────────── */}
        <Section title={t("form.overview.title")} description={t("form.overview.description")}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.descriptionLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.descriptionHint")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.descriptionPlaceholder")}
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.goalLabel")}</FormLabel>
                  <FormDescription>{t("form.goalHint")}</FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.goalPlaceholder")}
                      className="min-h-[70px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 2: Period ──────────────────────────────────────── */}
        <Section title={t("form.period.title")} description={t("form.period.description")}>
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
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value ?? ""}
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
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 3: Tech & Team ─────────────────────────────────── */}
        <Section title={t("form.techTeam.title")} description={t("form.techTeam.description")}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="myRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.myRoleLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.myRolePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.teamSizeLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={1} placeholder={t("form.teamSizePlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="technologies"
              render={() => (
                <FormItem>
                  <FormLabel>{t("form.technologiesLabel")}</FormLabel>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="technologies"
                      render={({ field }) => (
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("form.technologiesPlaceholder")}
                          max={30}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 4: Story ───────────────────────────────────────── */}
        <Section title={t("form.story.title")} description={t("form.story.description")}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.challengesLabel")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.challengesPlaceholder")} className="min-h-[80px] resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="results"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.resultsLabel")}</FormLabel>
                  <FormDescription>{t("form.resultsHint")}</FormDescription>
                  <FormControl>
                    <Textarea placeholder={t("form.resultsPlaceholder")} className="min-h-[80px] resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lessonsLearned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.lessonsLearnedLabel")}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t("form.lessonsLearnedPlaceholder")} className="min-h-[70px] resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 5: Publishing ──────────────────────────────────── */}
        <Section title={t("form.publishing.title")} description={t("form.publishing.description")}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>{t("form.tagsLabel")}</FormLabel>
                  <FormDescription>{t("form.tagsHint")}</FormDescription>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <TagInput value={field.value} onChange={field.onChange} placeholder={t("form.tagsPlaceholder")} max={20} />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="externalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.externalUrlLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.externalUrlPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.githubUrlLabel")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("form.githubUrlPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <FormField
                control={form.control}
                name="isHighlighted"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="font-normal cursor-pointer">{t("form.featureLabel")}</FormLabel>
                      <FormDescription className="mt-0">
                        {t("form.featureHint")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Section>

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.saving")}</> : (submitLabel ?? t("form.saveProject"))}
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
