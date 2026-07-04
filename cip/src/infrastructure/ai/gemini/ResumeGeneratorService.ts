import { geminiComplete } from "./GeminiClient";
import {
  RESUME_SYSTEM_PROMPT,
  buildResumePrompt,
  CareerContext,
  ResumeConfig,
} from "../prompts/resume.prompts";
import type { ResumeContent } from "@/lib/types/resume";
import type { Experience } from "@/domain/career/entities/Experience";
import type { Project } from "@/domain/career/entities/Project";
import type { Skill } from "@/domain/career/entities/Skill";
import type { Story } from "@/domain/career/entities/Story";
import type { Certification } from "@/domain/career/entities/Certification";
import type { Education } from "@/domain/career/entities/Education";
import { CATEGORY_LABELS } from "@/lib/types/skill";

/**
 * ResumeGeneratorService — orchestrates AI resume generation.
 *
 * Responsibilities:
 * 1. Convert domain entities → CareerContext (prompt-friendly format)
 * 2. Build the prompt
 * 3. Call the model
 * 4. Parse and validate the JSON response
 *
 * What it does NOT do:
 * - Fetch data (that's the use case's job)
 * - Save to database (that's the repository's job)
 * - Handle HTTP (that's the API route's job)
 */
export class ResumeGeneratorService {
  async generate(
    experiences: Experience[],
    projects: Project[],
    skills: Skill[],
    stories: Story[],
    certifications: Certification[],
    education: Education[],
    config: ResumeConfig,
  ): Promise<ResumeContent> {
    const context = this.buildContext(experiences, projects, skills, stories, certifications, education);
    const prompt = buildResumePrompt(context, config);

    const raw = await geminiComplete({
      system: RESUME_SYSTEM_PROMPT,
      prompt,
      // A full multi-job resume echoes back a lot of text — 4096 was
      // truncating mid-JSON on richer profiles and breaking the parse below.
      maxTokens: 8192,
      // Moderate temperature: 0.3 was so faithful that bullets came out nearly
      // identical across resume types (only the summary varied). 0.5 gives the
      // model enough room to re-emphasize/rephrase per the type-specific
      // instructions while the strict GROUNDING RULE still blocks fabrication.
      temperature: 0.5,
    });

    return this.parseResponse(raw);
  }

  // ─── Context Builder ────────────────────────────────────────────────────────

  private buildContext(
    experiences: Experience[],
    projects: Project[],
    skills: Skill[],
    stories: Story[],
    certifications: Certification[],
    education: Education[],
  ): CareerContext {
    return {
      experiences: experiences.map((e) => ({
        company: e.company,
        position: e.position,
        location: e.location,
        startDate: e.dateRange.startDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        endDate: e.isCurrent ? "Present" : (e.dateRange.endDate?.toLocaleDateString("en-US", { month: "short", year: "numeric" }) ?? ""),
        durationLabel: e.durationLabel,
        isCurrent: e.isCurrent,
        responsibilities: e.responsibilities,
        achievements: e.achievements,
        technologies: e.technologies,
      })),

      projects: projects.map((p) => ({
        name: p.name,
        myRole: p.myRole,
        description: p.description,
        technologies: p.technologies,
        results: p.results,
        isHighlighted: p.isHighlighted,
        externalUrl: p.externalUrl,
      })),

      // Group skills by category, sorted by level desc
      skillGroups: this.groupSkills(skills),

      stories: stories.map((s) => ({
        category: s.category,
        title: s.title,
        situation: s.situation,
        task: s.task,
        action: s.action,
        result: s.result,
        impact: s.impact,
      })),

      certifications: certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        year: c.issueDate?.getFullYear().toString(),
      })),

      education: education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        year: (e.isOngoing ? e.startDate : e.endDate ?? e.startDate)?.getFullYear().toString(),
        isOngoing: e.isOngoing,
      })),
    };
  }

  private groupSkills(skills: Skill[]): CareerContext["skillGroups"] {
    const map = new Map<string, { name: string; level?: string }[]>();

    for (const skill of skills) {
      const label = CATEGORY_LABELS[skill.category] ?? skill.category;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push({ name: skill.name, level: skill.level });
    }

    return Array.from(map.entries()).map(([category, skills]) => ({
      category,
      skills: skills.sort((a, b) => {
        const order = { EXPERT: 0, ADVANCED: 1, INTERMEDIATE: 2, BEGINNER: 3 };
        return (order[a.level as keyof typeof order] ?? 4) - (order[b.level as keyof typeof order] ?? 4);
      }),
    }));
  }

  // ─── Response Parser ────────────────────────────────────────────────────────

  private parseResponse(raw: string): ResumeContent {
    // Strip accidental markdown fences the model sometimes adds despite instructions
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;

    try {
      parsed = JSON.parse(clean);
    } catch {
      // If the model returned invalid JSON, try extracting the JSON block
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("[ResumeGeneratorService] unparseable response (no JSON object found):", clean.slice(0, 1000));
        throw new Error(
          "AI returned an invalid response format. Please try again.",
        );
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        console.error("[ResumeGeneratorService] unparseable response (likely truncated):", clean.slice(-500));
        throw new Error(
          "AI returned an invalid response format. Please try again.",
        );
      }
    }

    // Basic structure validation
    const content = parsed as Record<string, unknown>;
    if (!content.summary || !Array.isArray(content.experience)) {
      console.error("[ResumeGeneratorService] response missing required fields:", content);
      throw new Error(
        "AI response was missing required fields. Please try again.",
      );
    }

    return parsed as ResumeContent;
  }
}
