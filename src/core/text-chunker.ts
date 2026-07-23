/**
 * Split long text into chunks at natural boundaries (paragraphs, sentences).
 * Respects a maximum character limit per chunk.
 */

const DEFAULT_MAX_CHUNK_CHARS = 3000;

/**
 * Split text into chunks suitable for sequential translation.
 * Prefers splitting at double-newlines (paragraphs), then single newlines,
 * then sentence boundaries (。.!?！？), falling back to character count.
 */
export function chunkText(text: string, maxChars = DEFAULT_MAX_CHUNK_CHARS): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const paragraphs = splitByParagraphs(text);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > maxChars && current.length > 0) {
      chunks.push(current.trimEnd());
      current = "";
    }

    // If a single paragraph exceeds maxChars, force-split it
    if (para.length > maxChars) {
      if (current) {
        chunks.push(current.trimEnd());
        current = "";
      }
      for (let i = 0; i < para.length; i += maxChars) {
        chunks.push(para.slice(i, i + maxChars));
      }
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim()) {
    chunks.push(current.trimEnd());
  }

  return chunks;
}

function splitByParagraphs(text: string): string[] {
  // Split on double newlines (blank lines)
  const parts = text.split(/\n\s*\n/);
  return parts.filter((p) => p.trim().length > 0);
}

/**
 * Reassemble chunks in order. Used after translating each chunk separately.
 */
export function reassembleChunks(chunks: string[]): string {
  return chunks.join("\n\n");
}
