import { describe, it, expect } from "vitest";
import { classifyError, classifyNetworkError } from "../core/errors";

describe("classifyError", () => {
  it("returns correct category and suggestion", () => {
    const result = classifyError(new Error("test"), "timeout");
    expect(result.category).toBe("timeout");
    expect(result.suggestion).toContain("超时");
  });

  it("handles non-Error input", () => {
    const result = classifyError("plain string", "unknown");
    expect(result.message).toBe("plain string");
    expect(result.category).toBe("unknown");
  });

  it("preserves original error as cause", () => {
    const original = new Error("original");
    const result = classifyError(original, "database_error");
    expect(result.cause).toBe(original);
  });

  it("every error category has a suggestion", () => {
    const categories = [
      "service_unavailable", "connection_refused", "timeout",
      "model_not_found", "invalid_response", "user_cancelled",
      "ocr_missing_language", "ocr_no_text", "ocr_engine_error",
      "screenshot_failed", "hotkey_conflict", "database_error",
      "input_too_long", "unknown",
    ] as const;
    for (const cat of categories) {
      const result = classifyError(new Error("test"), cat);
      expect(result.suggestion).toBeTruthy();
      expect(result.suggestion.length).toBeGreaterThan(0);
    }
  });
});

describe("classifyNetworkError", () => {
  it("detects connection refused", () => {
    const result = classifyNetworkError(new Error("Connection refused"));
    expect(result.category).toBe("connection_refused");
  });

  it("detects timeout", () => {
    const result = classifyNetworkError(new Error("Request timed out"));
    expect(result.category).toBe("timeout");
  });

  it("detects model not found", () => {
    const result = classifyNetworkError(new Error("model not found"));
    expect(result.category).toBe("model_not_found");
  });

  it("falls back to service_unavailable", () => {
    const result = classifyNetworkError(new Error("some random network error"));
    expect(result.category).toBe("service_unavailable");
  });
});
