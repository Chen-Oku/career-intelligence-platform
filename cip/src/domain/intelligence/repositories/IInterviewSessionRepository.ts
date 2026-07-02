import { InterviewSession } from "../entities/InterviewSession";
import { Result } from "../../shared/Result";

export interface IInterviewSessionRepository {
  findById(id: string, userId: string): Promise<InterviewSession | null>;
  findByUserId(userId: string): Promise<InterviewSession[]>;
  findByJobDescriptionId(jobDescriptionId: string, userId: string): Promise<InterviewSession[]>;
  save(session: InterviewSession): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
}
