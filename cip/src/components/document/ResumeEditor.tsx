"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useExperiences } from "@/hooks/useExperiences";
import { useProjects } from "@/hooks/useProjects";
import { useUpdateResume, useSuggestTargetRole } from "@/hooks/useResumes";
import { ResumeDocument } from "./ResumeDocument";
import { PaginatedPage } from "./PaginatedPage";
import type { ResumeDTO, ResumeContent, ResumeContact } from "@/lib/types/resume";
import type { ExperienceDTO } from "@/lib/types/experience";
import type { ProjectDTO } from "@/lib/types/project";

type ExperienceItem = ResumeContent["experience"][number];
type ProjectItem = NonNullable<ResumeContent["projects"]>[number];

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * ResumeEditor — hand-edit a generated resume in place. No AI call: every
 * change here is applied to the draft client-side and only hits the
 * server on "Save" (PATCH /api/resumes/[id] via useUpdateResume). The
 * right-hand pane reuses ResumeDocument/PaginatedPage so what you see is
 * exactly what ResumePreview will render afterward.
 */
export function ResumeEditor({ resume, userName, onDone }: { resume: ResumeDTO; userName: string; onDone: () => void }) {
  const t = useTranslations("resumes.editor");
  const tPreview = useTranslations("resumes.preview");
  const { mutate: updateResume, isPending } = useUpdateResume();
  const { mutateAsync: suggestTargetRole, isPending: isSuggesting } = useSuggestTargetRole();
  const { data: allExperiences } = useExperiences();
  const { data: allProjects } = useProjects();

  const [content, setContent] = useState<ResumeContent>(resume.content as ResumeContent);
  const [contact, setContact] = useState<ResumeContact>(resume.contact as ResumeContact);
  const [targetRole, setTargetRole] = useState(resume.targetRole ?? "");
  const [roleSuggestions, setRoleSuggestions] = useState<string[] | null>(null);

  const handleSuggestTargetRole = async () => {
    const suggestions = await suggestTargetRole(resume.id);
    if (suggestions) setRoleSuggestions(suggestions);
  };

  const labels = {
    summary: tPreview("sections.summary"),
    experience: tPreview("sections.experience"),
    projects: tPreview("sections.projects"),
    skills: tPreview("sections.skills"),
    education: tPreview("sections.education"),
  };

  const handleSave = () => {
    updateResume(
      { id: resume.id, input: { content, contact, targetRole: targetRole.trim() || undefined } },
      { onSuccess: onDone },
    );
  };

  // ── Experience ──────────────────────────────────────────────────────────
  const includedExpKeys = new Set(content.experience.map((e) => `${e.company}::${e.position}`));
  const availableExperiences = (allExperiences ?? []).filter((e) => !includedExpKeys.has(`${e.company}::${e.position}`));

  const addExperience = (exp: ExperienceDTO) => {
    setContent((c) => ({
      ...c,
      experience: [
        ...c.experience,
        {
          company: exp.company,
          position: exp.position,
          location: exp.location,
          startDate: formatMonthYear(exp.startDate),
          endDate: exp.isCurrent ? "Present" : exp.endDate ? formatMonthYear(exp.endDate) : "",
          bullets: [...exp.achievements, ...exp.responsibilities],
        },
      ],
    }));
  };

  const removeExperience = (i: number) =>
    setContent((c) => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));

  const patchExperience = (i: number, patch: Partial<ExperienceItem>) =>
    setContent((c) => ({ ...c, experience: c.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));

  const updateBullet = (expIdx: number, bulletIdx: number, value: string) =>
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e, idx) =>
        idx === expIdx ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bulletIdx ? value : b)) } : e,
      ),
    }));

  const addBullet = (expIdx: number) =>
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e, idx) => (idx === expIdx ? { ...e, bullets: [...e.bullets, ""] } : e)),
    }));

  const removeBullet = (expIdx: number, bulletIdx: number) =>
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e, idx) =>
        idx === expIdx ? { ...e, bullets: e.bullets.filter((_, bi) => bi !== bulletIdx) } : e,
      ),
    }));

  // ── Projects ─────────────────────────────────────────────────────────────
  const includedProjectNames = new Set((content.projects ?? []).map((p) => p.name));
  const availableProjects = (allProjects ?? []).filter((p) => !includedProjectNames.has(p.name));
  const projectsVisible = content.sectionVisibility?.projects !== false;

  const addProject = (p: ProjectDTO) =>
    setContent((c) => ({
      ...c,
      projects: [...(c.projects ?? []), { name: p.name, description: p.description, technologies: p.technologies, url: p.externalUrl ?? null }],
      sectionVisibility: { ...c.sectionVisibility, projects: true },
    }));

  const removeProject = (i: number) =>
    setContent((c) => ({ ...c, projects: (c.projects ?? []).filter((_, idx) => idx !== i) }));

  const patchProject = (i: number, patch: Partial<ProjectItem>) =>
    setContent((c) => ({ ...c, projects: (c.projects ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));

  const setProjectsVisible = (visible: boolean) =>
    setContent((c) => ({ ...c, sectionVisibility: { ...c.sectionVisibility, projects: visible } }));

  // ── Skills ───────────────────────────────────────────────────────────────
  const setSkillItems = (groupIdx: number, itemsText: string) =>
    setContent((c) => ({
      ...c,
      skills: c.skills.map((g, idx) => (idx === groupIdx ? { ...g, items: itemsText.split(",").map((s) => s.trim()).filter(Boolean) } : g)),
    }));

  const removeSkillGroup = (groupIdx: number) =>
    setContent((c) => ({ ...c, skills: c.skills.filter((_, idx) => idx !== groupIdx) }));

  const addSkillGroup = () =>
    setContent((c) => ({ ...c, skills: [...c.skills, { category: t("skills.newCategoryPlaceholder"), items: [] }] }));

  // ── Education ────────────────────────────────────────────────────────────
  const patchEducation = (i: number, patch: Partial<ResumeContent["education"][number]>) =>
    setContent((c) => ({ ...c, education: c.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));

  const removeEducation = (i: number) =>
    setContent((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── Form ──────────────────────────────────────────────────────── */}
      <div className="space-y-8">
        {/* Header */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{t("headerSection")}</h3>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("targetRoleLabel")}</Label>
              <Button
                type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground"
                disabled={isSuggesting} onClick={handleSuggestTargetRole}
              >
                {isSuggesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                {t("suggestTargetRole")}
              </Button>
            </div>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder={t("targetRolePlaceholder")} />
            {roleSuggestions && roleSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {roleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => { setTargetRole(suggestion); setRoleSuggestions(null); }}
                    className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("contactFields.phone")}</Label>
              <Input value={contact.phone ?? ""} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("contactFields.location")}</Label>
              <Input value={contact.location ?? ""} onChange={(e) => setContact((c) => ({ ...c, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("contactFields.linkedin")}</Label>
              <Input value={contact.linkedin ?? ""} onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("contactFields.portfolio")}</Label>
              <Input value={contact.portfolio ?? ""} onChange={(e) => setContact((c) => ({ ...c, portfolio: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{labels.summary}</h3>
          <Separator />
          <Textarea rows={4} value={content.summary} onChange={(e) => setContent((c) => ({ ...c, summary: e.target.value }))} />
        </section>

        {/* Experience */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{labels.experience}</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={availableExperiences.length === 0}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t("addExperience")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("pickExperienceTitle")}</DialogTitle></DialogHeader>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {availableExperiences.length === 0 && <p className="text-sm text-muted-foreground">{t("noMoreExperiences")}</p>}
                  {availableExperiences.map((exp) => (
                    <DialogTrigger asChild key={exp.id}>
                      <button
                        type="button"
                        onClick={() => addExperience(exp)}
                        className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{exp.position}</span>
                        <span className="text-muted-foreground"> — {exp.company}</span>
                      </button>
                    </DialogTrigger>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="space-y-5">
            {content.experience.map((exp, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input value={exp.company} onChange={(e) => patchExperience(i, { company: e.target.value })} placeholder={t("fields.company")} />
                    <Input value={exp.position} onChange={(e) => patchExperience(i, { position: e.target.value })} placeholder={t("fields.position")} />
                    <Input value={exp.startDate} onChange={(e) => patchExperience(i, { startDate: e.target.value })} placeholder={t("fields.startDate")} />
                    <Input value={exp.endDate} onChange={(e) => patchExperience(i, { endDate: e.target.value })} placeholder={t("fields.endDate")} />
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeExperience(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {exp.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex items-center gap-1.5">
                      <Textarea rows={2} value={bullet} onChange={(e) => updateBullet(i, bi, e.target.value)} className="text-sm" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBullet(i, bi)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => addBullet(i)}>
                    <Plus className="mr-1 h-3 w-3" />{t("addBullet")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{labels.projects}</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={availableProjects.length === 0}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t("addProject")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("pickProjectTitle")}</DialogTitle></DialogHeader>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {availableProjects.length === 0 && <p className="text-sm text-muted-foreground">{t("noMoreProjects")}</p>}
                  {availableProjects.map((p) => (
                    <DialogTrigger asChild key={p.id}>
                      <button type="button" onClick={() => addProject(p)} className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted">
                        {p.name}
                      </button>
                    </DialogTrigger>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Checkbox id="projects-visible" checked={projectsVisible} onCheckedChange={(v) => setProjectsVisible(v === true)} />
            <Label htmlFor="projects-visible" className="text-sm font-normal">{t("showProjectsSection")}</Label>
          </div>
          {projectsVisible && (
            <div className="space-y-3">
              {(content.projects ?? []).map((project, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Input value={project.name} onChange={(e) => patchProject(i, { name: e.target.value })} placeholder={t("fields.projectName")} className="flex-1" />
                    <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeProject(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Textarea rows={2} value={project.description} onChange={(e) => patchProject(i, { description: e.target.value })} className="text-sm" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skills */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{labels.skills}</h3>
            <Button type="button" variant="outline" size="sm" onClick={addSkillGroup}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />{t("addSkillCategory")}
            </Button>
          </div>
          <Separator />
          <div className="space-y-2">
            {content.skills.map((group, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Input
                  value={group.category}
                  onChange={(e) => setContent((c) => ({ ...c, skills: c.skills.map((g, idx) => (idx === i ? { ...g, category: e.target.value } : g)) }))}
                  className="w-full sm:w-40 sm:shrink-0"
                />
                <div className="flex items-start gap-2">
                  <Input value={group.items.join(", ")} onChange={(e) => setSkillItems(i, e.target.value)} placeholder={t("skills.itemsPlaceholder")} className="min-w-0 flex-1" />
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeSkillGroup(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{labels.education}</h3>
          <Separator />
          <div className="space-y-2">
            {content.education.map((edu, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <Input value={edu.institution} onChange={(e) => patchEducation(i, { institution: e.target.value })} placeholder={t("fields.institution")} className="min-w-0 flex-1" />
                <Input value={edu.degree} onChange={(e) => patchEducation(i, { degree: e.target.value })} placeholder={t("fields.degree")} className="min-w-0 flex-1" />
                <div className="flex items-start gap-2">
                  <Input value={edu.year ?? ""} onChange={(e) => patchEducation(i, { year: e.target.value })} placeholder={t("fields.year")} className="w-full sm:w-20" />
                  <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeEducation(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-2 pb-8">
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {t("save")}
          </Button>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>{t("cancel")}</Button>
        </div>
      </div>

      {/* ── Live preview ──────────────────────────────────────────────── */}
      <div className="lg:sticky lg:top-6">
        <PaginatedPage>
          <ResumeDocument content={content} contact={contact} targetRole={targetRole || undefined} userName={userName} labels={labels} />
        </PaginatedPage>
      </div>
    </div>
  );
}
