// src/app/api/interview-prep/save/route.ts — POST: save an edited interview-prep answer
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SaveInterviewPrepAnswerUseCase } from "@/application/intelligence/commands/SaveInterviewPrepAnswer";
import { saveInterviewPrepSchema } from "@/lib/validators/interviewPrep.schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = saveInterviewPrepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", details: parsed.error.flatten() }, { status: 400 });
  }

  const useCase = new SaveInterviewPrepAnswerUseCase();
  const result = await useCase.execute({ userId: session.user.id, ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 422 });
  return NextResponse.json({ data: parsed.data });
}
