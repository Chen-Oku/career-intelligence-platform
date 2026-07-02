import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import { PrismaCoverLetterRepository } from "@/infrastructure/database/repositories/PrismaCoverLetterRepository";
import { CoverLetterDocumentRenderer } from "@/infrastructure/document/CoverLetterDocumentRenderer";

type P = { params: Promise<{ id: string }> };

const formatSchema = z.enum(["pdf", "docx"]);

const CONTENT_TYPES: Record<"pdf" | "docx", string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function sanitizeFilename(company: string): string {
  return company.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "cover-letter";
}

export async function GET(req: NextRequest, { params }: P) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const parsedFormat = formatSchema.safeParse(req.nextUrl.searchParams.get("format"));
  if (!parsedFormat.success) {
    return NextResponse.json({ error: "format must be 'pdf' or 'docx'." }, { status: 400 });
  }
  const format = parsedFormat.data;

  const { id } = await params;
  const repo = new PrismaCoverLetterRepository();
  const coverLetter = await repo.findById(id, session.user.id);
  if (!coverLetter) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const name = user?.name ?? "Professional";

  const renderer = new CoverLetterDocumentRenderer();
  const buffer = format === "pdf"
    ? await renderer.toPdf(coverLetter.content, name, coverLetter.createdAt)
    : await renderer.toDocx(coverLetter.content, name, coverLetter.createdAt);

  const filename = `cover-letter-${sanitizeFilename(coverLetter.company)}.${format}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
