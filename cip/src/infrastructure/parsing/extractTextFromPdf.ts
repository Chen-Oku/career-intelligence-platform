import { extractText, getDocumentProxy } from "unpdf";

const MIN_TEXT_LENGTH = 50;

/**
 * Extracts plain text from a PDF buffer.
 *
 * Uses unpdf instead of pdf-parse: pdf-parse (v2+) wraps pdfjs-dist's full
 * build, which requires @napi-rs/canvas and DOMMatrix/ImageData/Path2D at
 * import time — none of which are reliably available in Vercel's Node.js
 * serverless runtime, so imports there threw "DOMMatrix is not defined"
 * even though we only ever need text, never rendering. unpdf ships a
 * canvas-free serverless build of pdfjs-dist specifically for this case.
 *
 * Scanned PDFs (image-only, no selectable text) produce near-empty output —
 * we don't support OCR, so we fail early with a clear message instead of
 * sending near-empty text to the AI and getting a confusing extraction.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  const trimmed = text.trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw new Error(
      "Could not extract text from this PDF. It may be a scanned image without selectable text.",
    );
  }

  return trimmed;
}
