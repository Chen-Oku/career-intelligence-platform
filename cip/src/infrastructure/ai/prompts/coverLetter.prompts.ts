import { buildCandidateSection, CandidateProfileContext } from "./job.prompts";
import { RESPONSE_QUALITY_BAR } from "./shared.prompts";
import { buildVoiceGuideSection } from "./profile.prompts";
import type { JobAnalysisData } from "@/lib/types/job";

/**
 * Cover Letter Prompts.
 *
 * Structure and strategy below follow the candidate's own cover-letter
 * playbook (structure / strategy / personalization / storytelling / review
 * checklist): Greeting -> Opening -> Why this company -> Relevant experience
 * -> Why I'm a strong fit -> Closing, grounded in real experience and
 * genuinely adapted per posting rather than a template with blanks filled in.
 *
 * "Why this company" is grounded only in what the job posting text and its
 * extracted hiringInsights actually say — never fabricated outside research
 * (recent news, market position, etc.) the model has no access to.
 */

export function buildCoverLetterSystemPrompt(voiceGuide?: string | null): string {
  return `You are a senior career coach who writes cover letters that get read, not skimmed past. You write in the candidate's first-person voice, grounded entirely in their real experience and the actual job posting — never generic, never templated.

GROUNDING RULE — strictly enforced: Use only facts from the candidate profile and the job posting/analysis provided in the prompt. You MUST NOT invent employers, technologies, achievements, company facts (mission, news, culture) not present in the job posting text, or any other detail absent from the input.

STRUCTURE — follow this order, but write it as flowing prose, not a labeled outline:
1. Greeting (use the company name; "Dear Hiring Team" if no contact name is known)
2. Opening — state the role and a genuine hook, not "I am writing to apply for..."
3. Why this company — reference something specific and real from the posting (what it says about the role, team, or what it's building), never invented outside knowledge
4. Relevant experience — 1-2 concrete stories connecting past work to this role's actual requirements: challenge -> contribution -> result
5. Why I'm a strong fit — direct connection between the candidate's real strengths/skills and this posting's stated requirements
6. Closing — confident, specific call to action, not "I look forward to hearing from you"

QUALITY BAR (review before finalizing):
- Correct company name and job title used consistently
- No generic filler sentences that could apply to any candidate for any job
- Naturally includes real keywords from the posting (not keyword-stuffed)
- No clichés ("team player," "passionate," "results-driven," "hard worker," "dynamic environment")
- 3-4 paragraphs, roughly 250-400 words — concise, not a life story
${RESPONSE_QUALITY_BAR}${buildVoiceGuideSection(voiceGuide)}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;
}

function buildJobPostingSection(company: string, jobTitle: string, jobText: string, analysis?: JobAnalysisData | null): string {
  const truncatedText = jobText.length > 3000 ? jobText.slice(0, 3000) + "\n[...truncated]" : jobText;

  const analysisLines = analysis
    ? [
        analysis.requiredSkills.length ? `Required skills: ${analysis.requiredSkills.join(", ")}` : null,
        analysis.responsibilities.length ? `Key responsibilities: ${analysis.responsibilities.join("; ")}` : null,
        analysis.hiringInsights.length ? `What this company/role seems to value: ${analysis.hiringInsights.join("; ")}` : null,
        analysis.matchedSkills.length ? `Skills the candidate already has that match: ${analysis.matchedSkills.join(", ")}` : null,
      ].filter(Boolean).join("\n")
    : "";

  return `# JOB POSTING
Company: ${company}
Role: ${jobTitle}

${truncatedText}
${analysisLines ? `\n# ANALYSIS OF THIS POSTING\n${analysisLines}` : ""}`;
}

export function buildCoverLetterPrompt(
  profile: CandidateProfileContext,
  company: string,
  jobTitle: string,
  jobText: string,
  language: string,
  analysis?: JobAnalysisData | null,
  extraNotes?: string,
): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildJobPostingSection(company, jobTitle, jobText, analysis)}

${buildCandidateSection(profile)}
${extraNotes?.trim() ? `\n# ADDITIONAL CONTEXT FROM THE CANDIDATE (their own words — use directly)\n${extraNotes.trim()}` : ""}

# TASK
Write a complete cover letter for this candidate applying to this specific role at this specific company, following the structure and quality bar in your instructions. Use ONLY facts from the candidate profile above and the job posting/analysis above.
All text in ${lang}.

Return ONLY this JSON:
{ "coverLetter": "string" }`;
}
