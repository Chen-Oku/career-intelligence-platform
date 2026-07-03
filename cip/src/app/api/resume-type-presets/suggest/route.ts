// src/app/api/resume-type-presets/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaResumeTypePresetRepository } from "@/infrastructure/database/repositories/PrismaResumeTypePresetRepository";
import { ResumeTypePresetSuggesterService } from "@/infrastructure/ai/gemini/ResumeTypePresetSuggesterService";
import { SuggestResumeTypePresetsUseCase } from "@/application/document/commands/SuggestResumeTypePresets";
import { suggestResumeTypePresetsSchema } from "@/lib/validators/resumeTypePreset.schema";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = suggestResumeTypePresetsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new SuggestResumeTypePresetsUseCase(
    new PrismaSkillRepository(),
    new PrismaExperienceRepository(),
    new PrismaStoryRepository(),
    new PrismaProjectRepository(),
    new PrismaResumeTypePresetRepository(),
    new ResumeTypePresetSuggesterService(),
  );

  const result = await withUserAiContext(session.user.id, () =>
    useCase.execute({ userId: session.user.id, language: parsed.data.language }),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 422 });
  }

  return NextResponse.json({ data: result.value });
}
