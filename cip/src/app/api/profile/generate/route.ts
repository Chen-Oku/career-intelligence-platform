// src/app/api/profile/generate/route.ts — POST: generate a fresh About Me / Elevator Pitch draft
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContextTracked } from "@/infrastructure/ai/requestAiContext";
import { withProviderHeader } from "@/infrastructure/ai/aiResponseHeader";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { ProfilePitchService } from "@/infrastructure/ai/gemini/ProfilePitchService";
import { GenerateProfileTextUseCase } from "@/application/identity/commands/GenerateProfileText";
import { generateProfileTextSchema } from "@/lib/validators/profile.schema";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = generateProfileTextSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new GenerateProfileTextUseCase(
    new PrismaExperienceRepository(),
    new PrismaSkillRepository(),
    new PrismaStoryRepository(),
    new PrismaProjectRepository(),
    new ProfilePitchService(),
  );

  const { result, usedProvider } = await withUserAiContextTracked(session.user.id, () =>
    useCase.execute({ userId: session.user.id, ...parsed.data }),
  );
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return withProviderHeader(NextResponse.json({ data: result.value }), usedProvider);
}
