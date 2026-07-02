// src/app/api/job-analyzer/route.ts — POST (analyze) + GET (list)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { JobAnalyzerService } from "@/infrastructure/ai/gemini/JobAnalyzerService";
import { AnalyzeJobDescriptionUseCase } from "@/application/intelligence/commands/AnalyzeJobDescription";
import { analyzeJobSchema } from "@/lib/validators/job.schema";
import { prisma } from "@/infrastructure/database/client";

export const maxDuration = 60;

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const records = await prisma.jobDescription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, company: true, title: true, matchScore: true, missingSkills: true, language: true, createdAt: true },
  });

  return NextResponse.json({ data: records.map(r => ({
    id: r.id, company: r.company, title: r.title,
    matchScore: r.matchScore, missingSkills: r.missingSkills,
    language: r.language, createdAt: r.createdAt.toISOString(),
  })) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = analyzeJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new AnalyzeJobDescriptionUseCase(
    new PrismaExperienceRepository(),
    new PrismaSkillRepository(),
    new PrismaStoryRepository(),
    new PrismaProjectRepository(),
    new JobAnalyzerService(),
  );

  const result = await withUserAiContext(session.user.id, () =>
    useCase.execute({ userId: session.user.id, ...parsed.data }),
  );
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}

/** DELETE /api/job-analyzer — deletes every job analysis owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  await prisma.jobDescription.deleteMany({ where: { userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
