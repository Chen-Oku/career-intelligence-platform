import { CoverLetter } from "../entities/CoverLetter";
import { Result } from "../../shared/Result";

export interface ICoverLetterRepository {
  findById(id: string, userId: string): Promise<CoverLetter | null>;
  findByUserId(userId: string): Promise<CoverLetter[]>;
  save(coverLetter: CoverLetter): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
