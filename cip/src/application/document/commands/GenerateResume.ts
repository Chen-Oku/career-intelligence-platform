import { IExperienceRepository } from "../../../domain/career/repositories/IExperienceRepository";
import { IProjectRepository } from "../../../domain/career/repositories/IProjectRepository";
import { ISkillRepository } from "../../../domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "../../../domain/career/repositories/IStoryRepository";
import { ICertificationRepository } from "../../../domain/career/repositories/ICertificationRepository";
import { IEducationRepository } from "../../../domain/career/repositories/IEducationRepository";
import { IResumeRepository } from "../../../domain/document/repositories/IResumeRepository";
import { IResumeTypePresetRepository } from "../../../domain/document/repositories/IResumeTypePresetRepository";
import { Resume } from "../../../domain/document/entities/Resume";
import { ResumeGeneratorService } from "../../../infrastructure/ai/gemini/ResumeGeneratorService";
import { computeAtsScore } from "../../../infrastructure/document/AtsScorer";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import { ResumeDTO, toResumeDTO, ResumeContact } from "../../../lib/types/resume";
import { prisma } from "../../../infrastructure/database/client";
import type { TargetJobContext, ResumeConfig } from "../../../infrastructure/ai/prompts/resume.prompts";
import type { JobAnalysisData } from "../../../lib/types/job";

// MASTER/CUSTOM are universal built-ins, never ResumeTypePreset rows — kept
// local (not lib/validators/resume.schema.ts's RESUME_TYPE_LABELS, which is
// legacy-display-only now) since this is the source of truth for newly
// generated resumes' typeLabel.
const BUILT_IN_TYPE_LABELS: Record<"MASTER" | "CUSTOM", string> = {
  MASTER: "Master Resume",
  CUSTOM: "Custom (specify target role)",
};

export interface GenerateResumeCommand {
  userId: string;
  userName: string;
  type: string;
  title: string;
  targetRole?: string;
  language: string;
  contact: ResumeContact;
  /** Optional: tailor the resume to a previously analyzed job posting. */
  jobDescriptionId?: string;
}

export type GenerateResumeResult = AsyncResult<ResumeDTO>;

/**
 * GenerateResumeUseCase — the most important use case in the platform.
 *
 * This is where "Knowledge First, Resume Second" becomes real.
 * It pulls all career data across four domains and feeds it to Gemini.
 *
 * The use case owns the orchestration. Each repository and service
 * has one responsibility. No HTTP, no database details here.
 *
 * This use case is intentionally slow (~15-30s). The caller must
 * communicate this to the user with appropriate loading UI.
 */
export class GenerateResumeUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly certificationRepo: ICertificationRepository,
    private readonly educationRepo: IEducationRepository,
    private readonly resumeRepo: IResumeRepository,
    private readonly aiService: ResumeGeneratorService,
    private readonly presetRepo: IResumeTypePresetRepository,
  ) {}

  /** Resolves a display label and (for user presets) prompt-tuning data for `type`. */
  private async resolveResumeType(
    type: string,
    userId: string,
  ): AsyncResult<{ typeLabel: string; typeProfile?: ResumeConfig["typeProfile"] }> {
    if (type === "MASTER" || type === "CUSTOM") {
      return Result.ok({ typeLabel: BUILT_IN_TYPE_LABELS[type] });
    }

    const preset = await this.presetRepo.findById(type, userId);
    if (!preset) return Result.err(new Error("Resume type preset not found."));

    return Result.ok({
      typeLabel: preset.name,
      typeProfile: {
        name: preset.name,
        focus: preset.focus,
        vocabulary: preset.vocabulary,
        prioritize: [...preset.prioritizeKeywords],
      },
    });
  }

  async execute(command: GenerateResumeCommand): GenerateResumeResult {
    // 1. Fetch all career data in parallel — this is the "knowledge retrieval" step
    const [experiences, projects, skills, stories, certifications, education] = await Promise.all([
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.certificationRepo.findByUserId({ userId: command.userId }),
      this.educationRepo.findByUserId({ userId: command.userId }),
    ]);

    if (experiences.length === 0) {
      return Result.err(
        new Error(
          "Add at least one work experience before generating a resume.",
        ),
      );
    }

    // 1b. If targeting an analyzed job, load its extraction to tailor the
    // resume. Direct Prisma read, same rationale as AnalyzeJobDescription:
    // JobDescription has no repository — it's a simple Intelligence-context
    // record and this is a read-only, userId-scoped lookup.
    let targetJob: TargetJobContext | undefined;
    if (command.jobDescriptionId) {
      const job = await prisma.jobDescription.findFirst({
        where: { id: command.jobDescriptionId, userId: command.userId },
        select: { title: true, company: true, analyzedData: true },
      });
      if (!job) return Result.err(new Error("Job analysis not found."));

      const data = job.analyzedData as unknown as JobAnalysisData;
      targetJob = {
        role: data.extractedRole || job.title,
        company: data.extractedCompany || job.company || undefined,
        requiredSkills: data.requiredSkills ?? [],
        niceToHaveSkills: data.niceToHaveSkills ?? [],
        keywords: data.keywords ?? [],
        responsibilities: data.responsibilities ?? [],
        resumeTips: data.resumeTips ?? [],
      };
    }

    // 1c. Resolve the resume type into a display label + (for user presets)
    // prompt-tuning data — the prompt must never see a raw preset id.
    const typeResult = await this.resolveResumeType(command.type, command.userId);
    if (!typeResult.ok) return Result.err(typeResult.error);
    const { typeLabel, typeProfile } = typeResult.value;

    // 2. Generate resume content via Gemini
    let content: Awaited<ReturnType<ResumeGeneratorService["generate"]>>;
    try {
      content = await this.aiService.generate(
        experiences,
        projects,
        skills,
        stories,
        certifications,
        education,
        {
          type: command.type,
          typeLabel,
          typeProfile,
          title: command.title,
          // A job-targeted resume without an explicit target role inherits
          // the role extracted from the posting.
          targetRole: command.targetRole || targetJob?.role,
          language: command.language,
          contact: command.contact,
          userName: command.userName,
          targetJob,
        },
      );
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("AI generation failed."),
      );
    }

    // 3. Score ATS-friendliness deterministically (no extra AI call — see
    // AtsScorer.ts) and fold the tips into the content blob alongside contact.
    const { score: atsScore, tips: atsTips } = computeAtsScore(content, targetJob);
    const fullContent = { ...content, contact: command.contact, atsTips };

    const resumeResult = Resume.create({
      userId: command.userId,
      type: command.type,
      typeLabel,
      title: command.title,
      content: fullContent,
      contact: command.contact,
      targetRole: command.targetRole || targetJob?.role,
      language: command.language,
      atsScore,
    });

    if (!resumeResult.ok) return Result.err(resumeResult.error);

    // 4. Persist
    const saveResult = await this.resumeRepo.save(resumeResult.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toResumeDTO(resumeResult.value));
  }
}
