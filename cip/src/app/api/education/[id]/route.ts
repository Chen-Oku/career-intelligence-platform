// src/app/api/education/[id]/route.ts — PATCH (update) + DELETE
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaEducationRepository } from "@/infrastructure/database/repositories/PrismaEducationRepository";
import {
  UpdateEducationUseCase,
  DeleteEducationUseCase,
} from "@/application/career/education-use-cases";
import { updateEducationSchema } from "@/lib/validators/education.schema";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateEducationSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new UpdateEducationUseCase(new PrismaEducationRepository()).execute({
    ...parsed.data,
    userId: session.user.id,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  const result = await new DeleteEducationUseCase(new PrismaEducationRepository()).execute(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return new NextResponse(null, { status: 204 });
}
