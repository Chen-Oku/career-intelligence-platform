import { Skill, SkillCategory } from "../entities/Skill";
import { Result } from "../../shared/Result";

export interface FindSkillsOptions {
  userId: string;
  category?: SkillCategory;
}

export interface ISkillRepository {
  findById(id: string, userId: string): Promise<Skill | null>;
  findByUserId(options: FindSkillsOptions): Promise<Skill[]>;
  existsByName(userId: string, name: string, excludeId?: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
  save(skill: Skill): Promise<Result<void>>;
  update(skill: Skill): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
