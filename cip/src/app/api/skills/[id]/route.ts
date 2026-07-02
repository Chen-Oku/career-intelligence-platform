import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { UpdateSkillUseCase, DeleteSkillUseCase } from "@/application/career/skill-use-cases";
import { updateSkillSchema } from "@/lib/validators/skill.schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { id: paramId } = await params;
  const parsed = updateSkillSchema.safeParse({ ...(body as Record<string, unknown>), id: paramId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const result = await new UpdateSkillUseCase(new PrismaSkillRepository()).execute({
    id,
    userId: session.user.id,
    ...updates,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, {
      status: result.error.message.includes("not found") ? 404 : 422,
    });
  }
  return NextResponse.json({ data: result.value });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const result = await new DeleteSkillUseCase(new PrismaSkillRepository()).execute(
    id,
    session.user.id,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, {
      status: result.error.message.includes("not found") ? 404 : 500,
    });
  }
  return new NextResponse(null, { status: 204 });
}
