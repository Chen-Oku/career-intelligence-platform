// src/app/api/certifications/route.ts — GET (list) + POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaCertificationRepository } from "@/infrastructure/database/repositories/PrismaCertificationRepository";
import {
  CreateCertificationUseCase,
  GetCertificationsQuery,
  ClearAllCertificationsUseCase,
} from "@/application/career/certification-use-cases";
import { createCertificationSchema } from "@/lib/validators/certification.schema";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new GetCertificationsQuery(new PrismaCertificationRepository()).execute(session.user.id);
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

  const parsed = createCertificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new CreateCertificationUseCase(new PrismaCertificationRepository()).execute({
    userId: session.user.id,
    ...parsed.data,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}

/** DELETE /api/certifications — deletes every certification owned by the authenticated user. */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new ClearAllCertificationsUseCase(new PrismaCertificationRepository()).execute(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
