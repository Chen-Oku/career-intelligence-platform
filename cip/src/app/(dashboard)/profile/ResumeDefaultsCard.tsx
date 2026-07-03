"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { resumeDefaultsSchema, type ResumeDefaultsInput } from "@/lib/validators/resume.schema";
import { useResumeDefaults, useSaveResumeDefaults } from "@/hooks/useProfile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

/**
 * ResumeDefaultsCard — contact info saved once on the profile and
 * prefilled into every resume generation. Education used to live here
 * too, but now comes from the Education entity (its own page) instead.
 */
export function ResumeDefaultsCard() {
  const t = useTranslations("profile.resumeDefaults");
  const { data, isLoading } = useResumeDefaults();
  const { mutate: save, isPending } = useSaveResumeDefaults();

  const form = useForm<ResumeDefaultsInput>({
    resolver: zodResolver(resumeDefaultsSchema),
    defaultValues: { displayName: "", contact: {} },
  });

  // Load saved defaults into the form once fetched. reset (not setValue)
  // so the form's dirty-state baseline is the saved data.
  useEffect(() => {
    if (data) form.reset(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => save(values))} className="space-y-6">
              {/* Display name */}
              <FormField control={form.control} name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("displayName")}</FormLabel>
                    <FormDescription>{t("displayNameHint")}</FormDescription>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder={t("displayNamePlaceholder")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact */}
              <div>
                <p className="mb-3 text-sm font-medium">{t("contactHeading")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([
                    { name: "contact.phone", label: t("phone") },
                    { name: "contact.location", label: t("location") },
                    { name: "contact.linkedin", label: t("linkedin") },
                    { name: "contact.portfolio", label: t("portfolio") },
                  ] as const).map(({ name, label }) => (
                    <FormField key={name} control={form.control} name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" size="sm" disabled={isPending || !form.formState.isDirty}>
                {isPending ? (
                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{t("saving")}</>
                ) : (
                  <><Save className="mr-1.5 h-3.5 w-3.5" />{t("save")}</>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
