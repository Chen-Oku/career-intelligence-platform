import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { toResumeDTO } from "@/lib/types/resume";
import { UpdateResumeUseCase } from "@/application/document/commands/UpdateResume";
import { updateResumeContentSchema } from "@/lib/validators/resume.schema";

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

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateResumeContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const useCase = new UpdateResumeUseCase(new PrismaResumeRepository());
  const result = await useCase.execute({
    id,
    userId: session.user.id,
    content: parsed.data.content,
    contact: parsed.data.contact,
    targetRole: parsed.data.targetRole,
  });

  if (!result.ok) {
    const status = result.error.message === "Resume not found." ? 404 : 422;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json({ data: result.value });
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
