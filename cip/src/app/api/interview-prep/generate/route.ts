// src/app/api/interview-prep/generate/route.ts — POST: generate a fresh interview-prep answer draft
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { InterviewPrepService } from "@/infrastructure/ai/gemini/InterviewPrepService";
import { GenerateInterviewPrepAnswerUseCase } from "@/application/intelligence/commands/GenerateInterviewPrepAnswer";
import { generateInterviewPrepSchema } from "@/lib/validators/interviewPrep.schema";

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

  const parsed = generateInterviewPrepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new GenerateInterviewPrepAnswerUseCase(
    new PrismaExperienceRepository(),
    new PrismaSkillRepository(),
    new PrismaStoryRepository(),
    new PrismaProjectRepository(),
    new InterviewPrepService(),
  );

  const result = await withUserAiContext(session.user.id, () =>
    useCase.execute({ userId: session.user.id, ...parsed.data }),
  );
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: { type: parsed.data.type, text: result.value } });
}
