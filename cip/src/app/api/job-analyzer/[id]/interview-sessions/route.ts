// src/app/api/job-analyzer/[id]/interview-sessions/route.ts — GET: list / POST: create a mock-interview session for this job
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaInterviewSessionRepository } from "@/infrastructure/database/repositories/PrismaInterviewSessionRepository";
import { CreateInterviewSessionUseCase } from "@/application/intelligence/commands/CreateInterviewSession";
import { ListInterviewSessionsUseCase } from "@/application/intelligence/commands/ListInterviewSessions";
import { createInterviewSessionSchema } from "@/lib/validators/interviewSession.schema";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const useCase = new ListInterviewSessionsUseCase(new PrismaInterviewSessionRepository());
  const result = await useCase.execute({ userId: session.user.id, jobDescriptionId: id });
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ data: result.value });
}

export async function POST(req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createInterviewSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const useCase = new CreateInterviewSessionUseCase(new PrismaInterviewSessionRepository());
  const result = await useCase.execute({ userId: session.user.id, jobDescriptionId: id, ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
