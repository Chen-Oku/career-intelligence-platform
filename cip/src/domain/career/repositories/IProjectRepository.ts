import { Project } from "../entities/Project";
import { Result } from "../../shared/Result";

export interface FindProjectsOptions {
  userId: string;
  highlightedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface IProjectRepository {
  findById(id: string, userId: string): Promise<Project | null>;
  findByUserId(options: FindProjectsOptions): Promise<Project[]>;
  countByUserId(userId: string): Promise<number>;
  save(project: Project): Promise<Result<void>>;
  update(project: Project): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
