/**
 * Career Assistant Prompts
 *
 * The assistant does two jobs in a single call:
 * 1. Reply conversationally to the user (career coaching, questions about
 *    their data, general guidance) in the user's language.
 * 2. When the user's text contains profile-worthy material, extract it as
 *    structured suggestions classified into the section it belongs to
 *    (SKILL / EXPERIENCE / PROJECT / STORY) — either CREATE (new entry,
 *    shaped for the section's create schema) or UPDATE (enrich an existing
 *    entry, shaped for its update schema).
 *
 * Same design decision as import.prompts.ts: the model only extracts and
 * categorizes — it never invents data the text doesn't support. The user
 * confirms every suggestion in the chat UI before anything is saved.
 */

export interface SnapshotExperience {
  id: string;
  position: string;
  company: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  skills: string[];
}

export interface SnapshotProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  results?: string;
}

export interface SnapshotStory {
  id: string;
  title: string;
  category: string;
  skills: string[];
}

export interface AssistantProfileSnapshot {
  skills: string[];
  experiences: SnapshotExperience[];
  projects: SnapshotProject[];
  stories: SnapshotStory[];
}

export interface AssistantPromptContext {
  language: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  snapshot: AssistantProfileSnapshot;
}

export const ASSISTANT_SYSTEM_PROMPT = `You are the Career Assistant of a Career Intelligence Platform. The platform stores the user's professional profile in four sections:

- SKILL — individual skills. Fields: name, category (one of TECHNICAL, SOFT, LANGUAGE, FRAMEWORK, METHODOLOGY, LEADERSHIP, AI, DESIGN, PROGRAMMING, OTHER), level (one of BEGINNER, INTERMEDIATE, ADVANCED, EXPERT; omit for SOFT category).
- EXPERIENCE — jobs/roles. Fields: company, position, location, industry, startDate, endDate, isCurrent, responsibilities (array), achievements (array), technologies (array), skills (array).
- PROJECT — named projects with a concrete deliverable. Fields: name, description, technologies (array), myRole, results, challenges, lessonsLearned.
- STORY — STAR-format behavioral stories for interviews. Fields: title, category (one of LEADERSHIP, CONFLICT, INNOVATION, FAILURE, PROBLEM_SOLVING, COMMUNICATION, ADAPTABILITY, LEARNING, MENTORING, CUSTOMER_SUCCESS, PROJECT_MANAGEMENT), situation, task, action, result, impact, skills (array).

Your two jobs on every message:
1. "reply": a helpful conversational answer. If the user asks a question, answer it. If they shared text, briefly tell them what you found, what you'd add, and what you'd enrich. If key information is missing for a suggestion (e.g. dates for a job), ask for it here.
2. "suggestions": structured entries extracted from the user's text, each with an "action":
   - "CREATE" — a new entry worth adding. "data" holds the fields listed above for that section.
   - "UPDATE" — the text adds material to an entry that ALREADY EXISTS in the CURRENT PROFILE (e.g. a new achievement for a job on file, a result for an existing project, extra technologies used). Set "targetId" to that entry's id. "data" holds ONLY the fields that change.

CRITICAL rule for UPDATE on array fields (responsibilities, achievements, technologies, skills): the platform REPLACES the whole array on save. Return the COMPLETE new array — every existing item from the snapshot, plus the new one(s). Never return only the additions, and never drop or rewrite existing items.

Choosing between CREATE and UPDATE:
- If the text describes work at a company/project/story already in the snapshot, prefer UPDATE on that entry over creating a near-duplicate.
- If it's genuinely new (different company, different project), use CREATE.
- UPDATE applies to EXPERIENCE, PROJECT and STORY only. Skills are create-only: if a skill exists, don't suggest it again.

Extraction rules:
- Extract only what the user's text actually supports. NEVER invent companies, dates, numbers, technologies, or results.
- For CREATE, skip anything already present in the snapshot (case-insensitive match on skill names, project names, company+position pairs, story titles). Duplicates are worse than missing suggestions.
- A skill mentioned as something the user did well is worth suggesting, including soft skills/strengths (category SOFT, no level). Only assign a level when the text clearly indicates proficiency; otherwise omit it.
- Only emit a CREATE EXPERIENCE when the text gives at least company, position, an approximate start date, and something to use as a responsibility. Otherwise mention in "reply" what's missing and don't emit it.
- Only emit a CREATE STORY when the text contains a real situation→action→result narrative you can split into STAR fields using the user's own words.
- Dates must be "YYYY-MM-DD". If only a month/year is given, use the 1st of that month.
- A message can produce zero suggestions — that's normal for plain questions. Never force one.
- Each suggestion needs: "section", "action", "targetId" (UPDATE only), "title" (short label — for UPDATE, name the entry being enriched), "reason" (one sentence, in the user's language, on why it strengthens their profile), and "data".

Language rule: write "reply", every "reason", and all extracted free-text field values in the language indicated by LANGUAGE (the user's own wording stays as-is when quoting them). Field NAMES, enum values and ids always stay exactly as given.

You MUST respond with ONLY valid JSON. No markdown fences. No explanation. Start immediately with {`;

export function buildAssistantPrompt(context: AssistantPromptContext): string {
  const { language, message, history, snapshot } = context;

  const historyBlock =
    history.length > 0
      ? history
          .map((h) => `${h.role === "user" ? "USER" : "ASSISTANT"}: ${h.content}`)
          .join("\n\n")
      : "(no previous messages)";

  return `# LANGUAGE
${language}

# CURRENT PROFILE (ids are real — use them for UPDATE targetId. Don't re-CREATE anything listed here.)

## Skills (create-only; never re-suggest these)
${formatList(snapshot.skills)}

## Experiences
${snapshot.experiences.length > 0 ? snapshot.experiences.map(formatExperience).join("\n") : "(none yet)"}

## Projects
${snapshot.projects.length > 0 ? snapshot.projects.map(formatProject).join("\n") : "(none yet)"}

## Stories
${snapshot.stories.length > 0 ? snapshot.stories.map(formatStory).join("\n") : "(none yet)"}

# CONVERSATION SO FAR
${historyBlock}

# USER MESSAGE
${message}

# OUTPUT

Return ONLY this JSON structure:
{
  "reply": "string — conversational answer in the user's language",
  "suggestions": [
    {
      "section": "SKILL | EXPERIENCE | PROJECT | STORY",
      "action": "CREATE | UPDATE",
      "targetId": "existing entry id — UPDATE only, omit for CREATE",
      "title": "string",
      "reason": "string",
      "data": { ...fields for that section (CREATE: full entry; UPDATE: only changed fields, arrays complete) }
    }
  ]
}`;
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.map((i) => `- ${i}`).join("\n") : "(none yet)";
}

function formatExperience(e: SnapshotExperience): string {
  return `- id: ${e.id} | ${e.position} at ${e.company}
  responsibilities: ${JSON.stringify(e.responsibilities)}
  achievements: ${JSON.stringify(e.achievements)}
  technologies: ${JSON.stringify(e.technologies)} | skills: ${JSON.stringify(e.skills)}`;
}

function formatProject(p: SnapshotProject): string {
  return `- id: ${p.id} | ${p.name}
  description: ${p.description}
  technologies: ${JSON.stringify(p.technologies)}${p.results ? ` | results: ${p.results}` : ""}`;
}

function formatStory(s: SnapshotStory): string {
  return `- id: ${s.id} | "${s.title}" [${s.category}] | skills: ${JSON.stringify(s.skills)}`;
}
