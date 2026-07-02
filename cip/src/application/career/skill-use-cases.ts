import { ISkillRepository } from "../../domain/career/repositories/ISkillRepository";
import { Skill, CreateSkillProps, UpdateSkillProps } from "../../domain/career/entities/Skill";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { SkillDTO, toSkillDTO } from "../../lib/types/skill";

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateSkillUseCase {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(props: CreateSkillProps): AsyncResult<SkillDTO> {
    // Check uniqueness before hitting the DB constraint.
    // Gives a clear error message rather than a Prisma P2002 leak.
    const exists = await this.repo.existsByName(props.userId, props.name);
    if (exists) {
      return Result.err(
        new Error(`You already have a skill named "${props.name}".`),
      );
    }

    const result = Skill.create(props);
    if (!result.ok) return Result.err(result.error);

    const saveResult = await this.repo.save(result.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toSkillDTO(result.value));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateSkillCommand extends UpdateSkillProps {
  id: string;
  userId: string;
}

export class UpdateSkillUseCase {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(command: UpdateSkillCommand): AsyncResult<SkillDTO> {
    const { id, userId, ...updates } = command;

    const skill = await this.repo.findById(id, userId);
    if (!skill) return Result.err(new Error("Skill not found."));

    // If name is changing, check uniqueness against other skills
    if (updates.name && updates.name.trim().toLowerCase() !== skill.name.toLowerCase()) {
      const exists = await this.repo.existsByName(userId, updates.name, id);
      if (exists) {
        return Result.err(
          new Error(`You already have a skill named "${updates.name}".`),
        );
      }
    }

    const updateResult = skill.update(updates);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.repo.update(skill);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toSkillDTO(skill));
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export class DeleteSkillUseCase {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(id: string, userId: string): AsyncResult<void> {
    const skill = await this.repo.findById(id, userId);
    if (!skill) return Result.err(new Error("Skill not found."));
    return this.repo.delete(id, userId);
  }
}

export class ClearAllSkillsUseCase {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(userId: string): AsyncResult<void> {
    return this.repo.deleteAllByUserId(userId);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export class GetSkillsQuery {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(userId: string): AsyncResult<SkillDTO[]> {
    const skills = await this.repo.findByUserId({ userId });
    return Result.ok(skills.map(toSkillDTO));
  }
}

export class GetSkillByIdUseCase {
  constructor(private readonly repo: ISkillRepository) {}

  async execute(id: string, userId: string): AsyncResult<SkillDTO> {
    const skill = await this.repo.findById(id, userId);
    if (!skill) return Result.err(new Error("Skill not found."));
    return Result.ok(toSkillDTO(skill));
  }
}
