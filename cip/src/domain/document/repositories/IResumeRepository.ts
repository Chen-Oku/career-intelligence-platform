import { Resume } from "../entities/Resume";
import { Result } from "../../shared/Result";

export interface IResumeRepository {
  findById(id: string, userId: string): Promise<Resume | null>;
  findByUserId(userId: string): Promise<Resume[]>;
  save(resume: Resume): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
