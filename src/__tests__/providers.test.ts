import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TranslationRequest, LlmProvider } from "../core/types";

const baseRequest: TranslationRequest = {
  sourceText: "Hello",
  sourceLanguage: "en",
  targetLanguage: "zh",
  mode: "natural",
  glossary: [],
};

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper: create a mock streaming response for Ollama (NDJSON)
function mockOllamaStream(tokens: string[]): Response {
  const body = new ReadableStream({
    start(controller) {
      for (const token of tokens) {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ message: { content: token }, done: false }) + "\n",
          ),
        );
      }
      controller.enqueue(
        new TextEncoder().encode(
          JSON.stringify({ message: { content: "" }, done: true }) + "\n",
        ),
      );
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

// Helper: create a mock SSE streaming response for OpenAI-compatible
function mockOpenAiStream(tokens: string[]): Response {
  const body = new ReadableStream({
    start(controller) {
      for (const token of tokens) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { content: token } }],
            })}\n\n`,
          ),
        );
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

function mockJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("OllamaProvider", () => {
  let provider: LlmProvider;

  beforeEach(async () => {
    mockFetch.mockReset();
    // Dynamic import to avoid stale mocks
    const mod = await import("../providers/ollama");
    provider = new mod.OllamaProvider({
      baseUrl: "http://localhost:11434",
      model: "qwen2.5:7b",
    });
  });

  it("streams tokens from Ollama chat API", async () => {
    mockFetch.mockResolvedValueOnce(mockOllamaStream(["你", "好", "世界"]));

    const tokens: string[] = [];
    await provider.translate(baseRequest, (t) => tokens.push(t), new AbortController().signal);

    expect(tokens).toEqual(["你", "好", "世界"]);
  });

  it("sends system+user messages to /api/chat", async () => {
    mockFetch.mockResolvedValueOnce(mockOllamaStream(["test"]));

    await provider.translate(
      { ...baseRequest, sourceText: "Hello world", sourceLanguage: "en", targetLanguage: "zh" },
      () => {},
      new AbortController().signal,
      true, // thinking enabled
    );

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("/api/chat");
    const body = JSON.parse(call[1].body);
    expect(body.model).toBe("qwen2.5:7b");
    expect(body.stream).toBe(true);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[1].role).toBe("user");
  });

  it("adds no-thinking instruction when thinking is disabled", async () => {
    mockFetch.mockResolvedValueOnce(mockOllamaStream(["test"]));

    await provider.translate(baseRequest, () => {}, new AbortController().signal, false);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("qwen2.5:7b"); // no /no_think suffix
    expect(body.messages[1].content).toContain("不要展示任何思考过程");
  });

  it("healthCheck returns true on success", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ models: [] }));
    const ok = await provider.healthCheck!();
    expect(ok).toBe(true);
  });
});

describe("OpenAiCompatibleProvider", () => {
  let provider: LlmProvider;

  beforeEach(async () => {
    mockFetch.mockReset();
    const mod = await import("../providers/openai-compat");
    provider = new mod.OpenAiCompatibleProvider({
      baseUrl: "http://localhost:8080/v1",
      model: "local-model",
    });
  });

  it("streams tokens from SSE chat completions", async () => {
    mockFetch.mockResolvedValueOnce(mockOpenAiStream(["Hello", " ", "世界"]));

    const tokens: string[] = [];
    await provider.translate(baseRequest, (t) => tokens.push(t), new AbortController().signal);

    expect(tokens).toEqual(["Hello", " ", "世界"]);
  });

  it("translates with glossary terms", async () => {
    mockFetch.mockResolvedValueOnce(mockOpenAiStream(["接口"]));

    const tokens: string[] = [];
    await provider.translate(
      { ...baseRequest, glossary: [{ source: "API", target: "接口" }] },
      (t) => tokens.push(t),
      new AbortController().signal,
    );

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.messages[1].content).toContain("API → 接口");
    expect(tokens).toEqual(["接口"]);
  });

  it("includes Authorization header when apiKey is set", async () => {
    mockFetch.mockResolvedValueOnce(mockOpenAiStream(["test"]));
    const { OpenAiCompatibleProvider: Provider } = await import("../providers/openai-compat");
    const p = new Provider({
      baseUrl: "http://localhost:8080/v1",
      model: "test",
      apiKey: "sk-test",
    });

    await p.translate(baseRequest, () => {}, new AbortController().signal);

    const call = mockFetch.mock.calls[0];
    expect(call[1].headers["Authorization"]).toBe("Bearer sk-test");
  });

  it("cancels on abort signal", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider.translate(baseRequest, () => {}, controller.signal),
    ).rejects.toThrow();
  });
});
