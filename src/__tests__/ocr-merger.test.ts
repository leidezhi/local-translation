import { describe, it, expect } from "vitest";
import { mergeOcrBlocks } from "../core/ocr-merger";
import type { OcrBlock } from "../core/types";

function block(
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  order = 0,
): OcrBlock {
  return { text, confidence: 0.9, box: { x, y, width: w, height: h }, order };
}

describe("mergeOcrBlocks", () => {
  it("returns empty string for empty input", () => {
    expect(mergeOcrBlocks([])).toBe("");
  });

  it("returns single block text", () => {
    const blocks = [block("Hello", 0, 0, 50, 20)];
    expect(mergeOcrBlocks(blocks)).toBe("Hello");
  });

  it("orders left-to-right on same line", () => {
    const blocks = [
      block("World", 60, 0, 50, 20),
      block("Hello", 0, 0, 50, 20),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("HelloWorld");
  });

  it("orders top-to-bottom for different lines", () => {
    const blocks = [
      block("Bottom", 0, 40, 50, 20),
      block("Top", 10, 0, 50, 20),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("Top\nBottom");
  });

  it("handles Chinese text reading order", () => {
    const blocks = [
      block("世界", 60, 0, 50, 20),
      block("第一行", 0, 0, 50, 20),
      block("第二行", 0, 40, 50, 20),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("第一行世界\n第二行");
  });

  it("groups nearby y-positions as same line", () => {
    // Slightly different y positions within same line threshold
    const blocks = [
      block("B", 60, 2, 50, 20),
      block("A", 0, 0, 50, 20),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("AB");
  });

  it("separates clearly different y-positions as paragraphs", () => {
    const blocks = [
      block("Para2", 0, 100, 60, 20),
      block("Para1", 0, 0, 60, 20),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("Para1\nPara2");
  });

  it("handles three columns on same line", () => {
    const blocks = [
      block("右", 120, 0, 50, 30),
      block("中", 60, 0, 50, 30),
      block("左", 0, 0, 50, 30),
    ];
    const result = mergeOcrBlocks(blocks);
    expect(result).toBe("左中右");
  });

  it("realistically merges multi-line Chinese text", () => {
    const blocks = [
      block("这是一段测试文字", 0, 0, 120, 25),
      block("用于验证阅读顺序", 0, 30, 120, 25),
      block("第三行内容在此", 0, 60, 120, 25),
    ];
    const result = mergeOcrBlocks(blocks);
    const lines = result.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("这是一段测试文字");
    expect(lines[1]).toBe("用于验证阅读顺序");
    expect(lines[2]).toBe("第三行内容在此");
  });
});
