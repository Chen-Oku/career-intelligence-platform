// src/app/api/resumes/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { PrismaCertificationRepository } from "@/infrastructure/database/repositories/PrismaCertificationRepository";
import { PrismaEducationRepository } from "@/infrastructure/database/repositories/PrismaEducationRepository";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { ResumeGeneratorService } from "@/infrastructure/ai/gemini/ResumeGeneratorService";
import { GenerateResumeUseCase } from "@/application/document/commands/GenerateResume";
import { generateResumeSchema } from "@/lib/validators/resume.schema";
import type { ResumeType } from "@/domain/document/entities/Resume";

/**
 * POST /api/resumes/generate
 *
 * This route can take 15-30 seconds — Gemini reads the full career context.
 * maxDuration = 60 tells Vercel to allow up to 60s for this serverless function.
 * On other platforms, ensure your timeout is set appropriately.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = generateResumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const useCase = new GenerateResumeUseCase(
    new PrismaExperienceRepository(),
    new PrismaProjectRepository(),
    new PrismaSkillRepository(),
    new PrismaStoryRepository(),
    new PrismaCertificationRepository(),
    new PrismaEducationRepository(),
    new PrismaResumeRepository(),
    new ResumeGeneratorService(),
  );

  const result = await withUserAiContext(session.user.id, () =>
    useCase.execute({
      userId: session.user.id,
      userName: session.user.name ?? "Professional",
      type: parsed.data.type as ResumeType,
      title: parsed.data.title,
      targetRole: parsed.data.targetRole,
      language: parsed.data.language,
      jobDescriptionId: parsed.data.jobDescriptionId,
      contact: {
        email: session.user.email ?? parsed.data.contact.email,
        phone: parsed.data.contact.phone,
        linkedin: parsed.data.contact.linkedin,
        portfolio: parsed.data.contact.portfolio,
        location: parsed.data.contact.location,
      },
    }),
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 422 });
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}
