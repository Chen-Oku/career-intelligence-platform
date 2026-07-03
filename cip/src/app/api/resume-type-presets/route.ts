// src/app/api/resume-type-presets/route.ts — GET (list) + POST (create)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaResumeTypePresetRepository } from "@/infrastructure/database/repositories/PrismaResumeTypePresetRepository";
import {
  CreateResumeTypePresetUseCase,
  GetResumeTypePresetsQuery,
} from "@/application/document/resume-type-preset-use-cases";
import { createResumeTypePresetSchema } from "@/lib/validators/resumeTypePreset.schema";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const result = await new GetResumeTypePresetsQuery(new PrismaResumeTypePresetRepository()).execute(session.user.id);
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

  const parsed = createResumeTypePresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await new CreateResumeTypePresetUseCase(new PrismaResumeTypePresetRepository()).execute({
    userId: session.user.id,
    ...parsed.data,
  });

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: result.value }, { status: 201 });
}
