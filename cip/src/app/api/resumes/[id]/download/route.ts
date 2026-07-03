import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";
import { PrismaResumeRepository } from "@/infrastructure/database/repositories/PrismaResumeRepository";
import { ResumeDocumentRenderer } from "@/infrastructure/document/ResumeDocumentRenderer";
import type { ResumeContent, ResumeContact } from "@/lib/types/resume";

type P = { params: Promise<{ id: string }> };

const formatSchema = z.enum(["pdf", "docx"]);

const CONTENT_TYPES: Record<"pdf" | "docx", string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "resume";
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
  const repo = new PrismaResumeRepository();
  const resume = await repo.findById(id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { displayName: true, name: true } });
  const name = user?.displayName?.trim() || user?.name || "Professional";

  const renderer = new ResumeDocumentRenderer();
  const content = resume.content as ResumeContent;
  const contact = resume.contact as ResumeContact;
  const buffer = format === "pdf"
    ? await renderer.toPdf(content, contact, name, resume.targetRole)
    : await renderer.toDocx(content, contact, name, resume.targetRole);

  const filename = `${sanitizeFilename(resume.title)}.${format}`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
