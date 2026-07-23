import type { OcrBlock } from "./types";

/**
 * Merge OCR blocks into a reading-order paragraph string.
 * Blocks are sorted top-to-bottom, left-to-right (line-aware).
 *
 * Two blocks are on the same "line" if their vertical midpoints
 * are within a threshold of each other.
 */
const LINE_MERGE_THRESHOLD = 0.5; // fraction of block height

function blockMidY(b: OcrBlock): number {
  return b.box.y + b.box.height / 2;
}

function isSameLine(a: OcrBlock, b: OcrBlock): boolean {
  const midA = blockMidY(a);
  const midB = blockMidY(b);
  const threshold = Math.min(a.box.height, b.box.height) * LINE_MERGE_THRESHOLD;
  return Math.abs(midA - midB) <= threshold;
}

/**
 * Group blocks by line, sorted top-to-bottom.
 * Within each line, blocks are sorted left-to-right.
 */
export function mergeOcrBlocks(blocks: OcrBlock[]): string {
  if (blocks.length === 0) return "";

  const sorted = [...blocks].sort((a, b) => {
    const yDiff = blockMidY(a) - blockMidY(b);
    if (Math.abs(yDiff) > Math.min(a.box.height, b.box.height) * LINE_MERGE_THRESHOLD) {
      return yDiff;
    }
    return a.box.x - b.box.x;
  });

  const lines: OcrBlock[][] = [];
  for (const block of sorted) {
    const lastLine = lines[lines.length - 1];
    if (lastLine && isSameLine(lastLine[0], block)) {
      lastLine.push(block);
    } else {
      lines.push([block]);
    }
  }

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.box.x - b.box.x)
        .map((b) => b.text)
        .join(""),
    )
    .join("\n");
}
