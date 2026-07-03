"use client";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { createExperienceSchema, CreateExperienceInput } from "@/lib/validators/experience.schema";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

interface ExperienceFormProps {
  defaultValues?: Partial<CreateExperienceInput>;
  onSubmit: (data: CreateExperienceInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * ExperienceForm — shared by both New and Edit pages.
 *
 * Architecture note: form logic is here, navigation/toast side-effects
 * are in the parent page. The form component only calls onSubmit.
 * This keeps the component reusable and easy to test.
 */
export function ExperienceForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
}: ExperienceFormProps) {
  const t = useTranslations("experience");
  const form = useForm<CreateExperienceInput>({
    resolver: zodResolver(createExperienceSchema),
    defaultValues: {
      company: "",
      position: "",
      industry: "",
      location: "",
      isCurrent: false,
      responsibilities: [],
      achievements: [],
      technologies: [],
      skills: [],
      hasLeadership: false,
      portfolioLinks: [],
      order: 0,
      ...defaultValues,
    },
  });

  const isCurrent = useWatch({ control: form.control, name: "isCurrent" });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 mt-6"
      >
        {/* ── Section 1: Role ────────────────────────────────────────── */}
        <Section
          title={t("form.roleSection.title")}
          description={t("form.roleSection.description")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.positionLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.positionPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.companyLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.companyPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.industryLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.industryPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.locationLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("form.locationPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Section>

        {/* ── Section 2: Period ──────────────────────────────────────── */}
        <Section
          title={t("form.periodSection.title")}
          description={t("form.periodSection.description")}
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isCurrent"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2.5 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) form.setValue("endDate", undefined);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    {t("form.currentCheckbox")}
                  </FormLabel>
                </FormItem>
              )}
            />

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
                        value={
                          field.value instanceof Date
                            ? field.value.toISOString().split("T")[0]
                            : field.value ?? ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isCurrent && (
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
                          value={
                            field.value instanceof Date
                              ? field.value.toISOString().split("T")[0]
                              : field.value ?? ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </Section>

        {/* ── Section 3: What you did ────────────────────────────────── */}
        <Section
          title={t("form.whatYouDidSection.title")}
          description={t("form.whatYouDidSection.description")}
        >
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="responsibilities"
              render={() => (
                <FormItem>
                  <FormLabel>{t("form.responsibilitiesLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.responsibilitiesDescription")}
                  </FormDescription>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="responsibilities"
                      render={({ field }) => (
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("form.responsibilitiesPlaceholder")}
                          max={15}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="achievements"
              render={() => (
                <FormItem>
                  <FormLabel>{t("form.achievementsLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.achievementsDescription")}
                  </FormDescription>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="achievements"
                      render={({ field }) => (
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("form.achievementsPlaceholder")}
                          max={10}
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

        {/* ── Section 4: Tech & Team ─────────────────────────────────── */}
        <Section
          title={t("form.skillsTeamSection.title")}
          description={t("form.skillsTeamSection.description")}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="technologies"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("form.technologiesLabel")}</FormLabel>
                    <FormDescription>{t("form.technologiesDescription")}</FormDescription>
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

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("form.skillsLabel")}</FormLabel>
                    <FormDescription>{t("form.skillsDescription")}</FormDescription>
                    <FormControl>
                      <Controller
                        control={form.control}
                        name="skills"
                        render={({ field }) => (
                          <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t("form.skillsPlaceholder")}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.teamSizeLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder={t("form.teamSizePlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasLeadership"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5 space-y-0 pb-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {t("form.leadershipCheckbox")}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Section>

        {/* ── Section 5: Story ───────────────────────────────────────── */}
        <Section
          title={t("form.storySection.title")}
          description={t("form.storySection.description")}
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.challengesLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.challengesDescription")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.challengesPlaceholder")}
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="starStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.starStoryLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.starStoryDescription")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("form.starStoryPlaceholder")}
                      className="min-h-[140px] resize-y font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolioLinks"
              render={() => (
                <FormItem>
                  <FormLabel>{t("form.portfolioLinksLabel")}</FormLabel>
                  <FormDescription>
                    {t("form.portfolioLinksDescription")}
                  </FormDescription>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="portfolioLinks"
                      render={({ field }) => (
                        <TagInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("form.portfolioLinksPlaceholder")}
                          urlMode
                          max={10}
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

        {/* ── Submit ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[140px]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("form.saving")}
              </>
            ) : (
              submitLabel ?? t("form.defaultSubmitLabel")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Section Layout Component ─────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Separator className="mb-4" />
      {children}
    </div>
  );
}
