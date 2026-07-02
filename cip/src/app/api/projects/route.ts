// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import {
  CreateProjectUseCase,
  GetProjectsQuery,
  ClearAllProjectsUseCase,
} from "@/application/career/project-use-cases";
import { createProjectSchema } from "@/lib/validators/project.schema";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const repo = new PrismaProjectRepository();
  const result = await new GetProjectsQuery(repo).execute(session.user.id);

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

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const repo = new PrismaProjectRepository();
  const result = await new CreateProjectUseCase(repo).execute({
    userId: session.user.id,
    ...parsed.data,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}

/** DELETE /api/projects — deletes every project owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new ClearAllProjectsUseCase(new PrismaProjectRepository()).execute(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
