import mammoth from "mammoth";

const MIN_TEXT_LENGTH = 50;

/** Extracts plain text from a .docx buffer. Legacy .doc (binary) isn't supported. */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  const trimmed = text.trim();

  if (trimmed.length < MIN_TEXT_LENGTH) {
    throw new Error("Could not extract text from this document. It may be empty or corrupted.");
  }

  return trimmed;
}
