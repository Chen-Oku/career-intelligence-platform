// src/app/api/interview-sessions/[sessionId]/route.ts — GET: a single saved session, for the read-only recap view
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaInterviewSessionRepository } from "@/infrastructure/database/repositories/PrismaInterviewSessionRepository";
import { toInterviewSessionDTO } from "@/lib/types/interviewSession";

type P = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { sessionId } = await params;
  const repo = new PrismaInterviewSessionRepository();
  const interviewSession = await repo.findById(sessionId, session.user.id);
  if (!interviewSession) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ data: toInterviewSessionDTO(interviewSession) });
}
