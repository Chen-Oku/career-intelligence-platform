"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { generateResumeSchema, GenerateResumeInput } from "@/lib/validators/resume.schema";
import { useGenerateResume } from "@/hooks/useResumes";
import { useJobAnalysis } from "@/hooks/useJobAnalyzer";
import { useResumeDefaults } from "@/hooks/useProfile";
import { useResumeTypePresets } from "@/hooks/useResumeTypePresets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Sparkles, Target, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function ResumeGeneratorForm() {
  const t = useTranslations("resumes.generatorForm");
  // ?jobId= → tailor the resume to a previously analyzed job posting.
  const searchParams = useSearchParams();
  const [jobId, setJobId] = useState(searchParams.get("jobId") ?? "");
  const { data: targetJob } = useJobAnalysis(jobId);
  const GENERATION_STEPS = [
    t("generationSteps.step1"),
    t("generationSteps.step2"),
    t("generationSteps.step3"),
    t("generationSteps.step4"),
    t("generationSteps.step5"),
  ];
  const { mutateAsync: generate, isPending } = useGenerateResume();
  const [stepIndex, setStepIndex] = useState(0);

  // Advance loading step every 5 seconds during generation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the step counter when generation ends
    if (!isPending) { setStepIndex(0); return; }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  // Contact lives on the profile (Profile → Resume defaults) and is
  // prefilled here — no more retyping it on every generation. Education
  // is no longer a form field: it's fetched automatically from the
  // Education entity during generation, same as Certifications.
  const { data: defaults } = useResumeDefaults();
  const { data: presets } = useResumeTypePresets();

  const form = useForm<GenerateResumeInput>({
    resolver: zodResolver(generateResumeSchema),
    defaultValues: {
      type: "MASTER",
      title: "",
      // Controlled from the start: the type-change effect below setValue()s
      // this, so without a defined default the input flips uncontrolled →
      // controlled and React warns.
      targetRole: "",
      language: "en",
      contact: {},
    },
  });

  const watchType = useWatch({ control: form.control, name: "type" });

  // Prefill targetRole from the resume type's default title when the type
  // changes — respects manual edits: only overwrites when the field is
  // empty or still holds the previous type's auto-filled value. Skipped
  // entirely once a target job is set (that flow drives targetRole itself).
  const lastAutoTargetRole = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (targetJob) return;
    const suggested = presets?.find((p) => p.id === watchType)?.defaultTitle;
    const current = form.getValues("targetRole");
    if (!current || current === lastAutoTargetRole.current) {
      form.setValue("targetRole", suggested ?? "");
      lastAutoTargetRole.current = suggested;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchType]);

  // Prefill saved contact defaults once they load — but never clobber
  // fields the user already started editing.
  useEffect(() => {
    if (!defaults) return;
    const contact = form.getValues("contact");
    if (Object.values(contact).every((v) => !v)) {
      form.setValue("contact", defaults.contact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults]);

  // When a target job loads, pre-configure the form for it. The user can
  // still change anything — this is a starting point, not a lock.
  useEffect(() => {
    if (!targetJob) return;
    const role = targetJob.analyzedData.extractedRole || targetJob.title;
    form.setValue("jobDescriptionId", targetJob.id);
    form.setValue("type", "CUSTOM");
    form.setValue("targetRole", role);
    form.setValue("title", `${role}${targetJob.company ? ` — ${targetJob.company}` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetJob]);

  const clearTargetJob = () => {
    setJobId("");
    form.setValue("jobDescriptionId", undefined);
  };

  const handleSubmit = async (data: GenerateResumeInput) => {
    await generate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mt-6">

        {/* ── Target job banner ─────────────────────────────────────── */}
        {targetJob && (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {t("targetJob.heading", {
                  role: targetJob.analyzedData.extractedRole || targetJob.title,
                  company: targetJob.company || targetJob.analyzedData.extractedCompany || "—",
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("targetJob.description", { matchScore: targetJob.matchScore })}
              </p>
            </div>
            <Button
              type="button" variant="ghost" size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={clearTargetJob}
              title={t("targetJob.remove")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* ── Section 1: Resume Type ────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold mb-1">{t("resumeType.heading")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("resumeType.description")}</p>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control} name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resumeType.typeLabel")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="MASTER">{t("resumeType.builtinMaster")}</SelectItem>
                      {presets?.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                      ))}
                      <SelectItem value="CUSTOM">{t("resumeType.builtinCustom")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control} name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resumeType.labelField")}</FormLabel>
                  <FormControl><Input placeholder={t("resumeType.labelPlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control} name="targetRole"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t("resumeType.targetRoleLabel")}</FormLabel>
                  <FormDescription>
                    {watchType === "CUSTOM" ? t("resumeType.targetRoleDescription") : t("resumeType.professionalTitleDescription")}
                  </FormDescription>
                  <FormControl><Input placeholder={t("resumeType.targetRolePlaceholder")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control} name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("resumeType.languageLabel")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section 2: Contact ────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold mb-1">{t("contact.heading")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("contact.description")}</p>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "contact.phone" as const,     label: t("contact.phone"),     placeholder: "+57 318 877 8832" },
              { name: "contact.location" as const,  label: t("contact.location"),  placeholder: "Bogotá, Colombia" },
              { name: "contact.linkedin" as const,  label: t("contact.linkedin"),  placeholder: "in/mvsierra" },
              { name: "contact.portfolio" as const, label: t("contact.portfolio"), placeholder: "behance.net/Chenoku" },
            ].map(({ name, label, placeholder }) => (
              <FormField key={name} control={form.control} name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Input placeholder={placeholder} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("contact.hint")}</p>
        </div>

        {/* ── Generate ──────────────────────────────────────────────── */}
        <div className="pt-2 pb-8">
          {isPending && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {GENERATION_STEPS[stepIndex]}
              </p>
              <div className="mt-2 h-1 rounded-full bg-primary/10 overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full transition-all duration-1000"
                  style={{ width: `${((stepIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          <Button type="submit" disabled={isPending} size="lg" className="w-full">
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("submit.generating")}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />{t("submit.generate")}</>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t("submit.helperText")}</p>
        </div>
      </form>
    </Form>
  );
}
