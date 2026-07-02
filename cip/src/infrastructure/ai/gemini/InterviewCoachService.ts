import { geminiComplete } from "./GeminiClient";
import { INTERVIEW_COACH_SYSTEM_PROMPT, buildInterviewCoachPrompt } from "../prompts/interviewCoach.prompts";
import type { CandidateProfileContext } from "../prompts/job.prompts";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);

/** InterviewCoachService — evaluates a user-written interview answer against their real profile. */
export class InterviewCoachService {
  async evaluateAnswer(
    question: string,
    userAnswer: string,
    profile: CandidateProfileContext,
  ): Promise<AnswerFeedback> {
    const raw = await geminiComplete({
      system: INTERVIEW_COACH_SYSTEM_PROMPT,
      prompt: buildInterviewCoachPrompt(question, userAnswer, profile),
      maxTokens: 2048,
    });

    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): AnswerFeedback {
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
      if (!match) {
        console.error("[InterviewCoachService] unparseable response:", clean.slice(0, 1000));
        throw new Error("AI returned an invalid response format. Please try again.");
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        console.error("[InterviewCoachService] unparseable response (likely truncated):", clean.slice(-500));
        throw new Error("AI returned an invalid response format. Please try again.");
      }
    }

    const content = parsed as Record<string, unknown>;
    const score = typeof content.score === "number" ? content.score : 0;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      strengths: asStringArray(content.strengths),
      improvements: asStringArray(content.improvements),
      rewrittenSuggestion: typeof content.rewrittenSuggestion === "string" ? content.rewrittenSuggestion : null,
    };
  }
}
