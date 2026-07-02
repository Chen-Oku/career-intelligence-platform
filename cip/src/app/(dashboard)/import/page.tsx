"use client";

import { useState } from "react";
import { Upload, Loader2, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ImportExperienceReview } from "@/components/import/ImportExperienceReview";
import { ImportProjectReview } from "@/components/import/ImportProjectReview";
import { ImportSkillsReview } from "@/components/import/ImportSkillsReview";
import type { RawImportResult } from "@/lib/types/cvImport";

export default function ImportPage() {
  const t = useTranslations("import");
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<RawImportResult | null>(null);
  const { toast } = useToast();

  const handleExtract = async () => {
    if (!file) return;
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }

      setResult(body.data as RawImportResult);
    } catch (error) {
      toast({
        title: t("upload.errorTitle"),
        description: error instanceof Error ? error.message : t("upload.errorDefault"),
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />

      {!result && (
        <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("upload.prompt")}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="max-w-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isExtracting}
            />
            <Button onClick={handleExtract} disabled={!file || isExtracting}>
              {isExtracting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("upload.extracting")}</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />{t("upload.extractButton")}</>
              )}
            </Button>
          </div>
          {isExtracting && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("upload.extractingHint")}
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setResult(null); setFile(null); }}
            className="mb-4"
          >
            {t("upload.importAnother")}
          </Button>

          <Tabs defaultValue="experience">
            <TabsList>
              <TabsTrigger value="experience">
                {t("tabs.experience", { count: result.experiences.length })}
              </TabsTrigger>
              <TabsTrigger value="projects">
                {t("tabs.projects", { count: result.projects.length })}
              </TabsTrigger>
              <TabsTrigger value="skills">
                {t("tabs.skills", { count: result.skills.technical.length + result.skills.soft.length })}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="experience" className="mt-4">
              <ImportExperienceReview items={result.experiences} />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <ImportProjectReview items={result.projects} />
            </TabsContent>
            <TabsContent value="skills" className="mt-4">
              <ImportSkillsReview skills={result.skills} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
