// src/app/api/resumes/route.ts — GET (list all resumes for user)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { toResumeDTO } from "@/lib/types/resume";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const repo = new PrismaResumeRepository();
  const resumes = await repo.findByUserId(session.user.id);
  return NextResponse.json({ data: resumes.map(toResumeDTO) });
}

/** DELETE /api/resumes — deletes every resume owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const repo = new PrismaResumeRepository();
  const result = await repo.deleteAllByUserId(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
