// src/app/api/certifications/[id]/route.ts — PATCH (update) + DELETE
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaCertificationRepository } from "@/infrastructure/database/repositories/PrismaCertificationRepository";
import {
  UpdateCertificationUseCase,
  DeleteCertificationUseCase,
} from "@/application/career/certification-use-cases";
import { updateCertificationSchema } from "@/lib/validators/certification.schema";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = updateCertificationSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new UpdateCertificationUseCase(new PrismaCertificationRepository()).execute({
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

  const result = await new DeleteCertificationUseCase(new PrismaCertificationRepository()).execute(id, session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return new NextResponse(null, { status: 204 });
}
