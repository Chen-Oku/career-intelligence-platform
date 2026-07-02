import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import {
  GetProjectByIdUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
} from "@/application/career/project-use-cases";
import { updateProjectSchema } from "@/lib/validators/project.schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const repo = new PrismaProjectRepository();
  const result = await new GetProjectByIdUseCase(repo).execute(id, session.user.id);

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 404 });
  return NextResponse.json({ data: result.value });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { id: paramId } = await params;
  const parsed = updateProjectSchema.safeParse({ ...(body as Record<string, unknown>), id: paramId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const repo = new PrismaProjectRepository();
  const result = await new UpdateProjectUseCase(repo).execute({
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
  const repo = new PrismaProjectRepository();
  const result = await new DeleteProjectUseCase(repo).execute(id, session.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, {
      status: result.error.message.includes("not found") ? 404 : 500,
    });
  }
  return new NextResponse(null, { status: 204 });
}
