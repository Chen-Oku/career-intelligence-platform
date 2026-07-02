/**
 * JobAnalysisData — stored in JobDescription.analyzedData (Json field).
 *
 * Two distinct sources of truth within this object:
 * - Gemini produces: extractedRole, requiredSkills, niceToHaveSkills,
 *   keywords, responsibilities, yearsRequired, interviewQuestions,
 *   resumeTips, hiringInsights
 * - Our code computes: matchScore, matchedSkills, missingSkills
 *
 * Separating extraction from match calculation is a deliberate choice.
 * Match calculation is deterministic and should not depend on Gemini's
 * "opinion" of the score — it's computed from the user's actual skill
 * database against the extracted requirements.
 */

export interface InterviewQuestion {
  question: string;
  type: "BEHAVIORAL" | "TECHNICAL" | "SITUATIONAL";
  /** Reference to a story the user has that could answer this */
  storyHint?: string | null;
  /**
   * Draft answer grounded only in the candidate's real stories/experience —
   * null when nothing in their profile genuinely supports this question
   * (never a fabricated generic answer).
   */
  suggestedAnswer?: string | null;
}

export interface JobAnalysisData {
  // ── Extracted by Gemini ───────────────────────────────────────────
  extractedRole: string;
  extractedCompany?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  keywords: string[];
  responsibilities: string[];
  yearsRequired?: number;
  interviewQuestions: InterviewQuestion[];
  resumeTips: string[];
  /** High-signal observations about what this company/role truly values */
  hiringInsights: string[];

  // ── Computed by our code ──────────────────────────────────────────
  matchScore: number;          // 0–100
  matchedSkills: string[];     // Required skills the user has
  missingSkills: string[];     // Required skills the user lacks
  matchedNiceToHave: string[]; // Optional skills the user has
}

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface JobDescriptionDTO {
  id: string;
  company: string;
  title: string;
  rawText: string;
  analyzedData: JobAnalysisData;
  matchScore: number;
  missingSkills: string[];
  language: string;
  createdAt: string;
}
