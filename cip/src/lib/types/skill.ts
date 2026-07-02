import { Skill, SkillCategory, SkillLevel, LEVEL_ORDER } from "@/domain/career/entities/Skill";

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface SkillDTO {
  id: string;
  name: string;
  category: SkillCategory;
  /** Undefined for SOFT skills — proficiency level doesn't apply to those. */
  level?: SkillLevel;
  yearsOfExp?: number;
  lastUsed?: string;
  isPublic: boolean;
  tags: string[];
}

export function toSkillDTO(skill: Skill): SkillDTO {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    level: skill.level,
    yearsOfExp: skill.yearsOfExp,
    lastUsed: skill.lastUsed?.toISOString(),
    isPublic: skill.isPublic,
    tags: [...skill.tags],
  };
}

export function skillDTOToFormValues(dto: SkillDTO) {
  return {
    name: dto.name,
    category: dto.category,
    level: dto.level,
    yearsOfExp: dto.yearsOfExp,
    lastUsed: dto.lastUsed ? new Date(dto.lastUsed) : undefined,
    isPublic: dto.isPublic,
    tags: [...dto.tags],
  };
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  TECHNICAL: "Technical",
  SOFT: "Soft Skills",
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  METHODOLOGY: "Methodologies",
  LEADERSHIP: "Leadership",
  AI: "AI & Tools",
  DESIGN: "Design",
  PROGRAMMING: "Programming",
  OTHER: "Other",
};

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
};

/**
 * Visual level colors — Tailwind classes.
 * Goes from muted (beginner) to primary (expert).
 */
export const LEVEL_COLORS: Record<SkillLevel, { bg: string; text: string; dot: string }> = {
  BEGINNER:     { bg: "bg-muted",       text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  INTERMEDIATE: { bg: "bg-blue-50",     text: "text-blue-700",         dot: "bg-blue-400" },
  ADVANCED:     { bg: "bg-primary/10",  text: "text-primary",          dot: "bg-primary" },
  EXPERT:       { bg: "bg-emerald-50",  text: "text-emerald-700",      dot: "bg-emerald-500" },
};

/**
 * Groups a flat list of skills by category.
 * Categories are sorted by number of skills (descending).
 */
export function groupSkillsByCategory(
  skills: SkillDTO[],
): Array<{ category: SkillCategory; label: string; skills: SkillDTO[] }> {
  const map = new Map<SkillCategory, SkillDTO[]>();

  for (const skill of skills) {
    if (!map.has(skill.category)) map.set(skill.category, []);
    map.get(skill.category)!.push(skill);
  }

  // Sort skills within each category by level desc, then name asc.
  // Skills without a level (SOFT) sort after leveled ones.
  for (const [, categorySkills] of map) {
    categorySkills.sort((a, b) => {
      const levelDiff = (b.level ? LEVEL_ORDER[b.level] : -1) - (a.level ? LEVEL_ORDER[a.level] : -1);
      return levelDiff !== 0 ? levelDiff : a.name.localeCompare(b.name);
    });
  }

  return Array.from(map.entries())
    .map(([category, skills]) => ({
      category,
      label: CATEGORY_LABELS[category],
      skills,
    }))
    .sort((a, b) => b.skills.length - a.skills.length);
}

// ─── Add-skill helpers ──────────────────────────────────────────────────────

/**
 * Keyword → category lookup, used to pre-select a category when the user
 * types a skill name. Order matters: first matching category wins, so more
 * specific categories (e.g. AI before TECHNICAL) are listed first.
 */
const CATEGORY_KEYWORDS: Array<{ category: SkillCategory; keywords: string[] }> = [
  {
    category: "PROGRAMMING",
    keywords: ["javascript", "typescript", "python", "java", "c++", "c#", "golang", "rust", "php", "ruby", "swift", "kotlin", "sql", "html", "css", "scala", "dart", "bash"],
  },
  {
    category: "FRAMEWORK",
    keywords: ["react", "vue", "angular", "next.js", "nextjs", "django", "flask", "spring", "express", "laravel", "rails", "svelte", "unity", "unreal", "node.js", "nodejs", "tailwind", "bootstrap", ".net"],
  },
  {
    category: "AI",
    keywords: ["machine learning", "deep learning", "tensorflow", "pytorch", "llm", "gpt", "claude", "openai", "nlp", "computer vision", "generative ai", "langchain", "artificial intelligence"],
  },
  {
    category: "DESIGN",
    keywords: ["figma", "photoshop", "illustrator", "ui design", "ux design", "sketch", "indesign", "3d modeling", "blender", "3ds max", "autocad", "revit", "corona renderer", "v-ray", "vray", "architectural visualization", "premiere", "after effects", "rendering"],
  },
  {
    category: "LANGUAGE",
    keywords: ["english", "spanish", "french", "german", "portuguese", "italian", "mandarin", "chinese", "japanese", "korean", "arabic", "russian"],
  },
  {
    category: "METHODOLOGY",
    keywords: ["agile", "scrum", "kanban", "lean", "devops", "ci/cd", "tdd", "waterfall", "six sigma"],
  },
  {
    category: "LEADERSHIP",
    keywords: ["leadership", "mentoring", "management", "team lead"],
  },
  {
    category: "SOFT",
    keywords: ["communication", "teamwork", "problem solving", "adaptability", "time management", "critical thinking", "creativity", "collaboration", "empathy"],
  },
];

/** Suggests a category based on keywords found in the skill name. Returns undefined if nothing matches. */
export function suggestSkillCategory(name: string): SkillCategory | undefined {
  const normalized = name.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return category;
  }
  return undefined;
}

/** Strips everything but letters/digits, lowercased — for loose name comparison. */
function normalizeForCompare(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds an existing skill name that looks like a variant of `name`
 * (e.g. "Unreal Engine 5" vs. an existing "Unreal Engine"), so the UI can
 * warn before adding what's likely a near-duplicate.
 */
export function findSimilarSkillName(name: string, existingNames: string[]): string | undefined {
  const normalized = normalizeForCompare(name);
  if (!normalized) return undefined;

  return existingNames.find((existing) => {
    const other = normalizeForCompare(existing);
    return other.length > 0 && (other.includes(normalized) || normalized.includes(other));
  });
}

/**
 * Splits grouped categories into technical/other vs. soft skills, so the UI
 * can render them as two separate sections — soft skills aren't rated by level.
 */
export function splitSoftSkillGroups(
  grouped: Array<{ category: SkillCategory; label: string; skills: SkillDTO[] }>,
): {
  technicalGroups: Array<{ category: SkillCategory; label: string; skills: SkillDTO[] }>;
  softGroup: { category: SkillCategory; label: string; skills: SkillDTO[] } | undefined;
} {
  return {
    technicalGroups: grouped.filter((g) => g.category !== "SOFT"),
    softGroup: grouped.find((g) => g.category === "SOFT"),
  };
}
