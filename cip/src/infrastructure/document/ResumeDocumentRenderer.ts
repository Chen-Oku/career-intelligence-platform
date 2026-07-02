import PDFDocument from "pdfkit";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { ResumeContent, ResumeContact } from "@/lib/types/resume";

const ACCENT = "#C2782A";
const GRAY = "#666666";
const LIGHT_GRAY = "#888888";
const TEXT = "#1a1a1a";

const contactLine = (contact: ResumeContact): string =>
  [
    contact.location,
    contact.email,
    contact.phone,
    contact.linkedin && `linkedin.com/${contact.linkedin.replace(/^(linkedin\.com\/|\/)/i, "")}`,
    contact.portfolio,
  ]
    .filter(Boolean)
    .join("   ·   ");

/**
 * ResumeDocumentRenderer — converts ResumeContent into downloadable
 * PDF and Word buffers, mirroring the section order and styling of
 * ResumePreview.tsx (Summary → Experience → Projects → Skills → Education).
 *
 * PDF uses pdfkit directly (not @react-pdf/renderer): that library's
 * React reconciler conflicts with Next.js's "react-server" module
 * condition inside Route Handlers (confirmed — works in plain Node,
 * throws "Objects are not valid as a React child" under Next's App
 * Router). pdfkit has no React dependency, so it sidesteps the issue.
 */
export class ResumeDocumentRenderer {
  async toPdf(content: ResumeContent, contact: ResumeContact, name: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // ── Header ──────────────────────────────────────────────────────────
    doc.font("Helvetica-Bold").fontSize(18).fillColor(TEXT).text(name.toUpperCase(), { align: "center" });
    const contactText = contactLine(contact);
    if (contactText) {
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(contactText, { align: "center" });
    }
    doc.moveDown(0.8);
    ruleLine(doc, contentWidth);
    doc.moveDown(0.8);

    if (content.summary) {
      sectionTitle(doc, "PROFESSIONAL SUMMARY", contentWidth);
      doc.font("Times-Roman").fontSize(10.5).fillColor(TEXT).text(content.summary, { align: "left" });
      doc.moveDown(0.8);
    }

    if (content.experience.length > 0) {
      sectionTitle(doc, "EXPERIENCE", contentWidth);
      for (const exp of content.experience) {
        rowText(doc, exp.company, `${exp.startDate} – ${exp.endDate}`, contentWidth, {
          leftFont: "Helvetica-Bold", leftSize: 11, leftColor: TEXT,
          rightFont: "Helvetica", rightSize: 9, rightColor: GRAY,
        });
        rowText(doc, exp.position, exp.location ?? "", contentWidth, {
          leftFont: "Times-Italic", leftSize: 10.5, leftColor: TEXT,
          rightFont: "Helvetica", rightSize: 9, rightColor: LIGHT_GRAY,
        });
        doc.moveDown(0.2);
        for (const bullet of exp.bullets) {
          doc.font("Times-Roman").fontSize(10.5).fillColor(TEXT).text(`•  ${bullet}`, { indent: 4 });
        }
        doc.moveDown(0.6);
      }
    }

    if (content.projects && content.projects.length > 0) {
      sectionTitle(doc, "NOTABLE PROJECTS", contentWidth);
      for (const project of content.projects) {
        const techSuffix = project.technologies.length > 0 ? `  —  ${project.technologies.slice(0, 4).join(", ")}` : "";
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(TEXT).text(project.name + techSuffix);
        doc.font("Times-Roman").fontSize(10.5).fillColor(TEXT).text(project.description);
        if (project.url) doc.font("Helvetica").fontSize(9).fillColor(LIGHT_GRAY).text(project.url);
        doc.moveDown(0.5);
      }
    }

    if (content.skills.length > 0) {
      sectionTitle(doc, "TECHNICAL SKILLS", contentWidth);
      for (const group of content.skills) {
        doc.font("Helvetica-Bold").fontSize(10.5).fillColor(TEXT)
          .text(`${group.category}: `, { continued: true })
          .font("Times-Roman").text(group.items.join(", "));
      }
      doc.moveDown(0.4);
    }

    if (content.education.length > 0) {
      sectionTitle(doc, "EDUCATION", contentWidth);
      for (const edu of content.education) {
        rowText(doc, edu.institution, edu.year ?? "", contentWidth, {
          leftFont: "Helvetica-Bold", leftSize: 10.5, leftColor: TEXT,
          rightFont: "Helvetica", rightSize: 9, rightColor: GRAY,
        });
        doc.font("Times-Italic").fontSize(10.5).fillColor(TEXT).text(edu.degree);
        doc.moveDown(0.4);
      }
    }

    doc.end();
    return done;
  }

  async toDocx(content: ResumeContent, contact: ResumeContact, name: string): Promise<Buffer> {
    const contactText = contactLine(contact);
    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: name.toUpperCase(), bold: true, size: 32 })],
      }),
    ];

    if (contactText) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: contactText, size: 18, color: "555555" })],
        }),
      );
    }

    const sectionTitle = (title: string) =>
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "C2782A" } },
        children: [new TextRun({ text: title, bold: true, size: 22, color: "C2782A" })],
      });

    if (content.summary) {
      children.push(sectionTitle("PROFESSIONAL SUMMARY"));
      children.push(new Paragraph({ spacing: { after: 150 }, children: [new TextRun({ text: content.summary, size: 22 })] }));
    }

    if (content.experience.length > 0) {
      children.push(sectionTitle("EXPERIENCE"));
      for (const exp of content.experience) {
        children.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: exp.company, bold: true, size: 22 }),
              new TextRun({ text: `    ${exp.startDate} – ${exp.endDate}`, size: 18, color: "666666" }),
            ],
          }),
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.position, italics: true, size: 22 }),
              ...(exp.location ? [new TextRun({ text: `    ${exp.location}`, size: 18, color: "888888" })] : []),
            ],
          }),
        );
        for (const bullet of exp.bullets) {
          children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: bullet, size: 22 })] }));
        }
      }
    }

    if (content.projects && content.projects.length > 0) {
      children.push(sectionTitle("NOTABLE PROJECTS"));
      for (const project of content.projects) {
        children.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: project.name, bold: true, size: 22 }),
              ...(project.technologies.length
                ? [new TextRun({ text: `  —  ${project.technologies.slice(0, 4).join(", ")}`, size: 18, color: "888888" })]
                : []),
            ],
          }),
        );
        children.push(new Paragraph({ children: [new TextRun({ text: project.description, size: 22 })] }));
        if (project.url) {
          children.push(new Paragraph({ children: [new TextRun({ text: project.url, size: 18, color: "888888" })] }));
        }
      }
    }

    if (content.skills.length > 0) {
      children.push(sectionTitle("TECHNICAL SKILLS"));
      for (const group of content.skills) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${group.category}: `, bold: true, size: 22 }),
              new TextRun({ text: group.items.join(", "), size: 22 }),
            ],
          }),
        );
      }
    }

    if (content.education.length > 0) {
      children.push(sectionTitle("EDUCATION"));
      for (const edu of content.education) {
        children.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: edu.institution, bold: true, size: 22 }),
              ...(edu.year ? [new TextRun({ text: `    ${edu.year}`, size: 18, color: "666666" })] : []),
            ],
          }),
        );
        children.push(new Paragraph({ children: [new TextRun({ text: edu.degree, italics: true, size: 22 })] }));
      }
    }

    const doc = new DocxDocument({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }
}

// ─── PDF layout helpers ─────────────────────────────────────────────────────

function sectionTitle(doc: PDFKit.PDFDocument, title: string, contentWidth: number): void {
  doc.font("Helvetica-Bold").fontSize(10).fillColor(ACCENT).text(title, { characterSpacing: 1 });
  doc.moveDown(0.15);
  ruleLine(doc, contentWidth);
  doc.moveDown(0.4);
}

function ruleLine(doc: PDFKit.PDFDocument, contentWidth: number): void {
  const y = doc.y;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + contentWidth, y).strokeColor("#e5e5e5").lineWidth(0.75).stroke();
}

/** Draws a left-aligned label and a right-aligned label on the same line. */
function rowText(
  doc: PDFKit.PDFDocument,
  left: string,
  right: string,
  contentWidth: number,
  opts: { leftFont: string; leftSize: number; leftColor: string; rightFont: string; rightSize: number; rightColor: string },
): void {
  const y = doc.y;
  const x = doc.page.margins.left;
  doc.font(opts.leftFont).fontSize(opts.leftSize).fillColor(opts.leftColor).text(left, x, y);
  if (right) {
    doc.font(opts.rightFont).fontSize(opts.rightSize).fillColor(opts.rightColor).text(right, x, y, { width: contentWidth, align: "right" });
  }
}
