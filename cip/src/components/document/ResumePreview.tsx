"use client";

import { useState } from "react";
import { Copy, Download, Check, Trash2, Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDeleteResume, useDownloadResume } from "@/hooks/useResumes";
import { resumeToPlainText } from "@/lib/types/resume";
import { RESUME_TYPE_LABELS } from "@/lib/validators/resume.schema";
import { AtsScoreBadge } from "./AtsScoreBadge";
import { ResumeDocument } from "./ResumeDocument";
import { PaginatedPage } from "./PaginatedPage";
import type { ResumeDTO, ResumeContent, ResumeContact } from "@/lib/types/resume";

/**
 * ResumePreview — renders a ResumeDTO as a styled resume.
 *
 * Design choices:
 * - White card, clean typography — looks like a real resume
 * - Amber accent only on section headers — subtle brand presence
 * - Monospace for dates — precision/technical feel
 * - Download as PDF/Word — generated server-side, real selectable text
 * - Copy as text — instant ATS-friendly version
 *
 * The document itself (header + sections) is ResumeDocument — shared with
 * ResumeEditor's live preview pane so both stay visually identical.
 */
export function ResumePreview({ resume, userName, onEdit }: { resume: ResumeDTO; userName: string; onEdit?: () => void }) {
  const t = useTranslations("resumes.preview");
  const [copied, setCopied] = useState(false);
  const { mutate: deleteResume, isPending: isDeleting } = useDeleteResume();
  const { mutate: downloadResume, isPending: isDownloading } = useDownloadResume();
  const content = resume.content as ResumeContent;
  const contact = resume.contact as ResumeContact;

  const handleCopy = async () => {
    const text = resumeToPlainText(content, contact, userName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const labels = {
    summary: t("sections.summary"),
    experience: t("sections.experience"),
    projects: t("sections.projects"),
    skills: t("sections.skills"),
    education: t("sections.education"),
  };

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-mono-data">
              {resume.typeLabel ?? (resume.type in RESUME_TYPE_LABELS ? RESUME_TYPE_LABELS[resume.type] : resume.type)}
              {resume.targetRole && ` · ${resume.targetRole}`}
            </p>
            <p className="text-xs text-muted-foreground font-mono-data">
              {t("generated", { date: new Date(resume.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })}
            </p>
          </div>
          <AtsScoreBadge score={resume.atsScore} tips={content.atsTips} />
        </div>
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t("edit")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />{t("copied")}</> : <><Copy className="mr-1.5 h-3.5 w-3.5" />{t("copyText")}</>}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDownloading}>
                {isDownloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                {t("download")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadResume({ id: resume.id, format: "pdf" })}>
                {t("downloadPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadResume({ id: resume.id, format: "docx" })}>
                {t("downloadDocx")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteResume(resume.id)} disabled={isDeleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <PaginatedPage>
        <ResumeDocument content={content} contact={contact} targetRole={resume.targetRole} userName={userName} labels={labels} />
      </PaginatedPage>
    </div>
  );
}
