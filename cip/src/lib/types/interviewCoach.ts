export interface AnswerFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  /** null when the draft can't be honestly improved without inventing a detail */
  rewrittenSuggestion?: string | null;
}
