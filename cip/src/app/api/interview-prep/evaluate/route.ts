// src/app/api/interview-prep/evaluate/route.ts — POST: AI coaching feedback on a hand-written draft
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { InterviewCoachService } from "@/infrastructure/ai/gemini/InterviewCoachService";
import { EvaluateInterviewPrepAnswerUseCase } from "@/application/intelligence/commands/EvaluateInterviewPrepAnswer";
import { evaluateInterviewPrepSchema } from "@/lib/validators/interviewPrep.schema";

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

  const parsed = evaluateInterviewPrepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new EvaluateInterviewPrepAnswerUseCase(
    new PrismaExperienceRepository(),
    new PrismaSkillRepository(),
    new PrismaStoryRepository(),
    new PrismaProjectRepository(),
    new InterviewCoachService(),
  );

  const result = await useCase.execute({ userId: session.user.id, type: parsed.data.type, draftText: parsed.data.draftText });
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value });
}
