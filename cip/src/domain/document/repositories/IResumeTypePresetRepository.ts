import { ResumeTypePreset } from "../entities/ResumeTypePreset";
import { Result } from "../../shared/Result";

export interface IResumeTypePresetRepository {
  findById(id: string, userId: string): Promise<ResumeTypePreset | null>;
  findByUserId(userId: string): Promise<ResumeTypePreset[]>;
  save(preset: ResumeTypePreset): Promise<Result<void>>;
  update(preset: ResumeTypePreset): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
}
