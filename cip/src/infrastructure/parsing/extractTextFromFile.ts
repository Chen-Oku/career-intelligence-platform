import { extractTextFromPdf } from "./extractTextFromPdf";
import { extractTextFromDocx } from "./extractTextFromDocx";

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

/** Dispatches to the right text extractor based on the file's MIME type. */
export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case "application/pdf":
      return extractTextFromPdf(buffer);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return extractTextFromDocx(buffer);
    default:
      throw new Error("Unsupported file type. Upload a PDF or Word (.docx) file.");
  }
}
