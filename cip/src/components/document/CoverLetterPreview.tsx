"use client";

import { useState } from "react";
import { Copy, Download, Check, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDeleteCoverLetter, useDownloadCoverLetter } from "@/hooks/useCoverLetters";
import type { CoverLetterDTO } from "@/lib/types/coverLetter";

/**
 * CoverLetterPreview — renders a CoverLetterDTO as a styled document,
 * mirroring ResumePreview's action bar (copy / download PDF/Word / delete).
 * Content is plain text (paragraphs split on blank lines), unlike Resume's
 * structured JSON content.
 */
export function CoverLetterPreview({ coverLetter, userName }: { coverLetter: CoverLetterDTO; userName: string }) {
  const t = useTranslations("coverLetters.preview");
  const [copied, setCopied] = useState(false);
  const { mutate: deleteCoverLetter, isPending: isDeleting } = useDeleteCoverLetter();
  const { mutate: downloadCoverLetter, isPending: isDownloading } = useDownloadCoverLetter();

  const paragraphs = coverLetter.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-mono-data">
            {coverLetter.company} · {coverLetter.jobTitle}
          </p>
          <p className="text-xs text-muted-foreground font-mono-data">
            {t("generated", { date: new Date(coverLetter.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
              <DropdownMenuItem onClick={() => downloadCoverLetter({ id: coverLetter.id, format: "pdf" })}>
                {t("downloadPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadCoverLetter({ id: coverLetter.id, format: "docx" })}>
                {t("downloadDocx")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => deleteCoverLetter(coverLetter.id)} disabled={isDeleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Letter document */}
      <div className="rounded-lg border border-border bg-card p-8 space-y-4">
        <div>
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(coverLetter.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="space-y-4 text-sm leading-relaxed">
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
