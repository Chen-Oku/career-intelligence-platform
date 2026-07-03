import { IResumeRepository } from "../../../domain/document/repositories/IResumeRepository";
import { computeAtsScore } from "../../../infrastructure/document/AtsScorer";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import { ResumeDTO, toResumeDTO, ResumeContent, ResumeContact } from "../../../lib/types/resume";

export interface UpdateResumeCommand {
  id: string;
  userId: string;
  content: ResumeContent;
  contact: ResumeContact;
  targetRole?: string;
}

export type UpdateResumeResult = AsyncResult<ResumeDTO>;

/**
 * UpdateResumeUseCase — applies a hand edit made in the resume editor.
 *
 * No AI call: the edited content comes straight from the client. The ATS
 * score is recomputed deterministically (computeAtsScore, same as
 * generation) since editing bullets/skills changes what it measures.
 */
export class UpdateResumeUseCase {
  constructor(private readonly resumeRepo: IResumeRepository) {}

  async execute(command: UpdateResumeCommand): UpdateResumeResult {
    const resume = await this.resumeRepo.findById(command.id, command.userId);
    if (!resume) return Result.err(new Error("Resume not found."));

    const { score: atsScore, tips: atsTips } = computeAtsScore(command.content);
    const fullContent = { ...command.content, atsTips };

    const updateResult = resume.updateContent(fullContent, command.contact, command.targetRole, atsScore);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.resumeRepo.update(resume);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toResumeDTO(resume));
  }
}
