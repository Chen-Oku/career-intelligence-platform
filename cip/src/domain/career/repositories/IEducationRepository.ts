import { Education } from "../entities/Education";
import { Result } from "../../shared/Result";

export interface FindEducationOptions {
  userId: string;
}

export interface IEducationRepository {
  findById(id: string, userId: string): Promise<Education | null>;
  findByUserId(options: FindEducationOptions): Promise<Education[]>;
  save(education: Education): Promise<Result<void>>;
  update(education: Education): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
