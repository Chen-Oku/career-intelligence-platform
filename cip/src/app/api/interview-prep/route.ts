// src/app/api/interview-prep/route.ts — GET: fetch all saved interview-prep answers for the user
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import { FROM_PRISMA_TYPE_MAP } from "@/lib/types/interviewPrep";
import type { InterviewPrepAnswerDTO } from "@/lib/types/interviewPrep";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const answers = await prisma.interviewPrepAnswer.findMany({ where: { userId: session.user.id } });

  const data: InterviewPrepAnswerDTO[] = answers.map((a) => ({
    type: FROM_PRISMA_TYPE_MAP[a.type],
    content: a.content,
    language: a.language,
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json({ data });
}
