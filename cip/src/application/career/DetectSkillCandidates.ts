import { ISkillRepository } from "../../domain/career/repositories/ISkillRepository";
import { IExperienceRepository } from "../../domain/career/repositories/IExperienceRepository";
import { IProjectRepository } from "../../domain/career/repositories/IProjectRepository";
import { IStoryRepository } from "../../domain/career/repositories/IStoryRepository";
import { Result, AsyncResult } from "../../domain/shared/Result";

export interface SkillCandidate {
  /** Display name, first-seen casing. */
  name: string;
  /** Where it was found, e.g. "Experience: Lead Artist at Studio X". Capped. */
  sources: string[];
  /** Existing Skill-table name this resembles (possible duplicate/variant). */
  similarTo?: string;
}

/**
 * DetectSkillCandidatesQuery
 *
 * The Skill table and the denormalized skill/technology arrays on
 * Experience/Project/Story are intentionally independent (see
 * ARCHITECTURE.md) — nothing syncs them. This query bridges the gap
 * read-only: it diffs the strings mentioned across Career records against
 * the canonical Skill table and returns the ones missing from it, flagging
 * near-matches ("React" vs "React.js") as possible variants. Nothing is
 * persisted; the user confirms each candidate in the review dialog.
 *
 * Deterministic (normalization + edit distance), no AI call — cheap enough
 * to run on demand every time the dialog opens.
 */
export class DetectSkillCandidatesQuery {
  constructor(
    private readonly skillRepo: ISkillRepository,
    private readonly experienceRepo: IExperienceRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly storyRepo: IStoryRepository,
  ) {}

  async execute(userId: string): AsyncResult<SkillCandidate[]> {
    const [skills, experiences, projects, stories] = await Promise.all([
      this.skillRepo.findByUserId({ userId }),
      this.experienceRepo.findByUserId({ userId }),
      this.projectRepo.findByUserId({ userId }),
      this.storyRepo.findByUserId({ userId }),
    ]);

    // (mention, source label) pairs from every denormalized array
    const mentions: { raw: string; source: string }[] = [];
    for (const e of experiences) {
      const source = `${e.position} @ ${e.company}`;
      for (const s of [...e.skills, ...e.technologies]) mentions.push({ raw: s, source });
    }
    for (const p of projects) {
      for (const s of p.technologies) mentions.push({ raw: s, source: p.name });
    }
    for (const s of stories) {
      for (const k of [...s.skills, ...s.keywords]) mentions.push({ raw: k, source: s.title });
    }

    const existing = skills.map((s) => ({ name: s.name, key: normalize(s.name) }));
    const existingKeys = new Set(existing.map((e) => e.key));

    // Group unseen mentions by normalized key
    const byKey = new Map<string, { name: string; sources: Set<string> }>();
    for (const { raw, source } of mentions) {
      const name = raw.trim();
      const key = normalize(name);
      if (!key || key.length < 2 || existingKeys.has(key)) continue;

      const entry = byKey.get(key);
      if (entry) entry.sources.add(source);
      else byKey.set(key, { name, sources: new Set([source]) });
    }

    const candidates: SkillCandidate[] = Array.from(byKey.entries())
      .map(([key, { name, sources }]) => ({
        name,
        sources: Array.from(sources).slice(0, 4),
        similarTo: findSimilar(key, existing),
      }))
      .sort((a, b) => b.sources.length - a.sources.length)
      .slice(0, 50);

    return Result.ok(candidates);
  }
}

/** Compare key: lowercase, no separators — "React.js" and "react js" → "reactjs". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

function findSimilar(key: string, existing: { name: string; key: string }[]): string | undefined {
  for (const skill of existing) {
    if (key.length >= 4 && skill.key.length >= 4 && (key.includes(skill.key) || skill.key.includes(key))) {
      return skill.name;
    }
    const threshold = Math.min(key.length, skill.key.length) >= 8 ? 2 : 1;
    if (Math.abs(key.length - skill.key.length) <= threshold && levenshtein(key, skill.key) <= threshold) {
      return skill.name;
    }
  }
  return undefined;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = temp;
    }
  }
  return prev[b.length];
}
