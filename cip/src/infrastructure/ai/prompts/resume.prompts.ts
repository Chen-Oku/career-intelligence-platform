import type { ResumeContact } from "@/lib/types/resume";
import { BULLET_TRANSFORMATIONS, SUMMARY_EXAMPLE, PROJECT_EXAMPLE } from "./examples/resume.examples";
import { RESPONSE_QUALITY_BAR } from "./shared.prompts";

/**
 * Resume Prompt Engineering
 *
 * This file is where the product value of the AI feature lives.
 * The quality of the resume output depends entirely on how well
 * we structure the career data for the model.
 *
 * Design principles:
 * 1. Give the model structured, human-readable data — not raw JSON
 * 2. Separate instructions from data clearly
 * 3. Specify the output schema precisely so JSON parsing never fails
 * 4. Type-specific instructions that tailor the output focus
 * 5. Use STAR stories as context for bullet generation — not as bullets themselves
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExperienceData {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  durationLabel: string;
  isCurrent: boolean;
  responsibilities: readonly string[];
  achievements: readonly string[];
  technologies: readonly string[];
}

export interface ProjectData {
  name: string;
  myRole?: string;
  description: string;
  technologies: readonly string[];
  results?: string;
  isHighlighted: boolean;
  externalUrl?: string;
}

export interface SkillGroupData {
  category: string;
  skills: { name: string; level?: string }[];
}

export interface StoryData {
  category: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  impact?: string;
}

export interface CertificationData {
  name: string;
  issuer: string;
  year?: string;
}

export interface EducationData {
  institution: string;
  degree: string;
  field?: string;
  year?: string;
  isOngoing: boolean;
}

export interface CareerContext {
  experiences: ExperienceData[];
  projects: ProjectData[];
  skillGroups: SkillGroupData[];
  stories: StoryData[];
  certifications: CertificationData[];
  education: EducationData[];
}

export interface ResumeConfig {
  type: string;
  title: string;
  targetRole?: string;
  language: string;
  contact: ResumeContact;
  userName: string;
  /**
   * Present when the resume targets a specific analyzed job posting.
   * Built from JobDescription.analyzedData — keywords and skills come from
   * the Job Analyzer's extraction, so the resume can be tuned to what the
   * posting actually asks for (ATS keywords included) without re-analyzing.
   */
  targetJob?: TargetJobContext;
}

export interface TargetJobContext {
  role: string;
  company?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  keywords: string[];
  responsibilities: string[];
  resumeTips: string[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

export const RESUME_SYSTEM_PROMPT = `You are an expert resume writer specializing in the 3D visualization, architecture, game development, and creative technology industries. You have written resumes for 1,000+ professionals.

GROUNDING RULE — strictly enforced: You work exclusively from the data provided in the prompt. You MUST NOT add company names, job titles, technologies, tools, certifications, dates, metrics, or achievements that do not appear in the input. If the data is sparse, write shorter bullets — never invent details to fill space. Every single claim in the output must be directly traceable to a field in the provided career data.

Your writing style:
- Every bullet starts with a strong, specific action verb: Delivered, Designed, Led, Optimized, Developed, Reduced, Implemented, Architected, Produced
- Quantify wherever the data supports it — render counts, percentages, team sizes, timelines, project values
- Active voice only. No "Responsible for", no "Assisted with", no "Helped to"
- Specific over generic — "Produced 12 photorealistic renders of a 200-seat university auditorium" beats "Created architectural visualizations"
- Each bullet answers the implicit question "so what?" — impact is always clear
- Professional summary starts with the professional identity, not "I am" — e.g., "Industrial Designer and 3D Artist with 9+ years..."

ATS SAFETY — every resume must parse cleanly through an Applicant Tracking System, not just read well to a human:
- Plain-ASCII bullet content only — no decorative unicode symbols, emoji, or special glyphs inside bullet text.
- Spell an acronym out in full the first time it's used, then the acronym alone after (e.g. "Unreal Engine 5 (UE5)", then "UE5").
- Use the candidate's exact tool/skill/technology names verbatim, exactly as given in the data — never a paraphrase or a more "natural-sounding" substitute, since ATS keyword matching is literal.
${RESPONSE_QUALITY_BAR}

You MUST respond with ONLY valid JSON. No markdown code blocks, no explanation, no preamble. Start your response with { and end with }.

## EXAMPLES OF IDEAL OUTPUT

These show the transformation from raw user data to polished resume content.
Study the structure, specificity, and tone — then apply the same quality to the actual career data you receive.

### Bullet point transformations (raw input → ideal output):
${BULLET_TRANSFORMATIONS}

### Ideal professional summary:
${SUMMARY_EXAMPLE}

### Ideal project description:
${PROJECT_EXAMPLE}`;

// ─── Prompt Builder ───────────────────────────────────────────────────────────

export function buildResumePrompt(
  context: CareerContext,
  config: ResumeConfig,
): string {
  const parts: string[] = [
    buildConfigSection(config),
    config.targetJob ? buildTargetJobSection(config.targetJob) : "",
    buildExperienceSection(context.experiences),
    context.projects.length > 0 ? buildProjectsSection(context.projects) : "",
    buildSkillsSection(context.skillGroups, config),
    context.stories.length > 0 ? buildStoriesSection(context.stories) : "",
    context.certifications.length > 0 ? buildCertificationsSection(context.certifications) : "",
    buildEducationSection(context.education),
    buildOutputSection(config, context),
  ];

  return parts.filter(Boolean).join("\n\n");
}

// ─── Section Builders ─────────────────────────────────────────────────────────

/**
 * One profile per resume type: the focus/vocabulary text feeds the prompt's
 * TYPE-SPECIFIC INSTRUCTIONS, and `prioritize` doubles as the keyword list
 * buildSkillsSection uses to reorder each category so the most relevant
 * items for this type of CV come first (see TYPE_PRIORITY_SKILLS below).
 */
const TYPE_PROFILES: Record<string, { focus: string; vocabulary: string; prioritize: string[] }> = {
  ARCHVIZ: {
    focus: "Photorealistic rendering, architectural software expertise, project scale, client presentation impact.",
    vocabulary: "ArchViz, visualization, rendering, photorealistic, immersive, spatial, walkthrough, fly-through.",
    prioritize: ["3ds Max", "Corona", "V-Ray", "Unreal Engine", "rendering", "visualization", "architecture"],
  },
  GAMEPLAY: {
    focus: "Real-time environments, game engines, performance optimization, interactive design.",
    vocabulary: "Real-time, frame budget, LOD, game-ready, optimization, playtest, iteration.",
    prioritize: ["Unreal Engine", "Unity", "gameplay", "level design", "real-time", "optimization"],
  },
  TECHNICAL_ARTIST: {
    focus: "Pipeline tools, shaders, optimization, the bridge between art and engineering.",
    vocabulary: "Shader, pipeline, LOD, rig, tool, automation, procedural, optimization.",
    prioritize: ["Python", "MEL", "shader", "pipeline", "tool", "automation", "rigging", "scripting"],
  },
  GRAPHIC_DESIGNER: {
    focus: "Visual identity, layout composition, typography, brand consistency across deliverables.",
    vocabulary: "Brand identity, layout, typography, composition, print-ready, art direction.",
    prioritize: ["Photoshop", "Illustrator", "InDesign", "Figma", "typography", "branding", "layout"],
  },
  BTL: {
    focus: "Brand activations, spatial design, production coordination, client presentations.",
    vocabulary: "Brand experience, activation, installation, spatial, production-ready, fabrication.",
    prioritize: ["activation", "production", "spatial design", "fabrication", "client presentation"],
  },
  ENVIRONMENT_ARTIST: {
    focus: "World-building, terrain/foliage systems, modular environment kits, visual storytelling through space.",
    vocabulary: "Modular kit, terrain, foliage, lighting mood, environment storytelling, set dressing.",
    prioritize: ["World Machine", "Substance", "Unreal Engine", "modular", "terrain", "environment", "lighting"],
  },
  VFX: {
    focus: "Particle/simulation systems, real-time or offline effects, performance budget for effects.",
    vocabulary: "Particle system, simulation, Niagara, compositing, effect budget, shader-driven FX.",
    prioritize: ["Niagara", "Houdini", "particle", "simulation", "compositing", "effects"],
  },
  MASTER: {
    focus: "Comprehensive overview. Include all relevant experience. Use versatile language that works across industries.",
    vocabulary: "",
    prioritize: [],
  },
};

function buildConfigSection(config: ResumeConfig): string {
  const profile = TYPE_PROFILES[config.type];

  const instructions = config.type === "CUSTOM"
    ? (config.targetRole
        ? `Maximize relevance for: "${config.targetRole}". Lead with the experience and skills most relevant to this specific role.`
        : `General resume. Cover all experience comprehensively.`)
    : profile
      ? [`Focus on: ${profile.focus}`, profile.vocabulary && `Vocabulary: ${profile.vocabulary}`, profile.prioritize.length && `Prioritize: ${profile.prioritize.join(", ")}.`]
          .filter(Boolean).join("\n")
      : TYPE_PROFILES.MASTER.focus;

  return `# RESUME CONFIGURATION
Name: ${config.userName}
Type: ${config.type}${config.targetRole ? `\nTarget Role: ${config.targetRole}` : ""}
Language: ${config.language === "es" ? "Spanish — write ALL content in Spanish" : "English"}

TYPE-SPECIFIC INSTRUCTIONS:
${instructions}`;
}

function buildTargetJobSection(job: TargetJobContext): string {
  const list = (items: string[]) => (items.length ? items.join(", ") : "(none listed)");

  return `# TARGET JOB POSTING
This resume targets a specific job. Tailor it to this posting — but the GROUNDING RULE still applies without exception: emphasize, reorder, and rephrase the candidate's REAL data to match the posting; NEVER add a skill, tool, or achievement the career data doesn't contain, even if the posting asks for it.

Role: ${job.role}${job.company ? `\nCompany: ${job.company}` : ""}
Required skills: ${list(job.requiredSkills)}
Nice-to-have skills: ${list(job.niceToHaveSkills)}
ATS keywords to weave in naturally (only where the candidate's data genuinely supports them): ${list(job.keywords)}
Key responsibilities of the role: ${list(job.responsibilities)}

Tailoring instructions:
- Lead the summary with the candidate's identity as it maps to "${job.role}".
- Order experience bullets so the ones matching the required skills and responsibilities come first.
- In the skills section, place the categories/items matching the required skills first.
- Prefer the posting's exact terminology when the candidate's data uses a synonym (e.g. their "UE5" can be written "Unreal Engine 5" if the posting says so — same fact, posting's vocabulary).${job.resumeTips.length ? `\n- Apply these analyst tips where the data supports them:\n${job.resumeTips.map((t) => `  - ${t}`).join("\n")}` : ""}`;
}

function buildExperienceSection(experiences: ExperienceData[]): string {
  if (!experiences.length) return "";

  // Limit to the 4 most recent by default — a longer resume reads as
  // unfocused, and the editor's "add experience" picker covers the rest.
  const toShow = experiences.slice(0, 4);

  const formatted = toShow.map((exp, i) => {
    const lines = [
      `[${i + 1}] ${exp.company} | ${exp.position}`,
      `Period: ${exp.startDate} – ${exp.endDate} (${exp.durationLabel})${exp.location ? ` | ${exp.location}` : ""}`,
    ];

    if (exp.responsibilities.length) {
      lines.push("\nRESPONSIBILITIES (raw — rewrite as strong resume bullets):");
      exp.responsibilities.forEach((r) => lines.push(`• ${r}`));
    }

    if (exp.achievements.length) {
      lines.push("\nACHIEVEMENTS (use for quantified bullets):");
      exp.achievements.forEach((a) => lines.push(`★ ${a}`));
    }

    if (exp.technologies.length) {
      lines.push(`\nTECHNOLOGIES USED: ${exp.technologies.join(", ")}`);
    }

    return lines.join("\n");
  });

  return `# WORK EXPERIENCE\n\n${formatted.join("\n\n---\n\n")}`;
}

function buildProjectsSection(projects: ProjectData[]): string {
  const highlighted = projects.filter((p) => p.isHighlighted).slice(0, 4);
  const rest = projects.filter((p) => !p.isHighlighted).slice(0, 2);
  const toShow = [...highlighted, ...rest];

  if (!toShow.length) return "";

  const formatted = toShow.map((p) => {
    const lines = [`${p.name}${p.myRole ? ` | ${p.myRole}` : ""}`, p.description];
    if (p.technologies.length) lines.push(`Technologies: ${p.technologies.slice(0, 6).join(", ")}`);
    if (p.results) lines.push(`Result: ${p.results}`);
    if (p.externalUrl) lines.push(`URL: ${p.externalUrl}`);
    return lines.join("\n");
  });

  return `# PROJECTS\n\n${formatted.join("\n\n")}`;
}

/**
 * Keywords used to sort each category's items so the ones most relevant to
 * this resume come first — a target job's own required/nice-to-have skills
 * win when one is set, otherwise the resume type's profile (TYPE_PROFILES).
 */
function priorityKeywords(config: ResumeConfig): string[] {
  if (config.targetJob) return [...config.targetJob.requiredSkills, ...config.targetJob.niceToHaveSkills];
  return TYPE_PROFILES[config.type]?.prioritize ?? [];
}

function buildSkillsSection(groups: SkillGroupData[], config: ResumeConfig): string {
  if (!groups.length) return "";

  const priority = priorityKeywords(config).map((k) => k.toLowerCase());
  // Items matching a priority keyword sort first within their bucket, so
  // the model tends to lead with (and keep) the skills most relevant to
  // this resume's type/target role/target job when it has to trim.
  const byPriority = (a: string, b: string) => {
    const aHit = priority.some((k) => a.toLowerCase().includes(k));
    const bHit = priority.some((k) => b.toLowerCase().includes(k));
    return aHit === bHit ? 0 : aHit ? -1 : 1;
  };

  const formatted = groups.map((group) => {
    const expert   = group.skills.filter((s) => s.level === "EXPERT").map((s) => s.name).sort(byPriority);
    const advanced = group.skills.filter((s) => s.level === "ADVANCED").map((s) => s.name).sort(byPriority);
    const inter    = group.skills.filter((s) => s.level === "INTERMEDIATE").map((s) => s.name).sort(byPriority);
    const beginner = group.skills.filter((s) => s.level === "BEGINNER").map((s) => s.name).sort(byPriority);
    // Soft skills (and anything else without a proficiency level) have no
    // level bucket to fall into — without this they were silently dropped
    // from the prompt entirely, which is why soft skills never reached the
    // model. List them plainly instead.
    const unleveled = group.skills.filter((s) => !s.level).map((s) => s.name).sort(byPriority);

    const parts: string[] = [];
    if (expert.length)    parts.push(`${expert.join(", ")} [Expert]`);
    if (advanced.length)  parts.push(`${advanced.join(", ")} [Advanced]`);
    if (inter.length)     parts.push(`${inter.join(", ")} [Intermediate]`);
    if (beginner.length)  parts.push(`${beginner.join(", ")} [Basic]`);
    if (unleveled.length) parts.push(unleveled.join(", "));

    return `${group.category}: ${parts.join(" | ")}`;
  });

  return `# SKILLS (with proficiency levels for context — do not include levels in output)\n\n${formatted.join("\n")}`;
}

function buildStoriesSection(stories: StoryData[]): string {
  if (!stories.length) return "";

  const toShow = stories.slice(0, 4);

  const formatted = toShow.map((s) => {
    const lines = [
      `[${s.category}] ${s.title}`,
      `S: ${s.situation}`,
      `T: ${s.task}`,
      `A: ${s.action}`,
      `R: ${s.result}`,
    ];
    if (s.impact) lines.push(`★ Impact: ${s.impact}`);
    return lines.join("\n");
  });

  return `# STAR STORIES
Use these to craft impactful, quantified bullet points. Extract specific actions and results — do not copy verbatim.

${formatted.join("\n\n---\n\n")}`;
}

function buildCertificationsSection(certifications: CertificationData[]): string {
  const formatted = certifications.map(
    (c) => `- ${c.name} — ${c.issuer}${c.year ? ` (${c.year})` : ""}`,
  );
  return `# CERTIFICATIONS
These are verified credentials the candidate holds. Where relevant, reflect them in the summary or the matching skill category items (append as education entries only if the resume type conventionally lists them there).

${formatted.join("\n")}`;
}

function buildEducationSection(education: EducationData[]): string {
  if (!education.length) return "";

  const formatted = education.map(
    (e) => `${e.institution}${e.year ? ` (${e.isOngoing ? `${e.year} – present` : e.year})` : ""}\n${e.degree}${e.field ? ` in ${e.field}` : ""}`,
  );

  return `# EDUCATION\n\n${formatted.join("\n\n")}`;
}

function buildOutputSection(config: ResumeConfig, context: CareerContext): string {
  const lang = config.language === "es" ? "Spanish" : "English";

  // Keyword-tailoring against a specific posting only happens when
  // targetJob is set (buildTargetJobSection). Every other resume gets this
  // weaker but still real ATS instruction: reuse the candidate's own real
  // skill names verbatim instead of paraphrasing them, so a generic ATS
  // keyword scan (with no posting to compare against) still finds them.
  const ownSkillNames = context.skillGroups.flatMap((g) => g.skills.map((s) => s.name)).slice(0, 25);
  const atsSelfConsistencyRule = !config.targetJob && ownSkillNames.length
    ? `\n7. ATS keyword consistency: no specific job posting is targeted, so instead reuse the candidate's own real skill/tool names verbatim (exact spelling/casing) across the summary and experience bullets — do not paraphrase or rename them — so a generic ATS keyword scan still matches. Candidate's real skills: ${ownSkillNames.join(", ")}.`
    : "";

  return `# OUTPUT RULES
1. Summary: 3-4 sentences. Start with professional identity. Include years of experience. Mention top specializations. Never start with "I".
2. Experience bullets: 3-5 per role. Action verb first. Quantify. Use STAR story data where it adds impact.
3. Skills: Group by category (Technical, Rendering, Real-Time, Design, etc.). items array = clean names only, no level labels. If soft skills are present in the data, ALWAYS include them as their own "Soft Skills" category — never merge them into Technical or omit them. Within each category, order items by relevance to the resume type / target role given above (most relevant first).
4. Projects: 2-4 most relevant. Description = 1-2 sentences. Impact-focused.
5. Language: ALL text in ${lang}.
6. GROUNDING: use only data explicitly provided above. If a field has no data, omit it or leave the array empty — never fabricate.${atsSelfConsistencyRule}

Return ONLY this JSON structure. No markdown. No explanation:

{
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "location": "City, Country",
      "startDate": "Mon YYYY",
      "endDate": "Mon YYYY or Present",
      "bullets": ["Action verb + specific + quantified result", "..."]
    }
  ],
  "skills": [
    { "category": "Category label", "items": ["Skill A", "Skill B"] }
  ],
  "education": [
    { "institution": "University name", "degree": "Full degree name", "year": "YYYY" }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "1-2 sentence impact-focused description",
      "technologies": ["Tech 1", "Tech 2"],
      "url": null
    }
  ]
}`;
}
