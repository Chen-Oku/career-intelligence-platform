"use client";

import { useState } from "react";
import { Copy, Download, Check, Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useDeleteResume, useDownloadResume } from "@/hooks/useResumes";
import { resumeToPlainText } from "@/lib/types/resume";
import { RESUME_TYPE_LABELS } from "@/lib/validators/resume.schema";
import { cn } from "@/lib/utils";
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
 * The component reads from ResumeContent JSON, so the same data can
 * be rendered in different templates later without regenerating.
 */
export function ResumePreview({ resume, userName }: { resume: ResumeDTO; userName: string }) {
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

  const contactParts = [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin && `linkedin.com/${contact.linkedin.replace(/^(linkedin\.com\/|\/)/i, "")}`,
    contact.portfolio,
  ].filter(Boolean);

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted-foreground font-mono-data">
            {resume.type in RESUME_TYPE_LABELS ? RESUME_TYPE_LABELS[resume.type] : resume.type}
            {resume.targetRole && ` · ${resume.targetRole}`}
          </p>
          <p className="text-xs text-muted-foreground font-mono-data">
            {t("generated", { date: new Date(resume.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) })}
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Resume document */}
      <div
        className={cn(
          "bg-white rounded-lg border border-border shadow-sm",
          "p-10 max-w-[800px] mx-auto",
        )}
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        {/* Header */}
        <div className="text-center mb-6 pb-5 border-b border-gray-200">
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.02em", margin: 0, fontFamily: "system-ui, sans-serif" }}>
            {userName.toUpperCase()}
          </h1>
          {contactParts.length > 0 && (
            <p style={{ fontSize: 11, color: "#555", marginTop: 8, fontFamily: "monospace", lineHeight: 1.8 }}>
              {contactParts.join(" · ")}
            </p>
          )}
        </div>

        {/* Summary */}
        {content.summary && (
          <Section title={t("sections.summary")}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#1a1a1a", margin: 0 }}>{content.summary}</p>
          </Section>
        )}

        {/* Experience */}
        {content.experience?.length > 0 && (
          <Section title={t("sections.experience")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {content.experience.map((exp, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, fontFamily: "system-ui, sans-serif" }}>{exp.company}</span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#666" }}>
                      {exp.startDate} – {exp.endDate}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginTop: 1 }}>
                    <span style={{ fontSize: 13, color: "#333", fontStyle: "italic" }}>{exp.position}</span>
                    {exp.location && <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{exp.location}</span>}
                  </div>
                  <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", listStyle: "disc" }}>
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} style={{ fontSize: 13, lineHeight: 1.6, color: "#1a1a1a", marginBottom: 3 }}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {content.projects && content.projects.length > 0 && (
          <Section title={t("sections.projects")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {content.projects.map((project, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>{project.name}</span>
                    {project.technologies.length > 0 && (
                      <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                        {project.technologies.slice(0, 4).join(", ")}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#1a1a1a", margin: "3px 0 0", lineHeight: 1.6 }}>{project.description}</p>
                  {project.url && <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0", fontFamily: "monospace" }}>{project.url}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {content.skills?.length > 0 && (
          <Section title={t("sections.skills")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {content.skills.map((group, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, flexShrink: 0, fontFamily: "system-ui, sans-serif" }}>{group.category}:</span>
                  <span style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.6 }}>{group.items.join(", ")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {content.education?.length > 0 && (
          <Section title={t("sections.education")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {content.education.map((edu, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>{edu.institution}</span>
                    <p style={{ fontSize: 13, color: "#333", margin: "2px 0 0", fontStyle: "italic" }}>{edu.degree}</p>
                  </div>
                  {edu.year && <span style={{ fontSize: 11, fontFamily: "monospace", color: "#666", alignSelf: "flex-start" }}>{edu.year}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <h2 style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
          color: "#C2782A", margin: 0, fontFamily: "system-ui, sans-serif",
        }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
      </div>
      {children}
    </div>
  );
}
