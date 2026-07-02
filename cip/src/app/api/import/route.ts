// src/app/api/import/route.ts — POST: extract career data from an uploaded CV/resume (PDF or Word)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractTextFromFile, SUPPORTED_MIME_TYPES } from "@/infrastructure/parsing/extractTextFromFile";
import { CVImportService } from "@/infrastructure/ai/gemini/CVImportService";
import { ImportCareerDataUseCase } from "@/application/career/commands/ImportCareerData";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!SUPPORTED_MIME_TYPES.includes(file.type as typeof SUPPORTED_MIME_TYPES[number])) {
    return NextResponse.json({ error: "Only PDF or Word (.docx) files are supported." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)." }, { status: 400 });
  }

  let rawText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    rawText = await extractTextFromFile(buffer, file.type);
  } catch (error) {
    console.error("[import] text extraction failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not read the file." },
      { status: 422 },
    );
  }

  const useCase = new ImportCareerDataUseCase(new CVImportService());
  const result = await useCase.execute(rawText);

  if (!result.ok) {
    console.error("[import] AI extraction failed:", result.error);
    return NextResponse.json({ error: result.error.message }, { status: 422 });
  }

  return NextResponse.json({ data: result.value });
}
