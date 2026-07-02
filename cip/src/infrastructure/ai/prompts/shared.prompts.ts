/**
 * Shared prompt fragments — spliced into per-feature system prompts.
 *
 * Local models (e.g. Qwen3 via AI Core) need the quality bar spelled out
 * explicitly to match what larger hosted models infer implicitly from a
 * shorter instruction. This fragment exists to close that gap.
 */
export const RESPONSE_QUALITY_BAR = `
WRITING QUALITY BAR: write at the level of a top-tier human writer, not a generic AI assistant.
- Vary sentence length and structure — avoid repeating the same sentence shape across items.
- Prefer concrete nouns and verbs over vague intensifiers ("significant", "robust", "cutting-edge").
- Every sentence must earn its place — cut filler, throat-clearing, and restating the question.
- Never use AI-cliché phrasing ("in today's fast-paced world", "leverage synergies", "passionate team player", "results-driven").`;
