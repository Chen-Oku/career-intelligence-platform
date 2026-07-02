/**
 * Project Use Cases — all in one file since the pattern is now established.
 * Each class is its own exported unit. Group them here to reduce file overhead.
 */

import { IProjectRepository } from "../../domain/career/repositories/IProjectRepository";
import { Project, CreateProjectProps, UpdateProjectProps } from "../../domain/career/entities/Project";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { ProjectDTO, toProjectDTO } from "../../lib/types/project";

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateProjectCommand = CreateProjectProps;

export class CreateProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(command: CreateProjectCommand): AsyncResult<ProjectDTO> {
    const result = Project.create(command);
    if (!result.ok) return Result.err(result.error);

    const saveResult = await this.repo.save(result.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toProjectDTO(result.value));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateProjectCommand extends UpdateProjectProps {
  id: string;
  userId: string;
}

export class UpdateProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(command: UpdateProjectCommand): AsyncResult<ProjectDTO> {
    const { id, userId, ...updates } = command;

    const project = await this.repo.findById(id, userId);
    if (!project) return Result.err(new Error("Project not found."));

    const updateResult = project.update(updates);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.repo.update(project);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toProjectDTO(project));
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export class DeleteProjectUseCase {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(id: string, userId: string): AsyncResult<void> {
    const project = await this.repo.findById(id, userId);
    if (!project) return Result.err(new Error("Project not found."));
    return this.repo.delete(id, userId);
  }
}

export class ClearAllProjectsUseCase {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(userId: string): AsyncResult<void> {
    return this.repo.deleteAllByUserId(userId);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export class GetProjectsQuery {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(userId: string): AsyncResult<ProjectDTO[]> {
    const projects = await this.repo.findByUserId({ userId });
    return Result.ok(projects.map(toProjectDTO));
  }
}

export class GetProjectByIdUseCase {
  constructor(private readonly repo: IProjectRepository) {}

  async execute(id: string, userId: string): AsyncResult<ProjectDTO> {
    const project = await this.repo.findById(id, userId);
    if (!project) return Result.err(new Error("Project not found."));
    return Result.ok(toProjectDTO(project));
  }
}
