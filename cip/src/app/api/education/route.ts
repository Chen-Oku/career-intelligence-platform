// src/app/api/education/route.ts — GET (list) + POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaEducationRepository } from "@/infrastructure/database/repositories/PrismaEducationRepository";
import {
  CreateEducationUseCase,
  GetEducationQuery,
  ClearAllEducationUseCase,
} from "@/application/career/education-use-cases";
import { createEducationSchema } from "@/lib/validators/education.schema";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new GetEducationQuery(new PrismaEducationRepository()).execute(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ data: result.value });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = createEducationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new CreateEducationUseCase(new PrismaEducationRepository()).execute({
    userId: session.user.id,
    ...parsed.data,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}

/** DELETE /api/education — deletes every education entry owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new ClearAllEducationUseCase(new PrismaEducationRepository()).execute(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
