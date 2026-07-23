import { describe, it, expect } from "vitest";
import { chunkText, reassembleChunks } from "../core/text-chunker";

describe("chunkText", () => {
  it("returns single chunk for short text", () => {
    const result = chunkText("Short text", 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Short text");
  });

  it("splits at paragraph boundaries", () => {
    const text = "Paragraph 1.\n\nParagraph 2.";
    const result = chunkText(text, 20);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // Each paragraph should be preserved
    expect(result.join("\n\n")).toContain("Paragraph 1");
    expect(result.join("\n\n")).toContain("Paragraph 2");
  });

  it("respects maxChars limit", () => {
    const text = "A".repeat(5000);
    const result = chunkText(text, 1000);
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1050); // small tolerance
    }
  });

  it("preserves content after round-trip split+reassemble", () => {
    const original = "Line 1\n\nLine 2\n\nLine 3";
    const chunks = chunkText(original, 10);
    const reassembled = reassembleChunks(chunks);
    expect(reassembled).toBe(original);
  });

  it("handles text at exact chunk boundary", () => {
    const text = "A".repeat(3000);
    const result = chunkText(text, 3000);
    expect(result).toHaveLength(1);
  });

  it("handles empty text", () => {
    const result = chunkText("", 100);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("");
  });

  it("does not create empty chunks", () => {
    const text = "\n\n\nA\n\n\n";
    const result = chunkText(text, 100);
    for (const chunk of result) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it("preserves newline structure within a chunk", () => {
    const text = "Line1\nLine2\nLine3";
    const result = chunkText(text, 1000);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("\n");
  });
});

describe("reassembleChunks", () => {
  it("joins chunks with double newlines", () => {
    const result = reassembleChunks(["A", "B", "C"]);
    expect(result).toBe("A\n\nB\n\nC");
  });

  it("returns single chunk unchanged", () => {
    expect(reassembleChunks(["Only"])).toBe("Only");
  });

  it("returns empty string for empty array", () => {
    expect(reassembleChunks([])).toBe("");
  });
});
