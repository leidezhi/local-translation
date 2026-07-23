import type { LlmProvider, TranslationRequest } from "../core/types";
import { classifyNetworkError } from "../core/errors";
import { buildTranslationPrompt } from "../core/prompt-builder";

interface OpenAiChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

export interface OpenAiCompatConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = "OpenAI-compatible";

  constructor(private config: OpenAiCompatConfig) { }

  async healthCheck(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }
      const resp = await fetch(`${this.config.baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(5000),
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const headers: Record<string, string> = {};
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    const resp = await fetch(`${this.config.baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 30000),
    });

    if (!resp.ok) {
      throw classifyNetworkError(new Error(`HTTP ${resp.status}: ${resp.statusText}`));
    }

    const data = await resp.json();
    const models = (data.data ?? []) as Array<{ id: string }>;
    return models.map((m) => m.id);
  }

  async translate(
    request: TranslationRequest,
    onToken: (token: string) => void,
    signal: AbortSignal,
    thinking = false,
  ): Promise<void> {
    const { system, user } = buildTranslationPrompt(request, thinking);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const resp = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.config.model,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal,
    });

    if (!resp.ok) {
      throw classifyNetworkError(new Error(`HTTP ${resp.status}`));
    }

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
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const json: OpenAiChunk = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            onToken(content);
          }
        } catch {
          // skip malformed chunks
        }
      }

      if (done) {
        if (buffer.trim()) {
          const remaining = buffer.trim();
          if (remaining.startsWith("data: ") && remaining.slice(6).trim() !== "[DONE]") {
            try {
              const json: OpenAiChunk = JSON.parse(remaining.slice(6).trim());
              const content = json.choices?.[0]?.delta?.content;
              if (content) onToken(content);
            } catch { /* ignore */ }
          }
        }
        break;
      }
    }
  }
}
