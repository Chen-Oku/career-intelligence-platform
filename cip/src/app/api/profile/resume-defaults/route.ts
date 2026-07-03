// src/app/api/profile/resume-defaults/route.ts — GET/PUT the contact
// defaults prefilled into the resume generator.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import { UpdateResumeDefaultsUseCase } from "@/application/identity/commands/UpdateResumeDefaults";
import { resumeDefaultsSchema } from "@/lib/validators/resume.schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, contactInfo: true },
  });

  // Stored blob is validated on write, but re-parse on read so a manual
  // DB edit can't feed the form malformed data — fall back to empty defaults.
  const parsed = resumeDefaultsSchema.safeParse({
    displayName: user?.displayName ?? undefined,
    contact: user?.contactInfo ?? {},
  });

  return NextResponse.json({
    data: parsed.success ? parsed.data : { contact: {} },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = resumeDefaultsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new UpdateResumeDefaultsUseCase().execute({
    userId: session.user.id,
    defaults: parsed.data,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: parsed.data });
}
