import { geminiComplete } from "./GeminiClient";
import { IMPORT_SYSTEM_PROMPT, buildImportPrompt } from "../prompts/import.prompts";
import type {
  RawImportResult, ImportedExperience, ImportedProject, ImportedEducation, ImportedCertification,
} from "@/lib/types/cvImport";

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);

/**
 * CVImportService — extracts structured career data from raw resume text.
 *
 * Mirrors ResumeGeneratorService/JobAnalyzerService: call the model,
 * defensively parse its JSON response, surface a clear error if it
 * returned something unparseable.
 */
export class CVImportService {
  async extract(rawText: string): Promise<RawImportResult> {
    const raw = await geminiComplete({
      system: IMPORT_SYSTEM_PROMPT,
      prompt: buildImportPrompt(rawText),
      // A full multi-job resume echoes back a lot of text (every
      // responsibility/achievement) — 4096 was truncating mid-JSON
      // on longer CVs and breaking the parse below.
      maxTokens: 8192,
    });

    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): RawImportResult {
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
        console.error("[CVImportService] unparseable response (no JSON object found):", clean.slice(0, 1000));
        throw new Error("AI returned an invalid response format. Please try again.");
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        console.error("[CVImportService] unparseable response (likely truncated):", clean.slice(-500));
        throw new Error("AI returned an invalid response format. Please try again.");
      }
    }

    const content = parsed as Record<string, unknown>;
    if (!Array.isArray(content.experiences) || !Array.isArray(content.projects) || !content.skills) {
      console.error("[CVImportService] response missing required fields:", content);
      throw new Error("AI response was missing required fields. Please try again.");
    }

    return this.sanitize(content);
  }

  /**
   * The model's JSON isn't a type-checked boundary — it sometimes omits an
   * array field entirely when it has nothing to put in it (e.g. no
   * achievements for a role) instead of returning `[]` as instructed.
   * Normalize every array field here so nothing downstream has to guess.
   */
  private sanitize(content: Record<string, unknown>): RawImportResult {
    const experiences = (content.experiences as Record<string, unknown>[]).map(
      (e): ImportedExperience => ({
        company: typeof e.company === "string" ? e.company : "",
        position: typeof e.position === "string" ? e.position : "",
        location: typeof e.location === "string" ? e.location : undefined,
        industry: typeof e.industry === "string" ? e.industry : undefined,
        startDate: typeof e.startDate === "string" ? e.startDate : "",
        endDate: typeof e.endDate === "string" ? e.endDate : undefined,
        isCurrent: Boolean(e.isCurrent),
        responsibilities: asStringArray(e.responsibilities),
        achievements: asStringArray(e.achievements),
        technologies: asStringArray(e.technologies),
      }),
    );

    const projects = (content.projects as Record<string, unknown>[]).map(
      (p): ImportedProject => ({
        name: typeof p.name === "string" ? p.name : "",
        description: typeof p.description === "string" ? p.description : "",
        technologies: asStringArray(p.technologies),
        myRole: typeof p.myRole === "string" ? p.myRole : undefined,
        results: typeof p.results === "string" ? p.results : undefined,
      }),
    );

    const skills = content.skills as Record<string, unknown>;

    const education = (Array.isArray(content.education) ? content.education as Record<string, unknown>[] : []).map(
      (e): ImportedEducation => ({
        institution: typeof e.institution === "string" ? e.institution : "",
        degree: typeof e.degree === "string" ? e.degree : "",
        field: typeof e.field === "string" ? e.field : undefined,
        startDate: typeof e.startDate === "string" ? e.startDate : undefined,
        endDate: typeof e.endDate === "string" ? e.endDate : undefined,
        isOngoing: Boolean(e.isOngoing),
      }),
    );

    const certifications = (Array.isArray(content.certifications) ? content.certifications as Record<string, unknown>[] : []).map(
      (c): ImportedCertification => ({
        name: typeof c.name === "string" ? c.name : "",
        issuer: typeof c.issuer === "string" ? c.issuer : "",
        issueDate: typeof c.issueDate === "string" ? c.issueDate : undefined,
        credentialId: typeof c.credentialId === "string" ? c.credentialId : undefined,
        credentialUrl: typeof c.credentialUrl === "string" ? c.credentialUrl : undefined,
      }),
    );

    return {
      experiences,
      projects,
      skills: {
        technical: asStringArray(skills.technical),
        soft: asStringArray(skills.soft),
      },
      education,
      certifications,
    };
  }
}
