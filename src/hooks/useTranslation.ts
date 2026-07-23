import { useState, useRef, useCallback } from "react";
import type { TranslationRequest, TranslationMode, TaskStatus, GlossaryEntry, ClassifiedError } from "../core/types";
import type { LlmProvider } from "../core/types";
import { classifyError } from "../core/errors";

interface TranslationState {
  status: TaskStatus;
  sourceText: string;
  translatedText: string;
  error: ClassifiedError | null;
}

const initialState: TranslationState = {
  status: "idle",
  sourceText: "",
  translatedText: "",
  error: null,
};

interface UseTranslationOptions {
  provider: LlmProvider | null;
  sourceLanguage: string;
  targetLanguage: string;
  mode: TranslationMode;
  glossary: GlossaryEntry[];
}

export function useTranslation(opts: UseTranslationOptions) {
  const [state, setState] = useState<TranslationState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) =>
      s.status === "translating"
        ? { ...s, status: "cancelled", error: classifyError("用户取消", "user_cancelled") }
        : s,
    );
  }, []);

  const translate = useCallback(
    async (text: string) => {
      if (!opts.provider) {
        setState({
          status: "failed",
          sourceText: text,
          translatedText: "",
          error: classifyError("未配置翻译服务", "service_unavailable"),
        });
        return;
      }

      if (!text.trim()) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "translating",
        sourceText: text,
        translatedText: "",
        error: null,
      });

      let result = "";

      try {
        const request: TranslationRequest = {
          sourceText: text,
          sourceLanguage: opts.sourceLanguage,
          targetLanguage: opts.targetLanguage,
          mode: opts.mode,
          glossary: opts.glossary,
        };

        await opts.provider.translate(
          request,
          (token) => {
            result += token;
            setState((s) =>
              s.status === "translating" ? { ...s, translatedText: result } : s,
            );
          },
          controller.signal,
        );

        setState((s) =>
          s.status === "translating"
            ? { ...s, status: "completed", translatedText: result }
            : s,
        );
      } catch (err) {
        if (controller.signal.aborted) return; // already handled by cancel()
        const { classifyNetworkError } = await import("../core/errors");
        setState((s) =>
          s.status === "translating"
            ? { ...s, status: "failed", error: classifyNetworkError(err) }
            : s,
        );
      }
    },
    [opts.provider, opts.sourceLanguage, opts.targetLanguage, opts.mode, opts.glossary],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  return { state, translate, cancel, reset };
}
