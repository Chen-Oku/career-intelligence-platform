import { geminiComplete } from "./GeminiClient";
import {
  JOB_ANALYZER_SYSTEM_PROMPT,
  buildJobAnalyzerPrompt,
  buildRegenerateAnswerPrompt,
  JobPromptContext,
  CandidateProfileContext,
} from "../prompts/job.prompts";
import { buildCandidateProfileContext } from "../buildCandidateProfileContext";
import type { JobAnalysisData, InterviewQuestion } from "@/lib/types/job";
import type { Skill } from "@/domain/career/entities/Skill";
import type { Experience } from "@/domain/career/entities/Experience";
import type { Story } from "@/domain/career/entities/Story";
import type { Project } from "@/domain/career/entities/Project";

/** Raw extraction result from the model (before match score is added) */
interface ModelJobExtraction {
  extractedRole: string;
  extractedCompany?: string | null;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  keywords: string[];
  responsibilities: string[];
  yearsRequired?: number | null;
  interviewQuestions: InterviewQuestion[];
  resumeTips: string[];
  hiringInsights: string[];
}

export class JobAnalyzerService {
  async analyze(
    jobText: string,
    language: string,
    skills: Skill[],
    experiences: Experience[],
    stories: Story[],
    projects: Project[],
  ): Promise<JobAnalysisData> {
    // 1. Build prompt context
    const context: JobPromptContext = {
      jobText,
      language,
      ...buildCandidateProfileContext(skills, experiences, stories, projects),
    };

    // 2. Call the model for extraction + recommendations
    const raw = await geminiComplete({
      system: JOB_ANALYZER_SYSTEM_PROMPT,
      prompt: buildJobAnalyzerPrompt(context),
      // 8-10 questions each with a full suggestedAnswer, plus tips/insights,
      // needs real headroom — 4096 was already tight before suggestedAnswer existed.
      maxTokens: 8192,
    });

    const extraction = this.parseResponse(raw);

    // 3. Compute match score deterministically from the user's actual skill data
    const matchResult = this.computeMatch(
      extraction.requiredSkills,
      extraction.niceToHaveSkills,
      skills,
    );

    // 4. Assemble the full analysis
    return {
      extractedRole: extraction.extractedRole ?? "Unknown Role",
      extractedCompany: extraction.extractedCompany ?? undefined,
      requiredSkills: extraction.requiredSkills ?? [],
      niceToHaveSkills: extraction.niceToHaveSkills ?? [],
      keywords: extraction.keywords ?? [],
      responsibilities: extraction.responsibilities ?? [],
      yearsRequired: extraction.yearsRequired ?? undefined,
      interviewQuestions: extraction.interviewQuestions ?? [],
      resumeTips: extraction.resumeTips ?? [],
      hiringInsights: extraction.hiringInsights ?? [],
      ...matchResult,
    };
  }

  /** Regenerates a single question's suggestedAnswer with a different angle than the previous one. */
  async regenerateAnswer(
    question: string,
    previousAnswer: string,
    profile: CandidateProfileContext,
    language: string,
  ): Promise<string | null> {
    const raw = await geminiComplete({
      system: JOB_ANALYZER_SYSTEM_PROMPT,
      prompt: buildRegenerateAnswerPrompt({ ...profile, question, previousAnswer, language }),
      maxTokens: 1024,
    });

    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an invalid response. Please try again.");
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("AI returned an invalid response. Please try again.");
      }
    }

    const content = parsed as Record<string, unknown>;
    return typeof content.suggestedAnswer === "string" ? content.suggestedAnswer : null;
  }

  // ─── Match Scoring ──────────────────────────────────────────────────────────

  /**
   * Computes match score from the user's real skill database.
   *
   * Algorithm:
   * - Required skills matched → 0–75 points (proportional)
   * - Nice-to-have skills matched → 0–25 points (proportional)
   * - If no required skills detected → score = 65 (neutral, insufficient data)
   *
   * Fuzzy matching: "3ds Max" matches "3DS Max", "3dsmax", "3ds max (expert)"
   */
  private computeMatch(
    requiredSkills: string[],
    niceToHaveSkills: string[],
    userSkills: Skill[],
  ): Pick<JobAnalysisData, "matchScore" | "matchedSkills" | "missingSkills" | "matchedNiceToHave"> {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "");

    const userNormalized = userSkills.map((s) => normalize(s.name));

    const fuzzyMatch = (target: string): boolean => {
      const norm = normalize(target);
      return userNormalized.some(
        (u) => u.includes(norm) || norm.includes(u),
      );
    };

    const matchedSkills = requiredSkills.filter(fuzzyMatch);
    const missingSkills = requiredSkills.filter((s) => !fuzzyMatch(s));
    const matchedNiceToHave = niceToHaveSkills.filter(fuzzyMatch);

    let matchScore: number;
    if (requiredSkills.length === 0) {
      matchScore = 65; // Not enough data to score accurately
    } else {
      const requiredScore = (matchedSkills.length / requiredSkills.length) * 75;
      const niceScore =
        niceToHaveSkills.length > 0
          ? (matchedNiceToHave.length / niceToHaveSkills.length) * 25
          : 25; // No nice-to-haves listed → full bonus
      matchScore = Math.min(100, Math.round(requiredScore + niceScore));
    }

    return { matchScore, matchedSkills, missingSkills, matchedNiceToHave };
  }

  // ─── Response Parser ────────────────────────────────────────────────────────

  private parseResponse(raw: string): ModelJobExtraction {
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(clean) as ModelJobExtraction;
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]) as ModelJobExtraction; } catch {}
      }
      console.error("[JobAnalyzerService] unparseable response:", clean.slice(-500));
      throw new Error("AI returned an invalid response. Please try again.");
    }
  }
}
