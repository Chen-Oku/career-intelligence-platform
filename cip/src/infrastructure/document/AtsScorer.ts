import type { ResumeContent } from "@/lib/types/resume";
import type { TargetJobContext } from "@/infrastructure/ai/prompts/resume.prompts";

export interface AtsScoreResult {
  score: number;
  tips: string[];
}

const ACTION_VERB_START = /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+(ed|d|led|ted)?\b/;
const QUANTIFIED = /\d/;

/**
 * Deterministic ATS-friendliness scorer — runs on the already-generated
 * ResumeContent, no AI call. Same house pattern as
 * JobAnalyzerService.computeMatch(): a numeric score is computed from real
 * data, never asked from the model in the same JSON blob.
 */
export function computeAtsScore(content: ResumeContent, targetJob?: TargetJobContext): AtsScoreResult {
  const tips: string[] = [];
  const checks: { weight: number; pass: number }[] = [];

  // Summary present and a reasonable length
  const summaryLen = content.summary?.trim().length ?? 0;
  const summaryOk = summaryLen >= 80 && summaryLen <= 700;
  checks.push({ weight: 15, pass: summaryOk ? 1 : 0 });
  if (!summaryOk) tips.push("Write a professional summary of 2-4 sentences — ATS and recruiters both expect one at the top.");

  // Each experience entry has enough bullets
  const experiences = content.experience ?? [];
  const bulletsOk = experiences.length > 0
    ? experiences.filter((e) => e.bullets.length >= 3).length / experiences.length
    : 0;
  checks.push({ weight: 15, pass: bulletsOk });
  if (bulletsOk < 1) tips.push("Aim for at least 3 bullets per role — thin roles read as incomplete to both ATS and recruiters.");

  // Bullets start with a strong action verb
  const allBullets = experiences.flatMap((e) => e.bullets);
  const actionVerbOk = allBullets.length > 0
    ? allBullets.filter((b) => ACTION_VERB_START.test(b.trim())).length / allBullets.length
    : 0;
  checks.push({ weight: 15, pass: actionVerbOk });
  if (actionVerbOk < 0.7) tips.push("Start more bullets with a strong action verb (Led, Delivered, Reduced) instead of a noun or \"Responsible for\".");

  // Bullets contain a quantified result
  const quantifiedOk = allBullets.length > 0
    ? allBullets.filter((b) => QUANTIFIED.test(b)).length / allBullets.length
    : 0;
  checks.push({ weight: 15, pass: quantifiedOk });
  if (quantifiedOk < 0.4) tips.push("Add numbers where you can — percentages, team sizes, counts, timelines — quantified bullets score higher with both ATS and recruiters.");

  // Skills section present
  const skillsOk = (content.skills?.length ?? 0) > 0 ? 1 : 0;
  checks.push({ weight: 10, pass: skillsOk });
  if (!skillsOk) tips.push("Add a Skills section — many ATS systems weight keyword matches there most heavily.");

  // Education present
  const educationOk = (content.education?.length ?? 0) > 0 ? 1 : 0;
  checks.push({ weight: 5, pass: educationOk });

  // Keyword coverage against a targeted job posting, when one exists —
  // this replaces generic self-consistency scoring with the real thing.
  if (targetJob && targetJob.keywords.length > 0) {
    const haystack = resumeToSearchableText(content).toLowerCase();
    const matched = targetJob.keywords.filter((k) => haystack.includes(k.toLowerCase()));
    const coverage = matched.length / targetJob.keywords.length;
    checks.push({ weight: 25, pass: coverage });
    if (coverage < 0.6) {
      const missing = targetJob.keywords.filter((k) => !haystack.includes(k.toLowerCase())).slice(0, 5);
      if (missing.length) tips.push(`These job-posting keywords don't appear in the resume: ${missing.join(", ")}.`);
    }
  }

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.weight * c.pass, 0);
  const score = Math.round((weightedScore / totalWeight) * 100);

  return { score: Math.min(100, Math.max(0, score)), tips: tips.slice(0, 4) };
}

function resumeToSearchableText(content: ResumeContent): string {
  const parts = [
    content.summary,
    ...content.experience.flatMap((e) => e.bullets),
    ...content.skills.flatMap((s) => s.items),
    ...(content.projects ?? []).map((p) => `${p.description} ${p.technologies.join(" ")}`),
  ];
  return parts.join(" ");
}
