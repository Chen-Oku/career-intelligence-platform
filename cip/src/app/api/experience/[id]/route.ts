import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { GetExperienceByIdUseCase } from "@/application/career/queries/GetExperienceById";
import { UpdateExperienceUseCase } from "@/application/career/commands/UpdateExperience";
import { DeleteExperienceUseCase } from "@/application/career/commands/DeleteExperience";
import { updateExperienceSchema } from "@/lib/validators/experience.schema";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/experience/[id]
 * Returns a single experience by id.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const repository = new PrismaExperienceRepository();
  const useCase = new GetExperienceByIdUseCase(repository);
  const result = await useCase.execute({ id, userId: session.user.id });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 404 });
  }

  return NextResponse.json({ data: result.value });
}

/**
 * PATCH /api/experience/[id]
 * Partially updates an experience.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id: paramId } = await params;

  // updateExperienceSchema has all fields optional + id required
  const parsed = updateExperienceSchema.safeParse({ ...(body as Record<string, unknown>), id: paramId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, ...updates } = parsed.data;

  const repository = new PrismaExperienceRepository();
  const useCase = new UpdateExperienceUseCase(repository);

  const result = await useCase.execute({
    id,
    userId: session.user.id,
    ...updates,
  });

  if (!result.ok) {
    const status = result.error.message.includes("not found") ? 404 : 422;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return NextResponse.json({ data: result.value });
}

/**
 * DELETE /api/experience/[id]
 * Permanently deletes an experience.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const repository = new PrismaExperienceRepository();
  const useCase = new DeleteExperienceUseCase(repository);

  const result = await useCase.execute({
    id,
    userId: session.user.id,
  });

  if (!result.ok) {
    const status = result.error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }

  return new NextResponse(null, { status: 204 });
}
