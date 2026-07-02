"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { analyzeJobSchema, AnalyzeJobInput } from "@/lib/validators/job.schema";
import { useAnalyzeJob } from "@/hooks/useJobAnalyzer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * JobAnalyzerForm — intentionally minimal.
 *
 * The main job is to receive the job description.
 * We don't ask for company/title upfront — Gemini extracts them.
 * The user can override if extraction misses something.
 */
export function JobAnalyzerForm() {
  const t = useTranslations("jobAnalyzer");
  const ANALYSIS_STEPS = [
    t("form.steps.reading"),
    t("form.steps.extracting"),
    t("form.steps.matching"),
    t("form.steps.generatingQuestions"),
    t("form.steps.writingTips"),
  ];
  const { mutateAsync: analyzeJob, isPending } = useAnalyzeJob();
  const [stepIndex, setStepIndex] = useState(0);
  const [prevIsPending, setPrevIsPending] = useState(isPending);

  if (isPending !== prevIsPending) {
    setPrevIsPending(isPending);
    if (!isPending) setStepIndex(0);
  }

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => setStepIndex((i) => Math.min(i + 1, ANALYSIS_STEPS.length - 1)), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  const form = useForm<AnalyzeJobInput>({
    resolver: zodResolver(analyzeJobSchema),
    defaultValues: { company: "", title: "", rawText: "", language: "en" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (d) => { await analyzeJob(d); })} className="space-y-5 mt-6">

        {/* Job description — the main input */}
        <FormField
          control={form.control} name="rawText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.jobDescriptionLabel")}</FormLabel>
              <FormDescription>
                {t("form.jobDescriptionHint")}
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder={t("form.jobDescriptionPlaceholder")}
                  className="min-h-[280px] resize-y font-mono text-sm leading-relaxed"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional overrides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control} name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.companyLabel")} <span className="text-muted-foreground font-normal">{t("form.companyOptional")}</span></FormLabel>
                <FormControl><Input placeholder={t("form.companyPlaceholder")} {...field} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control} name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.titleLabel")} <span className="text-muted-foreground font-normal">{t("form.titleOptional")}</span></FormLabel>
                <FormControl><Input placeholder={t("form.titlePlaceholder")} {...field} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control} name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.languageLabel")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* Loading state */}
        {isPending && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm text-primary font-medium flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {ANALYSIS_STEPS[stepIndex]}
            </p>
            <div className="mt-2 h-1 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="h-full bg-primary/40 rounded-full transition-all duration-1000"
                style={{ width: `${((stepIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="pb-6">
          <Button type="submit" disabled={isPending} size="lg" className="w-full">
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("form.analyzing")}</>
            ) : (
              <><Search className="mr-2 h-4 w-4" />{t("form.submit")}</>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("form.helperText")}
          </p>
        </div>
      </form>
    </Form>
  );
}
