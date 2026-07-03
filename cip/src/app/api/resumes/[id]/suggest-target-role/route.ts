// src/app/api/resumes/[id]/suggest-target-role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { TargetRoleSuggesterService } from "@/infrastructure/ai/gemini/TargetRoleSuggesterService";
import { SuggestTargetRoleUseCase } from "@/application/document/commands/SuggestTargetRole";

type P = { params: Promise<{ id: string }> };

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const useCase = new SuggestTargetRoleUseCase(new PrismaResumeRepository(), new TargetRoleSuggesterService());

  const result = await withUserAiContext(session.user.id, () =>
    useCase.execute({ id, userId: session.user.id }),
  );

  if (!result.ok) {
    const status = result.error.message === "Resume not found." ? 404 : 422;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json({ data: result.value });
}
