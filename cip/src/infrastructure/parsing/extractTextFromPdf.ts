import { PDFParse } from "pdf-parse";

const MIN_TEXT_LENGTH = 50;

/**
 * Extracts plain text from a PDF buffer.
 *
 * Scanned PDFs (image-only, no selectable text) produce near-empty output —
 * we don't support OCR, so we fail early with a clear message instead of
 * sending near-empty text to the AI and getting a confusing extraction.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const { text } = await parser.getText();
    const trimmed = text.trim();

    if (trimmed.length < MIN_TEXT_LENGTH) {
      throw new Error(
        "Could not extract text from this PDF. It may be a scanned image without selectable text.",
      );
    }

    return trimmed;
  } finally {
    await parser.destroy();
  }
}
