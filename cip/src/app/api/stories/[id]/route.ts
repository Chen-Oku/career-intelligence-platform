import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { GetStoryByIdUseCase, UpdateStoryUseCase, DeleteStoryUseCase } from "@/application/career/story-use-cases";
import { updateStorySchema } from "@/lib/validators/story.schema";

type P = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const result = await new GetStoryByIdUseCase(new PrismaStoryRepository()).execute(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 404 });
  return NextResponse.json({ data: result.value });
}

export async function PATCH(req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const { id: paramId } = await params;
  const parsed = updateStorySchema.safeParse({ ...(body as Record<string, unknown>), id: paramId });
  if (!parsed.success) return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  const { id, ...updates } = parsed.data;
  const result = await new UpdateStoryUseCase(new PrismaStoryRepository()).execute({ id, userId: session.user.id, ...updates });
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: result.error.message.includes("not found") ? 404 : 422 });
  return NextResponse.json({ data: result.value });
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const result = await new DeleteStoryUseCase(new PrismaStoryRepository()).execute(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: result.error.message.includes("not found") ? 404 : 500 });
  return new NextResponse(null, { status: 204 });
}
