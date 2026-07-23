import type { LlmProvider, TranslationRequest } from "../core/types";
import { classifyNetworkError } from "../core/errors";

interface OllamaModel { name: string; }

interface OllamaResponse {
  message?: { content: string };
  response?: string;
  done: boolean;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeoutMs?: number;
}

export class OllamaProvider implements LlmProvider {
  readonly name = "Ollama";
  private abortController: AbortController | null = null;

  constructor(private config: OllamaConfig) { }

  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const resp = await fetch(`${this.config.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });

    if (!resp.ok) {
      // Ollama returns a 404 for the /api/tags endpoint if not available
      throw classifyNetworkError(new Error(`HTTP ${resp.status}: ${resp.statusText}`));
    }

    const data = await resp.json();
    const models = (data.models ?? []) as OllamaModel[];
    return models.map((m) => m.name);
  }

  async translate(
    request: TranslationRequest,
    onToken: (token: string) => void,
    signal: AbortSignal,
    thinking = false,
  ): Promise<void> {
    const { buildTranslationPrompt } = await import("../core/prompt-builder");
    const { system, user } = buildTranslationPrompt(request, thinking);

    this.abortController = new AbortController();

    // Manual signal linking — AbortSignal.any() is not available in Tauri WebView
    const onExternalAbort = () => this.abortController!.abort();
    if (signal.aborted) {
      this.abortController.abort();
    } else {
      signal.addEventListener("abort", onExternalAbort, { once: true });
    }

    const resp = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: thinking ? this.config.model : `${this.config.model}/no_think`,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: this.abortController.signal,
    });

    if (!resp.ok) {
      throw classifyNetworkError(new Error(`Ollama HTTP ${resp.status}`));
    }

    // Ollama's /api/chat streaming returns NDJSON (one JSON object per line)
    const reader = resp.body?.getReader();
    if (!reader) throw classifyNetworkError(new Error("Response body is null"));

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const json: OllamaResponse = JSON.parse(line);
          if (json.message?.content) {
            onToken(json.message.content);
          }
        } catch {
          // skip malformed lines
        }
      }

      if (done) {
        // Flush remaining buffer
        if (buffer.trim()) {
          try {
            const json: OllamaResponse = JSON.parse(buffer);
            if (json.message?.content) {
              onToken(json.message.content);
            }
          } catch { /* ignore */ }
        }
        break;
      }
    }
  }
}
