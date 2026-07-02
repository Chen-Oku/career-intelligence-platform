import PDFDocument from "pdfkit";
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType } from "docx";

const TEXT = "#1a1a1a";
const GRAY = "#666666";

/**
 * CoverLetterDocumentRenderer — converts a cover letter's plain-text content
 * into downloadable PDF and Word buffers. Much simpler than
 * ResumeDocumentRenderer since the content is flowing prose, not
 * structured sections — just a header block and paragraphs split on blank lines.
 */
export class CoverLetterDocumentRenderer {
  async toPdf(content: string, name: string, date: Date): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    doc.font("Helvetica-Bold").fontSize(14).fillColor(TEXT).text(name);
    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(
      date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    );
    doc.moveDown(1.2);

    doc.font("Helvetica").fontSize(11).fillColor(TEXT);
    const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      doc.text(paragraph, { align: "left", lineGap: 2 });
      doc.moveDown(0.8);
    }

    doc.end();
    return done;
  }

  async toDocx(content: string, name: string, date: Date): Promise<Buffer> {
    const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    const children: Paragraph[] = [
      new Paragraph({
        children: [new TextRun({ text: name, bold: true, size: 24 })],
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            size: 18,
            color: "666666",
          }),
        ],
      }),
      ...paragraphs.map(
        (p) =>
          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: p, size: 22 })],
          }),
      ),
    ];

    const doc = new DocxDocument({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }
}
