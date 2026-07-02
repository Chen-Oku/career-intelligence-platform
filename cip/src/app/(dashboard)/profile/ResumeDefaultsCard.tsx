"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { resumeDefaultsSchema, type ResumeDefaultsInput } from "@/lib/validators/resume.schema";
import { useResumeDefaults, useSaveResumeDefaults } from "@/hooks/useProfile";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/**
 * ResumeDefaultsCard — education + contact info saved once on the profile
 * and prefilled into every resume generation (they used to be retyped in
 * the generator form each time).
 */
export function ResumeDefaultsCard() {
  const t = useTranslations("profile.resumeDefaults");
  const { data, isLoading } = useResumeDefaults();
  const { mutate: save, isPending } = useSaveResumeDefaults();

  const form = useForm<ResumeDefaultsInput>({
    resolver: zodResolver(resumeDefaultsSchema),
    defaultValues: { education: [], contact: {} },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "education" });

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
              {/* Education */}
              <div>
                <p className="mb-3 text-sm font-medium">{t("educationHeading")}</p>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
                      <FormField
                        control={form.control} name={`education.${index}.institution`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>{t("institution")}</FormLabel>}
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control} name={`education.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>{t("degree")}</FormLabel>}
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control} name={`education.${index}.year`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>{t("year")}</FormLabel>}
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button" variant="ghost" size="icon"
                        className={cn("h-9 w-9 text-muted-foreground hover:text-destructive", index === 0 && "mt-6")}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => append({ institution: "", degree: "", year: "" })}
                    disabled={fields.length >= 5}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />{t("addEducation")}
                  </Button>
                </div>
              </div>

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
