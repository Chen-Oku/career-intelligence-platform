import { CVImportService } from "@/infrastructure/ai/gemini/CVImportService";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { RawImportResult } from "@/lib/types/cvImport";

export type ImportCareerDataResult = AsyncResult<RawImportResult>;

/**
 * ImportCareerDataUseCase
 *
 * Pure extraction — no persistence. The API route returns the result
 * directly to the client, which shows it in an editable review screen.
 * Nothing is saved until the user confirms each item individually
 * through the existing Experience/Project/Skill create endpoints.
 */
export class ImportCareerDataUseCase {
  constructor(private readonly aiService: CVImportService) {}

  async execute(rawText: string): ImportCareerDataResult {
    try {
      const result = await this.aiService.extract(rawText);
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Import extraction failed."));
    }
  }
}
