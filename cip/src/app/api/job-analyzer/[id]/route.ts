import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import type { JobAnalysisData } from "@/lib/types/job";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const record = await prisma.jobDescription.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    data: {
      id: record.id,
      company: record.company,
      title: record.title,
      rawText: record.rawText,
      analyzedData: record.analyzedData as unknown as JobAnalysisData,
      matchScore: record.matchScore,
      missingSkills: record.missingSkills,
      language: record.language,
      createdAt: record.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  await prisma.jobDescription.deleteMany({ where: { id, userId: session.user.id } });
  return new NextResponse(null, { status: 204 });
}
