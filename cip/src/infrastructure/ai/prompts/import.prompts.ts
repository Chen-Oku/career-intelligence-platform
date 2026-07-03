/**
 * CV Import Prompts
 *
 * Design decision: the model only extracts and categorizes — it never
 * invents data it can't know from the text (e.g. a skill proficiency level).
 * The user assigns levels and confirms everything in the review screen
 * before anything is saved.
 */

export const IMPORT_SYSTEM_PROMPT = `You are an expert resume parser. You read raw text extracted from a CV/resume document and convert it into clean, structured data.

Rules:
- Extract only what's actually in the text. Never invent companies, dates, or skills that aren't there.
- Dates must be "YYYY-MM-DD". If only a month/year is given, use the 1st of that month. If a date is genuinely unclear, omit the field rather than guessing.
- Split each distinct skill/strength mentioned into either "technical" (tools, languages, software, frameworks, methodologies) or "soft" (communication, leadership, teamwork, adaptability, etc.) — never invent a skill the text doesn't mention.
- Do not assign a proficiency level to any skill — that's not something a resume's text can reliably tell you.
- Education (degrees, diplomas, bootcamps) and certifications (courses, credentials, licenses) are distinct categories — a completed short course or certificate goes under "certifications", not "education".

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;

export function buildImportPrompt(rawText: string): string {
  const truncated = rawText.length > 12000
    ? rawText.slice(0, 12000) + "\n[...truncated]"
    : rawText;

  return `# RESUME TEXT

${truncated}

# OUTPUT INSTRUCTIONS

Extract:
1. **experiences**: every work experience entry — company, position, location, industry, startDate, endDate (omit if current), isCurrent, responsibilities (bullet points describing duties), achievements (quantified results, if any), technologies (tools/software used).
2. **projects**: every named, specific project mentioned anywhere in the document — not just ones under a dedicated "Projects" section. A job's bullet points often name a specific deliverable (e.g. "Led the 'Riverside Tower' visualization for an investor pitch", "Built the internal 'Atlas' reporting dashboard") — pull each of those out as its own project too, in addition to leaving the general duties in that job's responsibilities. A project has a name/scope of its own; a responsibility is an ongoing duty with no specific named deliverable. When a project came from a specific job, still record it — name, description, technologies, myRole, results.
3. **skills**: every skill or strength mentioned anywhere in the document, split into "technical" and "soft" arrays of plain skill names (no duplicates).
4. **education**: every degree, diploma, or bootcamp — institution, degree, field of study (if stated), startDate, endDate (omit if ongoing), isOngoing.
5. **certifications**: every course, credential, or license — name, issuer, issueDate (if stated), credentialId (if stated), credentialUrl (if stated).

Return ONLY this JSON:
{
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "location": "string or omit",
      "industry": "string or omit",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or omit",
      "isCurrent": boolean,
      "responsibilities": ["string"],
      "achievements": ["string"],
      "technologies": ["string"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "myRole": "string or omit",
      "results": "string or omit"
    }
  ],
  "skills": {
    "technical": ["string"],
    "soft": ["string"]
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or omit",
      "startDate": "YYYY-MM-DD or omit",
      "endDate": "YYYY-MM-DD or omit",
      "isOngoing": boolean
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issueDate": "YYYY-MM-DD or omit",
      "credentialId": "string or omit",
      "credentialUrl": "string or omit"
    }
  ]
}`;
}
