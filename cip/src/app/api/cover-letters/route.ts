// src/app/api/cover-letters/route.ts — GET (list all cover letters for user), DELETE (clear all)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaCoverLetterRepository } from "@/infrastructure/database/repositories/PrismaCoverLetterRepository";
import { toCoverLetterDTO } from "@/lib/types/coverLetter";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const repo = new PrismaCoverLetterRepository();
  const coverLetters = await repo.findByUserId(session.user.id);
  return NextResponse.json({ data: coverLetters.map(toCoverLetterDTO) });
}

/** DELETE /api/cover-letters — deletes every cover letter owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const repo = new PrismaCoverLetterRepository();
  const result = await repo.deleteAllByUserId(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
