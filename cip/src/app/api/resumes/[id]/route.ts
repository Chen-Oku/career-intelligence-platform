import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { toResumeDTO } from "@/lib/types/resume";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const repo = new PrismaResumeRepository();
  const resume = await repo.findById(id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ data: toResumeDTO(resume) });
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const repo = new PrismaResumeRepository();
  const result = await repo.delete(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
